import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Routes, Route } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server.js';

const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { outputFiles } = await build({
  stdin: { contents: `export { default as Provider } from './src/pages/ServiceSnapshotProvider';
    export { default as Requests } from './src/pages/MhGapRequests';
    export { default as Detail } from './src/pages/IndividualApiCallDetail';
    export { buildDateRangeParams } from './src/lib/utils';`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', alias: { '@': './src' },
  external: ['react', 'react/*', 'react-dom', 'react-dom/*', 'react-router-dom', '@tanstack/react-query'],
  plugins: [{ name: 'test-context', setup(builder) {
    builder.onResolve({ filter: /config\/environment$/ }, () => ({ path: fileURLToPath(new URL('./configFixture.ts', import.meta.url)) }));
    builder.onLoad({ filter: /contexts\/DateFilterContext\.tsx$/ }, () => ({
      contents: `export function useDateFilter() { return { dateRange: { from: new Date(2026, 10, 3), to: new Date(2026, 10, 3) } }; }`, loader: 'tsx',
    }));
  } }],
});
const module = { exports: {} };
new Function('module', 'exports', 'require', outputFiles[0].text)(module, module.exports, require);
const { Provider, Requests, Detail, buildDateRangeParams } = module.exports;
const params = buildDateRangeParams({ from: new Date(2026, 10, 3), to: new Date(2026, 10, 3) });
const gapKey = ['mh-gap-reconstruction', params.startDate, params.endDate];
const snapshotKey = ['service-snapshot', params.startDate, params.endDate];
const service = { key: 'chc', name: 'CHC', description: 'Custom Hiring Centre information', candidateCalls: 12, mhResponsesObserved: 10 };
const gap = { totals: { mappedCandidateCalls: 12 }, services: [service] };

function render(Page, path, location, data) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  for (const [key, value] of data) client.setQueryData(key, value);
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(StaticRouter, { location }, React.createElement(Routes, null,
      React.createElement(Route, { path, element: React.createElement(Page) })))));
  client.clear();
  return html;
}

test('gap-only services show chatbot request links and their real service description', () => {
  const html = render(Provider, '/service-snapshot/provider/:providerName', '/service-snapshot/provider/mh-vistaar', [
    [gapKey, gap], [snapshotKey, { data: { providers: [] } }],
  ]);
  assert.match(html, /Custom Hiring Centre information/);
  assert.match(html, /Chatbot requests/);
  assert.match(html, /href="\/service-snapshot\/provider\/mh-vistaar\/service\/chc\/chatbot-requests"/);
  assert.doesNotMatch(html, /No provider API details captured|Unavailable/);
});

test('services with both observed and gap calls keep their API link and gain a chatbot link', () => {
  const metrics = { requests: 3, apiRequests: 0, successfulRequests: 3, failedRequests: 0, p90LatencyMs: null };
  const html = render(Provider, '/service-snapshot/provider/:providerName', '/service-snapshot/provider/mh-vistaar', [
    [gapKey, gap], [snapshotKey, { data: { providers: [{ name: 'MH Vistaar', services: [{ ...service, metrics, apis: [], apiRequests: 0 }] }] } }],
  ]);
  assert.match(html, /View APIs/);
  assert.match(html, /View chatbot requests/);
  assert.match(html, /Includes 12 chatbot requests/);
});

test('outside the gap the provider view keeps its existing API navigation without chatbot links', () => {
  const metrics = { requests: 3, successfulRequests: 3, failedRequests: 0, p90LatencyMs: null };
  const html = render(Provider, '/service-snapshot/provider/:providerName', '/service-snapshot/provider/mh-vistaar', [
    [gapKey, { totals: { mappedCandidateCalls: 0 }, services: [] }],
    [snapshotKey, { data: { providers: [{ name: 'MH Vistaar', services: [{ ...service, metrics, apis: [], apiRequests: 0 }] }] } }],
  ]);
  assert.match(html, /View APIs/);
  assert.doesNotMatch(html, /View chatbot requests|Includes.*chatbot requests/);
});

test('chatbot request list opens captured call details with a return link and pagination', () => {
  const html = render(Requests, '/service-snapshot/provider/mh-vistaar/service/:serviceKey/chatbot-requests', '/service-snapshot/provider/mh-vistaar/service/chc/chatbot-requests', [
    [gapKey, gap],
    [['mh-gap-calls', params.startDate, params.endDate, 'chc', 1], {
      data: { calls: [{ id: 42, endpoint: '/search', method: 'POST', event_time: '2026-11-03T09:00:00Z' }] },
      pagination: { page: 1, limit: 10, total: 12, totalPages: 2 },
    }],
  ]);
  assert.match(html, /CHC · Chatbot requests/);
  assert.match(html, /POST.*\/search/);
  assert.match(html, /View payload &amp; response/);
  assert.match(html, /href="\/individual-apis\/42\?returnTo=%2Fservice-snapshot%2Fprovider%2Fmh-vistaar%2Fservice%2Fchc%2Fchatbot-requests"/);
  assert.match(html, /Next/);
});

test('existing details display the chatbot payload and response and return to chatbot requests', () => {
  const html = render(Detail, '/individual-apis/:id', '/individual-apis/42?returnTo=%2Fservice-snapshot%2Fprovider%2Fmh-vistaar%2Fservice%2Fchc%2Fchatbot-requests', [
    [['individual-api-call', '42'], { id: 42, endpoint: '/search', event_name: 'beckn_request', service: 'mahavistaar-ai-backend',
      request_payload: { query: 'nearby CHC' }, response_payload: { result: 'captured chatbot response' }, error_payload: null, duration_ms: null }],
  ]);
  for (const text of ['Chatbot requests', 'Request payload', 'Response payload', 'nearby CHC', 'captured chatbot response']) assert.ok(html.includes(text));
  assert.match(html, /href="\/service-snapshot\/provider\/mh-vistaar\/service\/chc\/chatbot-requests"/);
});
