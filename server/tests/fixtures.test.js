import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const fixture = (name, file) => new URL(`../fixtures/${name}/${file}`, import.meta.url);

test('broken-button fixture documents and contains its selector mismatch', async () => {
  const [html, script, scenario] = await Promise.all([
    readFile(fixture('broken-button', 'index.html'), 'utf8'),
    readFile(fixture('broken-button', 'app.js'), 'utf8'),
    readFile(fixture('broken-button', 'SCENARIO.md'), 'utf8'),
  ]);
  assert.match(html, /id="visit-button"/);
  assert.match(script, /querySelector\('#visit-btn'\)/);
  assert.match(scenario, /Expected repair: change the selector to `#visit-button`/);
});

test('missing-image fixture points to a nonexistent image and includes the corrected asset', async () => {
  const [html, scenario] = await Promise.all([
    readFile(fixture('missing-image', 'index.html'), 'utf8'),
    readFile(fixture('missing-image', 'SCENARIO.md'), 'utf8'),
  ]);
  assert.match(html, /phoenix-mark\.svg/);
  await assert.rejects(access(fixture('missing-image', 'assets/phoenix-mark.svg')));
  await access(fixture('missing-image', 'assets/phoenix-logo.svg'));
  assert.match(scenario, /update the image source/);
});

test('broken-navigation fixture points to a missing route with a candidate page', async () => {
  const [html, scenario] = await Promise.all([
    readFile(fixture('broken-navigation', 'index.html'), 'utf8'),
    readFile(fixture('broken-navigation', 'SCENARIO.md'), 'utf8'),
  ]);
  assert.match(html, /href="\/about"/);
  await assert.rejects(access(fixture('broken-navigation', 'about.html')));
  await access(fixture('broken-navigation', 'company.html'));
  assert.match(scenario, /change the link to `\.\/company\.html`/);
});
