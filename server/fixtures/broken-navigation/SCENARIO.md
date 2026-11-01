# Broken navigation fixture

- Reproduce: open `index.html` and activate **About**.
- Expected confirmed diagnostic: the internal route `/about` has no matching page; `company.html` is the available about page.
- Expected repair: change the link to `./company.html`.
- Verification: resolve the internal link and confirm it returns the About page.
