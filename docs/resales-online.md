# Keyra Properties / Resales Online V6

Separate entry: `/properties.html`. Detail: `/property.html?reference=R…`.
Existing static Insights pages stay intact. Vercel runs the two Node functions in `api/`; no build step or database required. `npm run dev` starts a local static/API server on port 3000. Node 22+ is recommended. `npm test` verifies the adapter with official documentation fixtures (no credentials/network).

## Activation

In the existing Vercel project's environment settings add:

- `RESALES_P1`: agency/client identifier.
- `RESALES_P2`: secret API key; never commit or put in browser code.
- `RESALES_FILTER_ID`: agency filter alias for **for-sale** listings, as configured in the account. Do not assume all network listings are permitted by the account.
- `RESALES_SANDBOX`: optional `true` for a sandbox key. Default false.

Create credentials in Resales Online and configure the website/API filter. Verify IP restrictions with Resales support: serverless outbound IPs may vary; use a supported deployment networking configuration if allowlisting is required. Redeploy after setting environment variables. Test a search, pagination, a detail and media permissions with the actual account before launch. No public documentation credentials are used by this application.

V6 endpoints: `SearchProperties`, `PropertyDetails`, `SearchLocations`, `SearchPropertyTypes`, `SearchFeatures`. Language 8 (Swedish), EUR, metric. Bedroom minimum uses the documented `Nx` syntax. Pagination retains QueryId. Options are fetched from the account to respect its filters. API response transaction metadata is discarded because it can echo p1/p2/IP. Errors and incomplete configuration return generic public messages, never pretend results are real. Cache: search/detail 60 seconds, options one hour; no stale data on upstream errors.

## Scope and launch checks

Search starts with area/location, type and price. “Fler val” expands fixed V6 search criteria (bedrooms/bathrooms, built/plot range, province, excluded locations, references, energy, new developments/key-ready, rented stock, tourist rental licence/community vote, licence number and Decree 218 flag). All feature categories are fetched via SearchFeatures in Swedish, rendered as grouped checkboxes, and validated against account metadata on the server. Match mode: all required / at least one / preferred. Selected filters persist when the panel closes and in URLs; reset and advanced-only reset are separate. Four sort orders, 12 results/page. Detail: photos, listing description as plain text, dimensions, energy rating, features. Contacts link to the existing Insights contact preview; no lead submission or booking has been added. No synthetic listings are presented. Tests use official sandbox examples only.

The new pages remain `noindex,follow`, matching the site's prelaunch status. Before public indexing: confirm final domain, company details and contact/privacy flow, add server-rendered per-property URLs, canonical/OpenGraph and factual structured data plus property sitemap for available listings. Filter combinations should not create indexable duplicates. This version does not claim complete SEO/AEO launch readiness. Guide links and visible FAQ are in place.

## Official references

- https://webapi-v6.learning.resales-online.com/
- https://support.resales-online.com/en/articles/5682509-webapi-v6-full-documentation-for-web-developers
- https://support.resales-online.com/en/articles/4639804-how-to-create-an-api-key

Documentation checked 2026-10-09. Live Keyra credentials have not been supplied; live integration validation remains pending.
