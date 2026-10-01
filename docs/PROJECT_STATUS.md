# STRAVA STRIKE KEVITU 2026 — Project Status

Last updated: **1 October 2026** (Malaysia)

**Current phase:** production MVP live di GitHub Pages. Backend Apps Script deployed sebagai **Version 8**. Duplicate/retry protection telah diuji end-to-end; participant self-cancel untuk aktiviti PENDING telah dilaksanakan dan UI production telah dipaparkan.

## Product scope

STRAVA STRIKE KEVITU ialah **Official Event Management & Community Scoreboard**. Ia bukan pengganti Strava dan bukan GPS tracker. Strava/aplikasi kecergasan digunakan untuk rakaman/bukti; sistem ini mengurus peserta, Rumah Sukan, submission, moderation, keputusan rasmi dan sejarah program.

## Completed MVP

- [x] Google Form registration → participant master.
- [x] Kod peserta KEVxxx, PIN 4 digit, status dan Rumah Sukan.
- [x] Participant login + 12-hour idle session.
- [x] Dashboard, leaderboard, podium, latest activities, house ranking.
- [x] Aktiviti SAH sahaja dikira dalam scoreboard.
- [x] Submission tarikh + KM + screenshot + PIN.
- [x] Screenshot resize/compression + Drive upload.
- [x] Personal activity history SAH/PENDING/BATAL.
- [x] Admin moderation PENDING → SAH/BATAL.
- [x] GitHub Pages production menggunakan `main` + `/(root)`.
- [x] Tarikh user-facing DD/MM/YYYY.

## Duplicate/retry protection

Backend **Version 7** menambah `SUBMISSION_ID`.

- [x] Frontend generate ID unik untuk satu submission logikal.
- [x] Retry menggunakan ID sama.
- [x] Backend check ID di bawah `ScriptLock`.
- [x] Duplicate retry return rekod asal sebelum jana ACT/upload screenshot.
- [x] Ujian sebenar: `ACT000013` dipulangkan semula.
- [x] Tiada `ACT000014` dicipta selepas retry yang sama.

## Participant self-cancel

Backend **Version 8** menambah `participant_cancel_activity`.

Rules:
- [x] kod peserta + PIN sah;
- [x] peserta AKTIF;
- [x] activity milik peserta;
- [x] hanya PENDING boleh batal;
- [x] PENDING → BATAL;
- [x] screenshot asal kekal untuk audit;
- [x] SAH/BATAL tidak boleh dibatalkan sendiri.

Frontend commit `968eabd`:
- [x] butang **BATALKAN** hanya pada PENDING;
- [x] confirmation dialog;
- [x] PIN confirmation;
- [x] API call + history refresh.

Masih perlu verification sebenar:
- [ ] tekan BATALKAN pada PENDING sebenar;
- [ ] confirm status bertukar BATAL;
- [ ] confirm butang hilang selepas refresh;
- [ ] confirm BATAL tidak masuk scoreboard;
- [ ] confirm cancel rekod SAH direject.

## Backend deployment history

| Version | Perubahan |
| --- | --- |
| 6 | Dashboard/history/admin MVP |
| 7 | Idempotent retry dengan `SUBMISSION_ID` |
| 8 | Participant self-cancel PENDING |

## API actions semasa

| Action | Status |
| --- | --- |
| `participant_directory` | Live |
| `participant_login` | Live |
| `submit_activity` | Live; idempotent retry |
| `dashboard_summary` | Live |
| `participant_activity_history` | Live |
| `participant_cancel_activity` | Live backend; cancel E2E verification pending |
| `admin_login` | Live |
| `admin_pending` | Live |
| `admin_update_status` | Live |

## Data model aktiviti

| Kolum | Header |
| --- | --- |
| A | ID_AKTIVITI |
| B | TIMESTAMP |
| C | KOD_PESERTA |
| D | NAMA |
| E | TARIKH_AKTIVITI |
| F | JARAK_KM |
| G | SCREENSHOT_URL |
| H | STATUS |
| I | SUBMISSION_ID |

Rekod lama boleh mempunyai `SUBMISSION_ID` kosong. Rekod baharu selepas Version 7 mengisi kolum I.

## Status

- `PENDING` — menunggu semakan; peserta boleh batal sendiri.
- `SAH` — rasmi dan dikira dalam scoreboard.
- `BATAL` — tidak dikira; bukti kekal untuk audit.

## Git / release history terkini

- `f1f7f95` — update login header PWA icon and cache version.
- `5a0a10a` — prevent duplicate activity submissions.
- `968eabd` — allow participants to cancel pending activities.

## Future / TODO

- [ ] Create/select active year.
- [ ] Archive previous year.
- [ ] Reset annual leaderboard dengan historical preservation.
- [ ] Annual target configuration.
- [ ] Year-based participant/house configuration.
- [ ] Leaderboard/aktiviti/ranking Rumah Sukan CSV.
- [ ] PDF report jika diperlukan.
- [ ] Kecilkan/stylize butang **BATALKAN** dalam history.
- [ ] Direct Strava API sync hanya selepas review teknikal/privasi/terms.

## References

- [README](../README.md)
- [GitHub repository](https://github.com/kevitu/stravastrike)
- [GitHub Pages](https://kevitu.github.io/stravastrike/)
- [Apps Script Web App API](https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec)

Jangan dokumentasikan participant PIN atau admin credentials.
