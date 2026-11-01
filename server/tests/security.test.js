import test from 'node:test';
import assert from 'node:assert/strict';
import { isPermittedLocalOrigin } from '../security.js';

test('security helper accepts only plain HTTP loopback origins', () => {
  assert.equal(isPermittedLocalOrigin('http://localhost:5173'), true);
  assert.equal(isPermittedLocalOrigin('http://127.0.0.1:3001'), true);
  assert.equal(isPermittedLocalOrigin('http://[::1]:5173'), true);
  assert.equal(isPermittedLocalOrigin('https://attacker.example'), false);
  assert.equal(isPermittedLocalOrigin('http://192.168.1.20:5173'), false);
  assert.equal(isPermittedLocalOrigin('null'), false);
  assert.equal(isPermittedLocalOrigin('not an origin'), false);
});
