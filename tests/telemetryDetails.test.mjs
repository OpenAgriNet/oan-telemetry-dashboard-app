import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { transformSync, build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Routes, Route } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server.js";

const require = createRequire(import.meta.url);
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
function loadTs(path) {
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), { loader: "ts", format: "cjs" });
  const module = { exports: {} };
  new Function("module", "exports", "require", code)(module, module.exports, require);
  return module.exports;
}
const { canViewTelemetryDetails } = loadTs("../src/utils/roleUtils.ts");
const { fetchSessionRecords, fetchOptionalDetail } = loadTs("../src/services/detailApi.ts");
const auth = (roles, authenticated = true) => ({ authenticated, tokenParsed: { realm_access: { roles } } });

test("only the explicit realm role grants detail access, including for super-admin", () => {
  for (const roles of [[], ["viewer"], ["super-admin"]]) assert.equal(canViewTelemetryDetails(auth(roles)), false);
  assert.equal(canViewTelemetryDetails(auth(["telemetry-detail-viewer"])), true);
  assert.equal(canViewTelemetryDetails(auth(["super-admin", "telemetry-detail-viewer"])), true);
  assert.equal(canViewTelemetryDetails(auth(["telemetry-detail-viewer"], false)), false);
  assert.equal(canViewTelemetryDetails({ authenticated: true }), false);
});

test("session loading follows every page beyond the initial 100 records", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    const page = Number(new URL(url).searchParams.get("page"));
    return { ok: true, json: async () => ({ data: Array.from({ length: page < 3 ? 100 : 5 }, (_, i) => ({ id: (page - 1) * 100 + i })), pagination: { hasNextPage: page < 3 } }) };
  });
  const records = await fetchSessionRecords("https://example.com/errors/session/s1");
  assert.equal(records.length, 205);
  assert.equal(records.at(-1).id, 204);
  assert.equal(urls.length, 3);
});

test("authorization and later-page failures are surfaced instead of an empty timeline", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 403 }));
  await assert.rejects(fetchSessionRecords("/details"), /403/);
  await assert.rejects(fetchOptionalDetail("/details"), /403/);
  let call = 0;
  globalThis.fetch = async () => ++call === 1
    ? { ok: true, json: async () => ({ data: [1], pagination: { hasNextPage: true } }) }
    : { ok: false, status: 500 };
  await assert.rejects(fetchSessionRecords("/details"), /500/);
});

test("missing details and empty sessions are handled separately from malformed responses", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404 }));
  assert.equal(await fetchOptionalDetail("/details"), null);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
  assert.deepEqual(await fetchSessionRecords("/details"), []);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: false }) });
  await assert.rejects(fetchSessionRecords("/details"), /Invalid/);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [], pagination: { hasNextPage: true } }) });
  await assert.rejects(fetchSessionRecords("/details"), /Incomplete/);
});

// Bundle the real guards with only their auth hook replaced by a test identity.
const { outputFiles } = await build({
  stdin: { contents: `export { default as Guard } from "./src/components/RoleBasedAccess"; export { default as DetailLink } from "./src/components/TelemetryDetailLink";
export { default as SessionDetails } from "./src/pages/SessionDetails";
export { default as QuestionsDetails } from "./src/pages/QuestionsDetails";
export { default as FeedbackDetails } from "./src/pages/FeedbackDetails";
export { default as ErrorDetails } from "./src/pages/ErrorDetails";
export { fetchSessionById, fetchQuestionById, fetchFeedbackById } from "./src/services/api";`, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic",
  alias: { "@/lib/useAppAuth": "./tests/authFixture.ts", "@": "./src" },
  plugins: [{ name: "test-config", setup(builder) {
    builder.onResolve({ filter: /config\/environment$/ }, () => ({ path: fileURLToPath(new URL("./configFixture.ts", import.meta.url)) }));
  } }],
  external: ["react", "react/*", "react-dom", "react-dom/*", "react-router-dom", "@tanstack/react-query"],
});
const module = { exports: {} };
new Function("module", "exports", "require", outputFiles[0].text)(module, module.exports, require);
const { Guard, DetailLink } = module.exports;

test("the route guard never mounts detail children for super-admin-only users", () => {
  let mounted = false;
  function Detail() { mounted = true; return React.createElement("p", null, "Sensitive detail"); }
  globalThis.__telemetryTestAuth = auth(["super-admin"]);
  const denied = renderToStaticMarkup(React.createElement(Guard, { allowedRoles: ["telemetry-detail-viewer"] }, React.createElement(Detail)));
  assert.match(denied, /Access Denied/);
  assert.equal(mounted, false);
  globalThis.__telemetryTestAuth = auth(["telemetry-detail-viewer"]);
  const allowed = renderToStaticMarkup(React.createElement(Guard, { allowedRoles: ["telemetry-detail-viewer"] }, React.createElement(Detail)));
  assert.match(allowed, /Sensitive detail/);
  assert.equal(mounted, true);
});

test("detail links are plain text for super-admin and navigable for a detail viewer", () => {
  const render = () => renderToStaticMarkup(React.createElement(StaticRouter, { location: "/" },
    React.createElement(DetailLink, { to: "/sessions/s1" }, "Session s1")));
  globalThis.__telemetryTestAuth = auth(["super-admin"]);
  assert.doesNotMatch(render(), /href=/);
  globalThis.__telemetryTestAuth = auth(["telemetry-detail-viewer"]);
  assert.match(render(), /href="\/sessions\/s1"/);
});

const { SessionDetails, QuestionsDetails, FeedbackDetails, ErrorDetails,
  fetchSessionById, fetchQuestionById, fetchFeedbackById } = module.exports;
function renderDetail(Page, path, location, data) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  for (const [key, value] of data) client.setQueryData(key, value);
  globalThis.__telemetryTestAuth = auth(["telemetry-detail-viewer"]);
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(StaticRouter, { location }, React.createElement(Routes, null,
      React.createElement(Route, { path, element: React.createElement(Page) })))));
  client.clear();
  return html;
}

test("all four recovered detail views render actual service data for a role-only viewer", () => {
  const time = "2026-10-12T10:00:00Z";
  const question = { id: "q1", question: "Which crop?", answer: "Grow pulses", user_id: "farmer-1", session_id: "s1", created_at: time, ets: String(Date.parse(time)), reaction: "neutral" };
  const feedback = { id: "f1", question: question.question, answer: question.answer, user: "farmer-1", userId: "farmer-1", sessionId: "s1", rating: "like", feedback: "Helpful advice", date: time, timestamp: question.ets };
  const error = { id: "e1", errorMessage: "Gateway timeout", date: "2026-10-12", time: "15:30:00", fullDate: time, userId: "farmer-1", sessionId: "s1" };
  const session = renderDetail(SessionDetails, "/sessions/:sessionId", "/sessions/s1", [
    [["sessionDetails", "s1"], { sessionId: "s1", username: "farmer-1" }],
    [["sessionQuestions", "s1"], [question]], [["sessionFeedback", "s1"], [feedback]], [["sessionErrors", "s1"], [error]],
  ]);
  for (const content of ["Which crop?", "Grow pulses", "Helpful advice", "Gateway timeout"]) assert.ok(session.includes(content));
  const questionHtml = renderDetail(QuestionsDetails, "/questions/:id", "/questions/q1", [[["question", "q1"], question]]);
  assert.match(questionHtml, /Question Details/);
  assert.match(questionHtml, /Grow pulses/);
  assert.match(questionHtml, /href="\/sessions\/s1"/);
  const feedbackHtml = renderDetail(FeedbackDetails, "/feedback/:feedbackId", "/feedback/f1", [[["feedback", "f1"], feedback]]);
  assert.match(feedbackHtml, /Helpful advice/);
  const errorHtml = renderDetail(ErrorDetails, "/errors/:errorId", "/errors/e1", [[["error-detail", "e1"], error]]);
  assert.match(errorHtml, /Gateway timeout/);
  assert.doesNotMatch(errorHtml, /Access Denied/);
});

test("restored clients use encoded IDs and preserve feedback identities and answers", async (t) => {
  const urls = [];
  const answer = "Full answer ".repeat(30);
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    if (url.includes("feedback")) return { ok: true, json: async () => [{ id: "f1", user_id: "farmer-1", session_id: "s/1", answertext: answer, feedbacktype: "like" }] };
    return { ok: true, json: async () => ({ success: true, data: { id: "detail" } }) };
  });
  await fetchSessionById("s/1");
  await fetchQuestionById("q/1");
  const feedback = await fetchFeedbackById("f/1");
  assert.ok(urls[0].endsWith("/sessions/s%2F1"));
  assert.ok(urls[1].endsWith("/questions/q%2F1"));
  assert.ok(urls[2].endsWith("/feedback/id/f%2F1"));
  assert.equal(feedback.userId, "farmer-1");
  assert.equal(feedback.sessionId, "s/1");
  assert.equal(feedback.answer, answer);
});
