import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAiProvider, estimateApiCost, OpenAiProviderError } from '../openai-provider.js';

test('OpenAI provider sends structured Responses API calls with backend-only credentials', async () => {
  let request;
  const provider = createOpenAiProvider({
    apiKey: 'server-test-key',
    model: 'test-model',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, async json() { return { output_text: JSON.stringify({ summary: 'Evidence only.' }), usage: { input_tokens: 500, output_tokens: 100, total_tokens: 600 } }; } };
    },
  });
  assert.equal(provider.kind, 'real');
  const output = await provider.runAgent('observer', { diagnostic: { confirmed: true } });
  assert.deepEqual(output, {
    providerResponse: true,
    output: { summary: 'Evidence only.' },
    usage: { inputTokens: 500, outputTokens: 100, totalTokens: 600 },
  });
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.options.headers.Authorization, 'Bearer server-test-key');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'test-model');
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, 'json_schema');
  assert.equal(body.text.format.strict, true);
  assert.equal(body.text.format.schema.additionalProperties, false);
});

test('budget estimate uses configured token prices and leaves cost blank without prices', () => {
  assert.deepEqual(estimateApiCost(
    { inputTokens: 500, outputTokens: 100 },
    { inputUsdPerMillion: 2, outputUsdPerMillion: 8 },
  ), {
    currency: 'USD', pricingConfigured: true,
    inputUsdPerMillion: 2, outputUsdPerMillion: 8,
    estimatedCostUsd: 0.0018,
  });
  assert.equal(estimateApiCost({ inputTokens: 500, outputTokens: 100 }, {}).estimatedCostUsd, null);
});

test('OpenAI provider is disabled unless both key and model are configured', () => {
  assert.equal(createOpenAiProvider({ apiKey: '', model: 'test', fetchImpl: fetch }), null);
  assert.equal(createOpenAiProvider({ apiKey: 'test', model: '', fetchImpl: fetch }), null);
});

test('OpenAI provider rejects API errors and malformed output without returning success', async () => {
  const rejected = createOpenAiProvider({
    apiKey: 'test', model: 'test', fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  await assert.rejects(rejected.runAgent('coder', {}), (error) => error instanceof OpenAiProviderError && error.code === 'OPENAI_ACCESS_UNAVAILABLE');

  const malformed = createOpenAiProvider({
    apiKey: 'test', model: 'test', fetchImpl: async () => ({ ok: true, async json() { return { output_text: 'not JSON' }; } }),
  });
  await assert.rejects(malformed.runAgent('observer', {}), (error) => error instanceof OpenAiProviderError && error.code === 'OPENAI_INVALID_OUTPUT');
});

test('OpenAI provider times out and fails closed', async () => {
  const provider = createOpenAiProvider({
    apiKey: 'test', model: 'test', timeoutMs: 5,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  });
  await assert.rejects(provider.runAgent('observer', {}), (error) => error instanceof OpenAiProviderError && error.code === 'OPENAI_TIMEOUT');
});
