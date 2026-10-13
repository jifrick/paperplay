# PAPERPLAY implementation checklist

Source of truth: the user's complete PAPERPLAY PRD v1.0 (sections 1–27).

## Audit and baseline

The initial workspace was a Windows home directory, not a repository. No PAPERPLAY source, package manifest, routes, tests or working build existed. Unrelated root HTML and the orphaned root lockfile are left untouched. This dedicated `paperplay/` directory uses React, TypeScript (strict), Vite and npm. Runtime verified: Node 24.11.1, npm 11.6.2. No backend, account, analytics or AI API is needed.

## Ordered gates

- [ ] M0: audit, requirements checklist, runnable baseline build.
- [ ] M1: paper tokens, local fonts, notebook cover/cards, responsive navigation, page transitions, all routes; shell tests/build.
- [ ] M2: NFC/graphemes, validation, original/source positions, one-to-one matching; unit tests.
- [ ] M3: exact FLAMES elimination records, zero case, three modes/copy, matching and round playback, details; unit/component tests.
- [ ] M4: Letter Match, A1Z26 Name Number, deterministic Love Meter with all boundaries; unit/component tests.
- [ ] M5: accessible pencil inputs, eraser/last grapheme, undo/reset, focus, replay, reduced motion and cancellation; component tests.
- [ ] M6: all-game PNG download, hide names, native share, cancellation, clipboard/manual fallback, private challenge URLs; tests.
- [ ] M7: rules/example, privacy/about, route SEO, social preview, favicon, canonical/sitemap/robots, responsive/accessibility/security checks.
- [ ] M8: full tests, typecheck, build, browser checks, deep-link serving, final QA and deployment instructions.

## Explicit decisions

- A new dedicated app avoids overwriting unrelated home-directory work.
- Lightweight History API routing; static deployment must rewrite navigation requests to the app shell.
- CSS animations are sufficient; no animation library is needed for these small transitions.
- Shared matching accepts NFC-normalized Latin-script letter graphemes (including accents, without stripping or transliterating them). Non-Latin letters, mixed unsupported scripts, digits, emoji and symbols receive explicit validation. Spaces and punctuation are ignored. Name Number accepts A–Z only and explains accented/non-Latin exclusions. No partial, silently misleading calculation.
- Limit each name to 80 graphemes and reject longer pasted values with visible validation; never silently truncate a result. Inputs remain fully editable.
- Segmentation uses `Intl.Segmenter`; browsers without it receive a friendly requirement message rather than incorrect fallback indexing.
- Original names remain ephemeral React state. No names in URLs, filenames, local storage, logs, telemetry or third-party requests. Native sharing sends only the user-requested payload.
- The public domain is not provided. Deployment must set a real site origin before generating canonical/sitemap/social URLs; no invented production domain is claimed.
- Sound, haptics, freehand input, PWA, multiplayer and analytics remain future enhancements as specified.

## Verification ledger

Record commands and actual outcomes at every gate below; no unrun checks count as passes.

## Recorded checks

- `node --version; npm --version` in `paperplay/`: Node `v24.11.1`, npm `11.6.2`.
- `npm install`: completed successfully. `jsdom` is pinned to `^29.0.0` so the installed test environment supports the available Node runtime.
- `npm run typecheck`: passed.
- `npm test`: passed, 3 test files and 23 tests.
- `npm run build`: passed; Vite emitted a production `dist/` bundle.
- `npm run dev` plus HTTP smoke checks: `/` and `/games/flames` returned HTTP 200.
- `npm run preview` plus HTTP smoke checks: `/`, all four `/games/*` routes, `/how-it-works`, `/about`, and `/privacy` returned HTTP 200.

No lint script is configured in this new app, so lint was not claimed as a pass. Browser automation was not included in the repository; React Testing Library integration tests and preview route checks are the repeatable automated coverage currently provided. A final hands-on check should still be made in a real browser at 320px and desktop widths before public launch.
