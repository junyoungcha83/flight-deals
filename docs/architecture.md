# Architecture and migration boundary

- Static UI: root `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`.
- API proxy: `api/src/index.js`, `api/wrangler.toml`; deploy from `api/` (`cd api && npx wrangler deploy`) and preserve the Worker name (`amadeus-proxy`), its public URL, and secrets. The directory rename does not change the Worker name or deployed URL.

Keep public root paths unchanged. Internal changes require a Wrangler dry-run and a browser/API smoke test. Agent tools must call the proxy through a validated, rate-limited interface.
