import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applySandboxPatch, discardSandboxPatch } from '../patches.js';

const hash = (value) => createHash('sha256').update(value).digest('hex');

test('patch manager edits only the sandbox target and can safely discard the patch', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-patch-'));
  const sandbox = path.join(root, 'sandbox');
  const original = path.join(root, 'source.js');
  await mkdir(sandbox);
  await writeFile(path.join(sandbox, 'app.js'), 'const target = "broken";\n');
  await writeFile(original, 'original stays untouched');
  try {
    const patch = await applySandboxPatch({
      sandboxPath: sandbox,
      file: 'app.js',
      replacement: 'const target = "fixed";\n',
      expectedBeforeHash: hash('const target = "broken";\n'),
      reason: 'Correct the target selector.',
    });
    assert.equal((await readFile(path.join(sandbox, 'app.js'), 'utf8')).includes('fixed'), true);
    assert.equal(await readFile(original, 'utf8'), 'original stays untouched');
    assert.match(patch.diff, /-const target = "broken";/);
    assert.equal(patch.beforeHash, hash('const target = "broken";\n'));
    assert.equal(patch.afterHash, hash('const target = "fixed";\n'));
    await discardSandboxPatch({ sandboxPath: sandbox, patch });
    assert.equal(await readFile(path.join(sandbox, 'app.js'), 'utf8'), 'const target = "broken";\n');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('patch manager rejects traversal, stale baselines and post-patch conflicts', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-patch-'));
  await writeFile(path.join(root, 'app.js'), 'before');
  try {
    await assert.rejects(applySandboxPatch({ sandboxPath: root, file: '../outside', replacement: 'x', expectedBeforeHash: hash('before'), reason: 'test' }), /traversal/);
    await assert.rejects(applySandboxPatch({ sandboxPath: root, file: 'app.js', replacement: 'after', expectedBeforeHash: hash('stale'), reason: 'test' }), { code: 'PATCH_CONFLICT' });
    const patch = await applySandboxPatch({ sandboxPath: root, file: 'app.js', replacement: 'after', expectedBeforeHash: hash('before'), reason: 'test' });
    await writeFile(path.join(root, 'app.js'), 'other edit');
    await assert.rejects(discardSandboxPatch({ sandboxPath: root, patch }), { code: 'PATCH_CONFLICT' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('patch manager rejects a symlink target', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-patch-'));
  const sandbox = path.join(root, 'sandbox');
  await mkdir(sandbox);
  await writeFile(path.join(root, 'outside.js'), 'outside');
  try {
    try {
      await symlink(path.join(root, 'outside.js'), path.join(sandbox, 'linked.js'));
    } catch (error) {
      if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return t.skip('Symlink creation is not permitted in this environment.');
      throw error;
    }
    await assert.rejects(applySandboxPatch({
      sandboxPath: sandbox,
      file: 'linked.js',
      replacement: 'modified',
      expectedBeforeHash: hash('outside'),
      reason: 'malicious test',
    }), /regular files inside the sandbox/);
    assert.equal(await readFile(path.join(root, 'outside.js'), 'utf8'), 'outside');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
