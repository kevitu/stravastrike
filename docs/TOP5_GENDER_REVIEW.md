# Top 5 Mengikut Jantina — production verification, 6 October 2026

Status: **PRODUCTION DEPLOYED AND VERIFIED**. Release complete for the current scope.

Frontend release **`082e15d — feat: add top 5 gender rankings`** was pushed to
`main`; GitHub Pages production is **DEPLOYED AND VERIFIED** on 6 October 2026.
Apps Script production is **Version 9**. The production endpoint was verified
and returned canonical `LELAKI` / `PEREMPUAN`; all **35 active participants** had
valid canonical gender at verification. The production Dashboard was verified
with live data. These production results record the supplied release verification.

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
in this repo. The reader uses the master `JANTINA` header; no gender is inferred
from participant names.

Production is now **Version 9**. The
frontend remains compatible with legacy Version 8 responses, which show empty
gender ranking states when gender is not exposed.

## Frontend

User-facing title: **TOP 5 MENGIKUT JANTINA**. Subtext: **Kedudukan berdasarkan
jumlah KM SAH**. Columns: **LELAKI / WANITA**. `WANITA` is a display label only;
the backend and filter continue to use `PEREMPUAN`.

The new full-width card follows Kedudukan Teratas and Top 3 Individu, before
Ranking Rumah Sukan. Two balanced columns become a vertical Lelaki/Wanita stack
at mobile widths. Each gender group filters the already ordered official leaderboard
and takes the first five, without re-sorting or modifying the source. Zero-KM
participants remain eligible according to the existing official leaderboard.
WANITA is a display label only; canonical data and filters remain LELAKI/PEREMPUAN. Unknown/missing gender is excluded. Gender group ranks are numbered locally #1–#5.

The existing podium emblem builder is shared with gender ranking rows, preserving
podium output, house mapping, accessible house label and image error fallback.
HIJAU still uses the fallback badge. Overall leaderboard, Top 3, KM SAH and
Ranking Rumah Sukan remain unchanged.
The centered 260px watermark (220px mobile) is decorative, opacity 0.1 and ignores
pointer events. Gender ranking rendering failures are isolated from the remaining
dashboard rendering and participant flows.

## Verification

- Production endpoint canonical gender and 35 active participants: **PASS**.
- GitHub Pages production Dashboard with live data: **PASS**.
- KEVITU watermark at **10%**: verified in production.
- Production desktop visual verification: **PASS**.
- Automated feature tests: **17/17 PASS** (`node --test`).
- `node --check assets/js/app.js`: **PASS**.
- `git diff --check`: **PASS**.
- Earlier local fixture visual check: **PASS** at 1440/768/390/320px, including long names,
  two-column/stacked layout, placement and horizontal overflow.

`tests/gender-visual.cjs` is an optional local browser preview utility using the
desktop bundled Playwright and Edge. Pass an output directory for screenshots.
It intercepts all page requests and uses fixtures; it makes no production login,
submission or API requests. This verifies browser layout, not installed-device
PWA behavior. The production verification above is a separate release record;
this preview utility does not verify the backend.
