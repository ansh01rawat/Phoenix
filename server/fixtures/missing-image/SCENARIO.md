# Missing image fixture

- Reproduce: open `index.html` and inspect the broken image request.
- Expected confirmed diagnostic: `index.html` requests `assets/phoenix-mark.svg`, which does not exist; `assets/phoenix-logo.svg` does exist.
- Expected repair: update the image source to `./assets/phoenix-logo.svg`.
- Verification: resolve the local `src` path from the HTML directory and confirm the file exists and the image request succeeds.
