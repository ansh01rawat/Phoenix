import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { normalizeProjectPath } from './projects.js';

export const MAX_PATCH_BYTES = 1024 * 1024;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isWithin(root, target) {
  const pathFromRoot = relative(root, target);
  return pathFromRoot !== '' && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot);
}

function changedLines(before, after) {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < oldLines.length - prefix && suffix < newLines.length - prefix
    && oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]) suffix += 1;
  return [
    ...oldLines.slice(prefix, oldLines.length - suffix).map((line) => `-${line}`),
    ...newLines.slice(prefix, newLines.length - suffix).map((line) => `+${line}`),
  ].join('\n');
}

async function resolveSandboxFile(sandboxPath, relativePath) {
  const safePath = normalizeProjectPath(relativePath);
  const root = await realpath(resolve(sandboxPath));
  const destination = resolve(root, ...safePath.split('/'));
  if (!isWithin(root, destination)) throw new Error('Patch path must stay inside the sandbox.');
  const parent = await realpath(dirname(destination));
  if (parent !== root && !isWithin(root, parent)) throw new Error('Patch path resolves outside the sandbox.');
  const info = await lstat(destination);
  if (info.isSymbolicLink() || !info.isFile()) throw new Error('Patches can only change regular files inside the sandbox.');
  const actual = await realpath(destination);
  if (!isWithin(root, actual)) throw new Error('Patch target resolves outside the sandbox.');
  return { root, destination, safePath };
}

async function writeAtomically(destination, contents) {
  const temporary = `${destination}.phoenix-${randomUUID()}.tmp`;
  await writeFile(temporary, contents, { flag: 'wx' });
  await rename(temporary, destination);
}

export async function applySandboxPatch({ sandboxPath, file, replacement, expectedBeforeHash, reason }) {
  if (typeof replacement !== 'string' || typeof reason !== 'string' || !reason.trim()) {
    throw new TypeError('A patch needs replacement text and a non-empty reason.');
  }
  if (Buffer.byteLength(replacement, 'utf8') > MAX_PATCH_BYTES) throw new Error('Patch content exceeds the 1 MB limit.');
  if (typeof expectedBeforeHash !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedBeforeHash)) {
    throw new TypeError('A valid before-content SHA-256 hash is required.');
  }

  const { destination, safePath } = await resolveSandboxFile(sandboxPath, file);
  const before = await readFile(destination, 'utf8');
  const beforeHash = sha256(before);
  if (beforeHash !== expectedBeforeHash.toLowerCase()) {
    throw Object.assign(new Error('Patch target changed after the repair plan was prepared.'), { code: 'PATCH_CONFLICT', statusCode: 409 });
  }
  const afterHash = sha256(replacement);
  if (afterHash === beforeHash) throw new Error('Patch does not change the target file.');
  await writeAtomically(destination, replacement);

  return {
    id: randomUUID(),
    file: safePath,
    beforeHash,
    afterHash,
    diff: `--- a/${safePath}\n+++ b/${safePath}\n${changedLines(before, replacement)}`,
    reason: reason.trim(),
    beforeContent: before,
    afterContent: replacement,
  };
}

export async function readSandboxFile(sandboxPath, file) {
  const { destination, safePath } = await resolveSandboxFile(sandboxPath, file);
  const content = await readFile(destination, 'utf8');
  return { file: safePath, content, sha256: sha256(content) };
}

export async function discardSandboxPatch({ sandboxPath, patch }) {
  if (!patch || typeof patch.file !== 'string' || typeof patch.beforeContent !== 'string' || typeof patch.afterHash !== 'string') {
    throw new TypeError('A valid sandbox patch record is required to discard a patch.');
  }
  const { destination } = await resolveSandboxFile(sandboxPath, patch.file);
  const current = await readFile(destination, 'utf8');
  if (sha256(current) !== patch.afterHash) {
    throw Object.assign(new Error('Sandbox file changed after the patch; discard was not applied.'), { code: 'PATCH_CONFLICT', statusCode: 409 });
  }
  if (sha256(patch.beforeContent) !== patch.beforeHash) throw new Error('Patch baseline hash is invalid.');
  await writeAtomically(destination, patch.beforeContent);
  return { file: patch.file, restoredHash: patch.beforeHash };
}
