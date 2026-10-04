# STRAVA STRIKE KEVITU 2026 — Project Status

Last updated: **4 October 2026** (Malaysia)

**Current phase:** production MVP live di GitHub Pages. Backend Apps Script deployed sebagai **Version 8**. Duplicate/retry protection telah diuji end-to-end; participant self-cancel untuk aktiviti PENDING telah dilaksanakan dan UI production telah dipaparkan.

Production frontend terkini merangkumi retry automatik dashboard/submission dan penambahbaikan UI mobile sehingga commit `761b798`. Backend kekal **Version 8** yang deployed pada 1 Oktober 2026; perubahan terbaru hanya frontend reliability/UI dan tidak memerlukan backend version baharu. Ujian duplicate/retry terdahulu tidak menggantikan verification khusus aliran retry automatik terbaru.

## Product scope

STRAVA STRIKE KEVITU ialah **Official Event Management & Community Scoreboard**. Ia bukan pengganti Strava dan bukan GPS tracker. Strava/aplikasi kecergasan digunakan untuk rakaman/bukti; sistem ini mengurus peserta, Rumah Sukan, submission, moderation, keputusan rasmi dan sejarah program.

## Official event window

**STRAVA STRIKE KEVITU 2026 berlangsung dari 1 Oktober 2026 hingga hujung 31 Oktober 2026, sebelum masuk 1 November 2026 (waktu Malaysia).**

Rujukan rasmi dokumentasi dan perancangan feature ialah `1 Oktober 2026 00:00:00 ≤ waktu < 1 November 2026 00:00:00` dalam **Asia/Kuala_Lumpur (UTC+08:00)**. Countdown, event statistics dan heatmap Oktober mesti berpandukan tempoh ini; Final Mode dirancang selepas event tamat. Sekatan tarikh dan Final Mode tidak dianggap sudah dilaksanakan dalam production.

Pihak urusetia **tidak menetapkan sasaran KM komuniti rasmi**. `2,000 KM` atau mana-mana community target dalam paparan/config sedia ada bukan KPI rasmi program. Statistik dan progress perlu menggambarkan pencapaian sebenar tanpa mendakwa adanya sasaran KM urusetia.

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

## Frontend reliability / UI — 2–4 Oktober 2026

- [x] `034c179`: `dashboard_summary` retry sekali selepas transient API failure.
- [x] `e597559`: butang dashboard **REFRESH** memuat semula ringkasan; splash mobile dipusatkan dengan sokongan viewport/safe area.
- [x] `75c942e`: input PIN sejarah mobile diperbesarkan (teks 20px; input/butang minimum tinggi 56px pada lebar sehingga 700px).
- [x] `0538067`: `submit_activity` retry sekali menggunakan payload dan `submission_id` yang sama untuk satu submission logikal.
- [x] `761b798`: butang submission memaparkan **MENGESAHKAN PENGHANTARAN...** semasa retry.

Retry automatik `dashboard_summary` dan `submit_activity` mempunyai maksimum dua cubaan, sela 1 saat sebelum retry dan timeout 30 saat setiap cubaan. Submission menggunakan idempotency backend sedia ada daripada Version 7 yang kekal dalam **Version 8**.

Verification release khusus yang belum direkodkan:
- [ ] Simulasi kegagalan sementara dashboard dan sahkan retry/REFRESH memuat data.
- [ ] Simulasi kegagalan sementara submission, sahkan mesej pengesahan, ID sama dan tiada ACT/screenshot duplicate.
- [ ] Semak REFRESH, splash berpusat dan input PIN sejarah pada peranti mobile.

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

Backend production semasa kekal **Version 8**; tiada version baharu diperlukan untuk lima commit frontend pada 2–4 Oktober 2026.

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
- `034c179` — retry `dashboard_summary` pada transient API failure (2 Oktober 2026).
- `e597559` — dashboard REFRESH + mobile splash centered (2 Oktober 2026).
- `75c942e` — enlarge mobile history PIN input (3 Oktober 2026).
- `0538067` — retry `submit_activity` pada transient failure dengan `submission_id` sama (4 Oktober 2026).
- `761b798` — show **MENGESAHKAN PENGHANTARAN...** during submission retry (4 Oktober 2026).

## Roadmap dashboard — PLANNED / belum dilaksanakan

Semua feature dashboard berikut telah dipersetujui untuk perancangan; semuanya **PLANNED / belum dilaksanakan** dan bukan sebahagian Completed MVP:

| Feature | Status |
| --- | --- |
| Event Countdown | PLANNED / belum dilaksanakan |
| Today at STRAVA STRIKE | PLANNED / belum dilaksanakan |
| Personal Progress Card | PLANNED / belum dilaksanakan |
| Streak & Active Days | PLANNED / belum dilaksanakan |
| House Battle enhancement | PLANNED / belum dilaksanakan |
| Milestone / Achievement badges | PLANNED / belum dilaksanakan |
| October Activity Heatmap | PLANNED / belum dilaksanakan |
| Final Mode selepas event tamat | PLANNED / belum dilaksanakan |

Perancangan countdown/event statistics menggunakan official event window; heatmap meliputi Oktober 2026 dan Final Mode bermula selepas event tamat pada 1 November 2026 00:00 waktu Malaysia. Progress, milestone dan statistik tidak boleh menjadikan community target sebagai KPI rasmi urusetia.

**Prinsip keselamatan pembangunan:** semua feature dashboard baharu ialah **read-only / progressive enhancement** dan **tidak boleh menjadi dependency kepada login atau `submit_activity`**. Kegagalan widget/statistik dashboard tidak boleh menghalang peserta login atau menghantar bukti. Ketersediaan widget tambahan mesti bebas daripada aliran login dan penghantaran.

## Future / TODO

- [ ] Create/select active year.
- [ ] Archive previous year.
- [ ] Reset annual leaderboard dengan historical preservation.
- [ ] Konfigurasi sasaran tahunan pilihan hanya jika ditetapkan urusetia untuk program akan datang; tiada sasaran KM komuniti rasmi bagi event Oktober 2026.
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
