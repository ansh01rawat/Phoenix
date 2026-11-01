import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildDockerCreateArgs, runInIsolatedContainer, SandboxUnavailableError } from '../sandbox.js';

test('Docker container configuration removes network/privileges and mounts source read-only', () => {
  const args = buildDockerCreateArgs({
    containerName: 'phoenix-test',
    workspacePath: 'C:/phoenix/sandbox',
    sourcePath: 'C:/phoenix/source',
  });
  assert.ok(args.includes('--network') && args[args.indexOf('--network') + 1] === 'none');
  assert.ok(args.includes('--read-only'));
  assert.ok(args.includes('--cap-drop') && args[args.indexOf('--cap-drop') + 1] === 'ALL');
  assert.ok(args.includes('--pids-limit') && args[args.indexOf('--pids-limit') + 1] === '64');
  assert.ok(args.some((arg) => arg.includes('dst=/source,readonly')));
  assert.ok(!args.some((arg) => arg.toLowerCase().includes('docker.sock')));
});

test('sandbox runner fails closed when Docker or its daemon is unavailable', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-sandbox-'));
  const workspace = path.join(root, 'sandbox');
  await mkdir(workspace);
  const calls = [];
  try {
    await assert.rejects(runInIsolatedContainer({
      workspaceRoot: root,
      workspacePath: workspace,
      command: 'npm',
      args: ['test'],
    }, {
      execute: async (_file, args) => {
        calls.push(args);
        const error = new Error('docker unavailable');
        error.code = 'ENOENT';
        throw error;
      },
    }), SandboxUnavailableError);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].slice(0, 2), ['version', '--format']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('sandbox runner rejects workspace paths outside the managed root before invoking Docker', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'phoenix-sandbox-'));
  let called = false;
  try {
    await assert.rejects(runInIsolatedContainer({
      workspaceRoot: root,
      workspacePath: os.tmpdir(),
      command: 'npm',
    }, { execute: async () => { called = true; } }), /child of its managed root/);
    assert.equal(called, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
