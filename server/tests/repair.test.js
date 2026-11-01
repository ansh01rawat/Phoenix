import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyInteraction } from '../verify.js';
import { detectProjectMetadata, normalizeProjectPath, projectDisplayName, validateProjectFiles } from '../projects.js';

test('the bundled demo reproduces the broken visit button', async () => {
  const source = await readFile(new URL('../demo-site/app.js', import.meta.url), 'utf8');
  assert.equal(await verifyInteraction(source), false);
});

test('the repaired interaction displays the expected visit message', async () => {
  const source = await readFile(new URL('../demo-site/app.js', import.meta.url), 'utf8');
  const repaired = source.replace("document.querySelector('#visit-btn')", "document.querySelector('#visit-button')");
  assert.equal(await verifyInteraction(repaired), true);
});

test('project import rejects paths that escape the selected folder', () => {
  assert.throws(() => normalizeProjectPath('../outside.txt'), /traversal/);
  assert.throws(() => normalizeProjectPath('C:\\outside.txt'), /inside the selected folder/);
});

test('project import skips generated and environment files', () => {
  const result = validateProjectFiles([
    { path: 'site/src/main.js', data: Buffer.from('ok').toString('base64') },
    { path: 'site/node_modules/pkg/index.js', data: Buffer.from('skip').toString('base64') },
    { path: 'site/.env.local', data: Buffer.from('secret').toString('base64') },
  ]);
  assert.deepEqual(result.files.map((file) => file.path), ['site/src/main.js']);
  assert.equal(result.skippedCount, 2);
  assert.equal(result.totalBytes, 2);
});

test('project import skips common credentials and private-key files', () => {
  const result = validateProjectFiles([
    { path: 'site/index.html', data: Buffer.from('ok').toString('base64') },
    { path: 'site/.aws/credentials', data: Buffer.from('secret').toString('base64') },
    { path: 'site/deploy-key.pem', data: Buffer.from('private key').toString('base64') },
    { path: 'site/.npmrc', data: Buffer.from('token').toString('base64') },
    { path: 'site/config.json', data: Buffer.from('{"publicConfig":true}').toString('base64') },
  ]);
  assert.deepEqual(result.files.map((file) => file.path), ['site/index.html', 'site/config.json']);
  assert.equal(result.skippedCount, 3);
  assert.equal(result.files.some((file) => file.path === 'site/config.json'), true);
});

test('project import detects static, React Vite, Node and Next.js metadata without executing scripts', () => {
  const encode = (path, value) => ({ path, contents: Buffer.from(value) });
  assert.deepEqual(detectProjectMetadata([encode('site/index.html', '<h1>Site</h1>')]), {
    framework: 'static-html', entryPoint: 'site/index.html', packageManager: 'unknown',
  });
  assert.deepEqual(detectProjectMetadata([
    encode('site/package.json', JSON.stringify({ dependencies: { react: '18', vite: '5' }, scripts: { dev: 'vite --host 0.0.0.0' } })),
    encode('site/package-lock.json', '{}'),
  ]), { framework: 'react-vite', entryPoint: 'site/package.json#scripts.dev', packageManager: 'npm' });
  assert.deepEqual(detectProjectMetadata([
    encode('site/package.json', JSON.stringify({ scripts: { start: 'node server.js' } })),
    encode('site/yarn.lock', ''),
  ]), { framework: 'node', entryPoint: 'site/package.json#scripts.start', packageManager: 'yarn' });
  assert.deepEqual(detectProjectMetadata([
    encode('site/package.json', JSON.stringify({ dependencies: { next: '14' }, scripts: { dev: 'next dev' } })),
    encode('site/pnpm-lock.yaml', ''),
  ]), { framework: 'nextjs', entryPoint: 'site/package.json#scripts.dev', packageManager: 'pnpm' });
});

test('project import rejects duplicate paths regardless of case', () => {
  assert.throws(() => validateProjectFiles([
    { path: 'Site/index.html', data: '' },
    { path: 'site/index.html', data: '' },
  ]), /duplicate file paths/);
});

test('project names are displayed safely', () => {
  assert.equal(projectDisplayName('  <site>: source  '), 'site source');
});
