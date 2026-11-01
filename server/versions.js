import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { applySandboxPatch, readSandboxFile, discardSandboxPatch } from './patches.js';
import { normalizeProjectPath } from './projects.js';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function safeId(value, label) {
  if (typeof value !== 'string' || !idPattern.test(value)) {
    throw Object.assign(new Error(`Invalid ${label}.`), { code: 'INVALID_VERSION_ID', statusCode: 400 });
  }
  return value;
}

async function readManifest(versionsRoot, sessionId, versionId) {
  const session = safeId(sessionId, 'session ID');
  const version = safeId(versionId, 'version ID');
  const filename = path.join(versionsRoot, session, version, 'manifest.json');
  let record;
  try {
    record = JSON.parse(await readFile(filename, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw Object.assign(new Error('Repair version not found.'), { code: 'VERSION_NOT_FOUND', statusCode: 404 });
    throw error;
  }
  if (record.id !== version || record.sessionId !== session || !Array.isArray(record.files)) throw new Error('Version manifest is invalid.');
  return record;
}

export async function createSandboxVersion({ versionsRoot, sessionId, sandboxPath, label, files, parentVersionId = null }) {
  const session = safeId(sessionId, 'session ID');
  if (typeof label !== 'string' || !label.trim() || label.length > 100) throw new TypeError('Version label must be 1–100 characters.');
  if (!Array.isArray(files) || files.length === 0 || files.length > 200) throw new TypeError('A version must include between 1 and 200 sandbox files.');
  const safeFiles = [...new Set(files.map(normalizeProjectPath))];
  if (safeFiles.length !== files.length) throw new Error('Version file list contains duplicates.');
  const existing = await listSandboxVersions({ versionsRoot, sessionId: session });
  const id = randomUUID();
  const sequence = existing.length ? Math.max(...existing.map((version) => version.sequence)) + 1 : 1;
  const versionDirectory = path.join(versionsRoot, session, id);
  const manifest = {
    id,
    sessionId: session,
    sequence,
    label: label.trim(),
    parentVersionId,
    createdAt: new Date().toISOString(),
    files: [],
  };
  try {
    await mkdir(path.join(versionDirectory, 'files'), { recursive: true });
    for (const file of safeFiles) {
      const snapshot = await readSandboxFile(sandboxPath, file);
      const destination = path.join(versionDirectory, 'files', ...file.split('/'));
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, snapshot.content, { flag: 'wx' });
      manifest.files.push({ path: file, sha256: snapshot.sha256, bytes: Buffer.byteLength(snapshot.content, 'utf8') });
    }
    await writeFile(path.join(versionDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
    return manifest;
  } catch (error) {
    await rm(versionDirectory, { recursive: true, force: true });
    throw error;
  }
}

export async function listSandboxVersions({ versionsRoot, sessionId }) {
  const session = safeId(sessionId, 'session ID');
  const directory = path.join(versionsRoot, session);
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => error.code === 'ENOENT' ? [] : Promise.reject(error));
  const versions = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !idPattern.test(entry.name)) continue;
    try {
      versions.push(await readManifest(versionsRoot, session, entry.name));
    } catch {
      // Ignore incomplete snapshots left by interrupted writes.
    }
  }
  return versions.sort((a, b) => a.sequence - b.sequence);
}

export async function getSandboxVersion({ versionsRoot, sessionId, versionId }) {
  const version = await readManifest(versionsRoot, sessionId, versionId);
  return version;
}

export async function restoreSandboxVersion({ versionsRoot, sessionId, sandboxPath, versionId }) {
  const versions = await listSandboxVersions({ versionsRoot, sessionId });
  const target = versions.find((version) => version.id === versionId);
  const latest = versions.at(-1);
  if (!target || !latest) throw new Error('Requested sandbox version was not found.');
  if (target.id === latest.id) throw new Error('Sandbox already matches the selected latest version.');

  const latestFiles = new Map(latest.files.map((file) => [file.path, file]));
  const currentContents = new Map();
  for (const file of target.files) {
    const current = await readSandboxFile(sandboxPath, file.path);
    const latestFile = latestFiles.get(file.path);
    if (!latestFile || current.sha256 !== latestFile.sha256) {
      throw Object.assign(new Error(`Sandbox file changed since version ${latest.sequence}: ${file.path}`), { code: 'VERSION_CONFLICT', statusCode: 409 });
    }
    currentContents.set(file.path, current);
  }

  const beforeRestore = await createSandboxVersion({
    versionsRoot, sessionId, sandboxPath, label: `Before restore to v${target.sequence}`,
    files: target.files.map((file) => file.path), parentVersionId: latest.id,
  });
  const patches = [];
  try {
    for (const file of target.files) {
      const current = currentContents.get(file.path);
      const snapshotPath = path.join(versionsRoot, sessionId, target.id, 'files', ...file.path.split('/'));
      const info = await lstat(snapshotPath);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error('Version snapshot contains an unsafe file.');
      const replacement = await readFile(snapshotPath, 'utf8');
      if (sha256(replacement) !== file.sha256) throw new Error(`Version snapshot hash mismatch: ${file.path}`);
      if (replacement === current.content) continue;
      patches.push(await applySandboxPatch({
        sandboxPath,
        file: file.path,
        replacement,
        expectedBeforeHash: current.sha256,
        reason: `Restore sandbox version ${target.sequence}.`,
      }));
    }
    const restoredVersion = await createSandboxVersion({
      versionsRoot, sessionId, sandboxPath, label: `Restored v${target.sequence}`,
      files: target.files.map((file) => file.path), parentVersionId: beforeRestore.id,
    });
    return { restoredVersion, beforeRestore, changedFiles: patches.map(({ file }) => file) };
  } catch (error) {
    for (const patch of patches.reverse()) {
      await discardSandboxPatch({ sandboxPath, patch }).catch(() => {});
    }
    throw error;
  }
}
