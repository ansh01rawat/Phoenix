# Broken button fixture

- Reproduce: open `index.html` and click **Visit us**.
- Expected confirmed diagnostic: `app.js` queries `#visit-btn`, but the button in `index.html` has ID `visit-button`; no handler is attached.
- Expected repair: change the selector to `#visit-button`.
- Verification: click the button and assert `#message` becomes `Visit information is ready.`
