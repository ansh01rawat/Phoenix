import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSandboxVersion, listSandboxVersions, restoreSandboxVersion } from '../versions.js';

test('sandbox versions persist, restore a selected version, and preserve the source copy', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-versions-'));
  const workspace = path.join(root, 'sandbox');
  const versionsRoot = path.join(root, 'versions');
  const sessionId = '9fc4a11b-9af1-4be6-9f4c-9e8ed468b34d';
  const source = path.join(root, 'source.js');
  const baseline = 'const mode = "broken";\n';
  const repaired = 'const mode = "fixed";\n';
  await mkdir(workspace);
  await writeFile(path.join(workspace, 'app.js'), baseline);
  await writeFile(source, 'original copy is separate');
  try {
    const v1 = await createSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, label: 'Baseline', files: ['app.js'] });
    await writeFile(path.join(workspace, 'app.js'), repaired);
    const v2 = await createSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, label: 'Proposed repair', files: ['app.js'], parentVersionId: v1.id });

    const restored = await restoreSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, versionId: v1.id });
    assert.equal(restored.restoredVersion.label, 'Restored v1');
    assert.deepEqual(restored.changedFiles, ['app.js']);
    assert.equal(await readFile(path.join(workspace, 'app.js'), 'utf8'), baseline);
    assert.equal(await readFile(source, 'utf8'), 'original copy is separate');
    const versions = await listSandboxVersions({ versionsRoot, sessionId });
    assert.deepEqual(versions.map((version) => version.sequence), [1, 2, 3, 4]);
    assert.equal(versions[1].id, v2.id);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('version restore rejects untracked sandbox changes and preserves them', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-versions-'));
  const workspace = path.join(root, 'sandbox');
  const versionsRoot = path.join(root, 'versions');
  const sessionId = '9fc4a11b-9af1-4be6-9f4c-9e8ed468b34d';
  await mkdir(workspace);
  await writeFile(path.join(workspace, 'app.js'), 'baseline');
  try {
    const baseline = await createSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, label: 'Baseline', files: ['app.js'] });
    await writeFile(path.join(workspace, 'app.js'), 'known next version');
    await createSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, label: 'Latest', files: ['app.js'] });
    await writeFile(path.join(workspace, 'app.js'), 'untracked edit');
    await assert.rejects(restoreSandboxVersion({ versionsRoot, sessionId, sandboxPath: workspace, versionId: baseline.id }), { code: 'VERSION_CONFLICT' });
    assert.equal(await readFile(path.join(workspace, 'app.js'), 'utf8'), 'untracked edit');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
