# Architecture and migration boundary

- Static UI: root `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`.
- API proxy: `worker/src/index.js`, `worker/wrangler.toml`; deploy from `worker/` and preserve the Worker name and secrets.

Keep public root paths unchanged. Internal changes require a Wrangler dry-run and a browser/API smoke test. Agent tools must call the proxy through a validated, rate-limited interface.
