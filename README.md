# PAPERPLAY

PAPERPLAY is a browser-only collection of nostalgic notebook games built with React, TypeScript, and Vite. It includes FLAMES Classic, Letter Match, Name Number, and Love Meter.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (normally `http://localhost:5173`).

## Checks

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

`npm test` runs the deterministic game-engine tests and React Testing Library flow tests. The production build is created in `dist/`.

## Deployment

The app is a static Vite site. Deploy the contents of `dist/` to any static host that supports a single-page-app fallback. Configure all unknown routes to serve `index.html`, otherwise direct visits to `/games/flames` and the other nested routes will 404.

Examples:

- **Netlify:** add a redirect `/* /index.html 200` in `public/_redirects` or the host settings.
- **Vercel:** add a rewrite from `/(.*)` to `/index.html` in `vercel.json`.
- **Cloudflare Pages:** use the SPA fallback behavior or a `_redirects` rule.

Before launch, replace the `paperplay.example` placeholder in `public/robots.txt` and `public/sitemap.xml` with the real public origin. The runtime canonical URL uses the current origin, so it remains correct on a deployed host.

## Product/privacy notes

- Calculations are local and deterministic; no AI, backend, account, database, analytics, or name storage is required.
- Names are not put in URLs by default. Share links carry only the game and optional FLAMES mode.
- Native sharing falls back to clipboard copy, then a user-controlled copy prompt.
- PNG result cards are generated locally with the Canvas API.
- A–Z-only games explain that unsupported characters are excluded; FLAMES and Letter Match use NFC-normalized letter graphemes without transliteration.
- Freehand input, audio, haptics, PWA installation, multiplayer, and analytics are intentionally outside the MVP.
