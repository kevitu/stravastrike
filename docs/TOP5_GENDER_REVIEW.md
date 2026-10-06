# Top 5 Mengikut Jantina — local review, 6 October 2026

Status: Apps Script production is Version 9, according to the supplied production
verification. Top 5 Mengikut Jantina was verified against the production endpoint;
all 35 active participants had valid canonical gender at verification.
Desktop/local visual verification PASS. Overall leaderboard, Top 3, KM SAH and
Ranking Rumah Sukan remain unchanged. No deployment, commit or push is part of
this housekeeping task.

## Backend changes in Version 9

The backend reference is `backend/dashboard_summary.gs`. Version 9 adds these
three read-only contract changes to the dashboard handler:

1. Add `JANTINA` to the participant columns read through `SHEET_PESERTA`, which must
   point to `PesertaStravaStrike2026`.
2. Normalize `JANTINA` using `String(value ?? '').trim().toUpperCase()`, then carry
   only canonical `LELAKI` and `PEREMPUAN`; other values become an empty string.
   No inference from names or aliases.
3. Add `jantina` to each public `leaderboard` item.

The existing SAH aggregation, overall rank, tie comparator and other fields stay
unchanged. No router, sync, credentials, service worker or manifest change is
required. The full deployed Apps Script and registration sync are not mirrored
in this repo; inspect them before transferring these edits, rather than replacing
unrelated deployed code. The master header must exist before deployment because
the current reader requires its listed columns.

Production is now **Version 9**; no further deployment is proposed here. The
frontend remains compatible with legacy Version 8 responses, which show empty
gender ranking states when gender is not exposed.

## Frontend

The new full-width card follows Kedudukan Teratas and Top 3 Individu, before
Ranking Rumah Sukan. Two balanced columns become a vertical Lelaki/Wanita stack
at mobile widths. Each gender group filters the already ordered official leaderboard
and takes the first five, without re-sorting or modifying the source. Zero-KM
participants remain eligible according to the existing official leaderboard.
WANITA is a display label only; canonical data and filters remain LELAKI/PEREMPUAN. Unknown/missing gender is excluded. Gender group ranks are numbered locally #1–#5.

The existing podium emblem builder is shared with gender ranking rows, preserving
podium output, house mapping, accessible house label and image error fallback.
The centered 260px watermark (220px mobile) is decorative, opacity 0.1 and ignores
pointer events. Gender ranking rendering failures are isolated from the remaining
dashboard rendering and participant flows.

## Verification

- `node --check assets/js/app.js`
- `node --test tests/dashboard-refresh.test.cjs tests/dashboard-gender.test.cjs`
- `git diff --check`
- Local fixture visual check at 1440/768/390/320px, including long names,
  two-column/stacked layout, placement and horizontal overflow.

`tests/gender-visual.cjs` is an optional local browser preview utility using the
desktop bundled Playwright and Edge. Pass an output directory for screenshots.
It intercepts all page requests and uses fixtures; it makes no production login,
submission or API requests. This verifies browser layout, not installed-device
PWA behavior. The separate production endpoint verification above was supplied
for this housekeeping update; this preview utility does not verify the backend.
