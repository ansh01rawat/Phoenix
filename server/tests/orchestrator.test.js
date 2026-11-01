import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AiProviderUnavailableError, estimateRepairBudget, orchestrateRepair } from '../repair-orchestrator.js';

const diagnostic = { confirmed: true, affectedFiles: ['app.js'], evidence: ['button selector mismatch'] };

test('repair budget estimator returns a heuristic token/cost ceiling using configured rates', () => {
  const estimate = estimateRepairBudget({
    diagnostic,
    sourceFiles: [{ file: 'app.js', content: 'const button = null;' }],
    maxAttempts: 2,
    model: 'test-model',
    pricing: { inputUsdPerMillion: 2, outputUsdPerMillion: 8 },
  });
  assert.equal(estimate.model, 'test-model');
  assert.equal(estimate.requests, 4);
  assert.equal(estimate.maximumOutputTokens, 18_400);
  assert.equal(estimate.pricingConfigured, true);
  assert.ok(estimate.estimatedCostUsd > 0);
  assert.match(estimate.method, /heuristic/);
});

function mockProvider(content, replacement) {
  return {
    kind: 'mock',
    async runAgent(role) {
      if (role === 'observer') return { summary: 'The button selector is inconsistent with the page.' };
      if (role === 'architect') return { plan: 'Update the selector.', rootCause: 'Selector mismatch.', risks: [] };
      if (role === 'coder') return {
        file: 'app.js', replacement, reason: 'Align the selector.',
        expectedBeforeHash: createHash('sha256').update(content).digest('hex'),
      };
      throw new Error(`Unexpected role: ${role}`);
    },
  };
}

test('repair orchestrator requires an explicitly configured provider', async () => {
  await assert.rejects(orchestrateRepair({ diagnostic, sandboxPath: '.', verify: async () => ({ passed: true, checks: [{ passed: true }] }) }), AiProviderUnavailableError);
});

test('explicit mock provider can exercise the bounded flow but cannot approve a repair', async () => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'phoenix-orchestrator-'));
  const before = 'const selector = "#visit-btn";\n';
  const after = 'const selector = "#visit-button";\n';
  await writeFile(path.join(sandbox, 'app.js'), before);
  try {
    const result = await orchestrateRepair({
      provider: mockProvider(before, after), diagnostic, sandboxPath: sandbox, allowMockProvider: true,
      verify: async () => ({ passed: true, checks: [{ name: 'selector-check', passed: true }] }),
    });
    assert.equal(result.providerMode, 'mock');
    assert.equal(result.approvalReady, false);
    assert.equal(result.verification.passed, true);
    assert.equal(await readFile(path.join(sandbox, 'app.js'), 'utf8'), after);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});

test('failed verification discards the patch and returns a failed result', async () => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'phoenix-orchestrator-'));
  const before = 'const selector = "#visit-btn";\n';
  await writeFile(path.join(sandbox, 'app.js'), before);
  try {
    const result = await orchestrateRepair({
      provider: mockProvider(before, 'const selector = "#visit-button";\n'),
      diagnostic, sandboxPath: sandbox, allowMockProvider: true,
      verify: async () => ({ passed: false, checks: [{ name: 'interaction', passed: false }] }),
    });
    assert.equal(result.state, 'FAILED');
    assert.equal(result.approvalReady, false);
    assert.equal(await readFile(path.join(sandbox, 'app.js'), 'utf8'), before);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});

test('coder cannot modify files outside confirmed diagnostics', async () => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'phoenix-orchestrator-'));
  await writeFile(path.join(sandbox, 'app.js'), 'const button = null;');
  try {
    const provider = { ...mockProvider('x', 'y'), async runAgent(role) {
      if (role === 'observer') return { summary: 'observed' };
      if (role === 'architect') return { plan: 'fix' };
      return { file: '../outside.js', replacement: 'x', reason: 'bad', expectedBeforeHash: 'a'.repeat(64) };
    } };
    await assert.rejects(orchestrateRepair({
      provider, diagnostic, sandboxPath: sandbox, allowMockProvider: true,
      verify: async () => ({ passed: true, checks: [{ passed: true }] }),
    }), /outside the confirmed affected-file list/);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});
