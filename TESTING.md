# Local audit checks

Run `npm test` for the dashboard interaction and rendering regressions, `npm run typecheck` for TypeScript checks, and `npm run build` for the production-format bundle. The tests replace network responses and do not use production services.

The interaction suite checks draft dates, Apply, Escape, the seven-day Clear reset, page resets after date/API changes, native sorting and pagination controls, request failures, HTML cleaning, and text contrast. Existing tests continue to check detail-access roles and complete session pagination.

For a manual local browser check, first run `npm run build`, then `npm run test:ui-preview`. Open `http://127.0.0.1:4318`. This isolated component preview binds to loopback and blocks network API calls. Check Enter on Next, Space on Date, cancelled calendar edits, Clear, and the one-month calendar on a phone-width viewport. Stop the preview with Ctrl+C.

A failed report request now reaches the error state. A successful response with no records still shows an empty result. Missing detail records keep their separate not-found handling. HTML answer formatting is retained after sanitizing it with the default allowed HTML schema.

No production verification is included in these checks.
