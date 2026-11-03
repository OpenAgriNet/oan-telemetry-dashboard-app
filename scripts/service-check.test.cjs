const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const src = resolve(__dirname, "../src");
function load(file, mocks, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, console, URLSearchParams, Date, ...globals,
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith("@/")) return load(resolve(src, `${id.slice(2)}.tsx`), mocks, globals);
      if (id.startsWith(".")) return load(resolve(dirname(file), `${id}.tsx`), mocks, globals);
      return require(id);
    },
  }, { filename: file });
  return module.exports;
}

test("Service Check renders rejection reasons and counts separately from errors, including older responses", async () => {
  const row = {
    apiService: "pmkisan_grievance_lodge", label: "Grievance Lodge",
    total: 8, success: 2, failed: 6, rejected: 5, error: 1, unknown: 0, successRate: 25,
    errorTypes: [{ errorType: "timeout", count: "1" }],
    rejectedTypes: [
      { errorType: "Grievance already registered", count: "3" },
      { errorType: "Registration number wrong", count: "2" },
    ],
  };
  let response = { services: [{ id: "pmkisan", label: "PM-KISAN", toolCalls: 8, totals: row, apis: [row] }] };
  const api = load(resolve(src, "services/api.ts"), {
    "../config/environment": { API_CONFIG: { SERVER_URL: "https://test.invalid/v1" } },
    "../data/dailyMetrics.json": [],
  }, { fetch: async () => new Response(JSON.stringify(response)) });
  let services = await api.fetchServiceCheck();
  assert.equal(services[0].apis[0].rejectedTypes[0].count, 3);
  assert.equal(services[0].apis[0].errorTypes[0].count, 1);
  const mocks = {
    "@/services/api": api,
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" "), buildDateRangeParams: () => ({}) },
    "@/contexts/DateFilterContext": { useDateFilter: () => ({ dateRange: { from: new Date(2026, 10, 3), to: new Date(2026, 10, 3) } }) },
    "@/contexts/TelemetryStateContext": { useTelemetryState: () => ({ selectedStateId: "bharat-vistaar" }) },
    "react-router-dom": { useSearchParams: () => [new URLSearchParams("service=pmkisan"), () => {}] },
    "@tanstack/react-query": { useQuery: () => ({ data: services, isLoading: false, isFetching: false, refetch() {} }) },
  };
  const Page = load(resolve(src, "pages/ServiceCheck.tsx"), mocks).default;
  const html = renderToStaticMarkup(React.createElement(Page));
  assert.ok(html.includes("Rejection reasons"));
  const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((match) => match[1]);
  assert.ok(cells.includes("Grievance already registered (3), Registration number wrong (2)"));
  assert.ok(cells.includes("timeout (1)"));

  delete row.rejectedTypes;
  services = await api.fetchServiceCheck();
  assert.equal(services[0].apis[0].rejectedTypes.length, 0);
  const legacyHtml = renderToStaticMarkup(React.createElement(Page));
  const legacyCells = [...legacyHtml.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((match) => match[1]);
  assert.equal(legacyCells.at(-2), "\u2014");
  assert.equal(legacyCells.at(-1), "timeout (1)");
  response = { services: [] };
  assert.equal((await api.fetchServiceCheck()).length, 0);
});
