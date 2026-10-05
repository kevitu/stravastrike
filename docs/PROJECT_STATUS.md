# STRAVA STRIKE KEVITU 2026 — Project Status

Last updated: **5 October 2026** (Malaysia)

**Current phase:** production MVP live di GitHub Pages. Backend Apps Script deployed sebagai **Version 8**. Duplicate/retry protection telah diuji end-to-end; participant self-cancel untuk aktiviti PENDING telah dilaksanakan dan UI production telah dipaparkan.

Production frontend terkini merangkumi logo rasmi Rumah KUNING (`45621f9`), runner background Event Countdown hero (`144ee62`), logo Rumah Sukan pada Top 3 Individu dan aset BIRU yang dikemas (`59624aa`), serta medal/rank PNG Top 3 (`938bbcd`). Dashboard UI Refresh + Event Countdown (`6e14457`), retry automatik dashboard/submission dan penambahbaikan UI mobile terdahulu kekal. Backend production kekal **Apps Script Version 8** yang deployed pada 1 Oktober 2026; perubahan terbaru hanya frontend dan tiada backend/API contract berubah. Ujian duplicate/retry terdahulu tidak menggantikan verification khusus aliran retry automatik terbaru.

**Release progress:** Dashboard UI Refresh + Event Countdown telah **production deployed and verified** di GitHub Pages pada **4 Oktober 2026**, melalui commit **`6e14457` — `feat: refresh dashboard event countdown`**. Production smoke test **PASS**, termasuk REFRESH dan submission sebenar sehingga success receipt. Backend production kekal **Apps Script Version 8**; tiada backend deployment diperlukan untuk release ini.

## Product scope

STRAVA STRIKE KEVITU ialah **Official Event Management & Community Scoreboard**. Ia bukan pengganti Strava dan bukan GPS tracker. Strava/aplikasi kecergasan digunakan untuk rakaman/bukti; sistem ini mengurus peserta, Rumah Sukan, submission, moderation, keputusan rasmi dan sejarah program.

## Official event window

**STRAVA STRIKE KEVITU 2026 berlangsung dari 1 Oktober 2026 hingga hujung 31 Oktober 2026, sebelum masuk 1 November 2026 (waktu Malaysia).**

Rujukan rasmi dokumentasi dan perancangan feature ialah `1 Oktober 2026 00:00:00 +08:00 ≤ waktu < 1 November 2026 00:00:00 +08:00` dalam **Asia/Kuala_Lumpur (UTC+08:00)**. Countdown dan Event Day / Time Progress yang implemented menggunakan tempoh ini; event statistics dan heatmap Oktober yang dirancang juga perlu berpandukan tempoh sama. **Final Mode dan submission cutoff masih PLANNED / belum dilaksanakan**. Selepas countdown tamat, hanya presentation hero berubah; submission tidak disekat.

Pihak urusetia **tidak menetapkan sasaran KM komuniti rasmi**. Paparan **Sasaran Komuniti 2,000 KM telah dibuang daripada Dashboard** dalam release ini. Field/config lama `community_target_km` boleh kekal secara dalaman untuk compatibility API, tetapi bukan KPI rasmi program. Event progress berdasarkan masa event sahaja, bukan sasaran KM; statistik menggambarkan pencapaian sebenar.

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

## Dashboard UI Refresh + Event Countdown — IMPLEMENTED

- [x] Dashboard official sports event / premium style, responsive: Hero → KPI → Kedudukan Teratas | Top 3 Individu | Ranking Rumah Sukan → Aktiviti Terkini pada desktop; layout tablet/mobile menyesuaikan ruang.
- [x] Event Countdown menggunakan official event window +08:00; state **EVENT BELUM BERMULA**, **SEDANG BERLANGSUNG** dan **STRAVA STRIKE KEVITU 2026 TAMAT**.
- [x] Countdown frontend-only, update setiap saat tanpa API/network request atau dependency kepada `dashboard_summary`; baki hari/jam/minit/saat semasa event.
- [x] **HARI X / 31** dan progress masa: sebelum event hari 0 / 0%, semasa event hari 1–31 dan elapsed event time, selepas event hari 31 / 100%.
- [x] Empat KPI daripada field sah sedia ada: **Peserta Aktif** (`participant_count`), **Jumlah KM SAH** (`total_km`), **Jumlah Aktiviti SAH** (`activity_count`), **Hari Aktif** (`active_days`).
- [x] Community target 2,000 KM dikeluarkan daripada UI; event progress bukan sasaran KM atau KPI komuniti.
- [x] Event Countdown hero menggunakan runner background `assets/img/event_runner_background.webp`.
- [x] Kedudukan Teratas kekal menggunakan data SAH sebenar; Top 3 Individu menggunakan medal/rank PNG `assets/img/podium_rank_1.png`, `assets/img/podium_rank_2.png` dan `assets/img/podium_rank_3.png`. #1 sedikit lebih besar (56px) daripada #2/#3 (48px), dengan `object-fit: contain`; logo Rumah Sukan berada di bawah nama peserta. Struktur podium, nama, KM dan logic ranking kekal; responsive desktop/mobile/PWA.
- [x] Ranking Rumah Sukan mempunyai bar relatif: KM tertinggi = 100% visual; rumah lain relatif kepadanya; semua rumah 0 KM menghasilkan semua bar 0%.
- [x] Logo rasmi MERAH → `assets/img/rumah_merah.png`; BIRU → `assets/img/rumah_biru.jpeg` dengan aset yang dikemas; KUNING → `assets/img/rumah_kuning.png`.
- [x] HIJAU sahaja masih menggunakan fallback badge warna sehingga asset rasmi tersedia; image/logo failure kembali kepada badge tanpa menghilangkan nama, KM, ranking atau bar.
- [x] Aktiviti Terkini hanya menggunakan nama, tarikh aktiviti, Rumah Sukan dan jarak daripada field production sedia ada; tiada jenis aktiviti, avatar, masa aktiviti atau data mockup direka.
- [x] Participant identity dipolish menggunakan nama peserta, Rumah Sukan dan LOG KELUAR daripada session sedia ada; session/logout logic kekal.

### Reliability / guardrail

Semua enhancement ini ialah **read-only / progressive enhancement**. Countdown, logo, event progress atau widget Dashboard **tidak boleh menjadi dependency kepada login atau `submit_activity`**. Kegagalan enhancement tidak boleh menghalang login atau HANTAR AKTIVITI.

Generic countdown `failSafely()` hide countdown units dan event progress jika wujud supaya stale event information tidak ditinggalkan. Event-progress failure diasingkan daripada countdown; logo mempunyai fallback. Semua kegagalan tersebut tidak menjejaskan participant app.

Backend/GAS/API contract tidak berubah; backend production kekal **Apps Script Version 8**. Flow berikut tidak diubah dalam release Dashboard ini:

- participant login;
- screenshot compression;
- `submit_activity` dan `submission_id`;
- automatic submission retry;
- personal history;
- cancel PENDING;
- admin/moderation.

### Verification frontend terkini — PASS (5 October 2026)

- [x] `node --test tests/dashboard-refresh.test.cjs` — **10/10 PASS**.
- [x] `git diff --check` — **PASS**, amaran LF → CRLF sahaja.
- [x] Visual check desktop dan PWA/mobile — **PASS**.
- [x] Responsive checks podium medal update pada **1440, 768, 390 dan 320px** — **PASS**, tanpa overflow.
- [x] Backend production kekal **Apps Script Version 8**; tiada backend/API contract berubah. Verification ini tidak mengubah status E2E pending atau roadmap PLANNED.

### Automated/workspace verification sebelum deployment — PASS

- [x] `node --check assets/js/app.js` — **PASS**.
- [x] `node --test tests/dashboard-refresh.test.cjs` — **10/10 PASS** selepas robustness fix.
- [x] `git diff --check` — **PASS**, exit 0; amaran LF → CRLF sahaja.
- [x] Desktop/tablet/mobile dan 320px diuji tanpa horizontal overflow.
- [x] REFRESH dan HANTAR AKTIVITI kekal tersedia.
- [x] Countdown boundaries: sebelum mula, tepat mula, sebelum tamat dan tepat tamat; timer update juga diuji.
- [x] Countdown/API/network independence diuji.
- [x] Countdown/event-progress failure isolation diuji; generic render failure mengesahkan `event-progress.hidden === true`.
- [x] Login tersedia dan HANTAR AKTIVITI membuka borang aktif apabila countdown, logo atau progress gagal.
- [x] Relative House Ranking diuji termasuk semua rumah 0 KM.
- [x] Official logo loading dan image failure fallback diuji; nama, KM dan bar kekal tersedia.
- [x] Test guardrail mengesahkan `app.js` di luar `renderDashboard()` tidak berubah dalam release ini; tiada backend/GAS berubah.

Preview browser menggunakan data awam production; ujian isolation menggunakan fixture sesi ujian. Kenyataan tiada login atau submission sebenar dihantar merujuk **automated/workspace verification sebelum deployment sahaja**. Production smoke test selepas deployment telah mengesahkan submission sebenar berjaya sehingga menerima success receipt. Ujian transient retry dan cancel yang masih pending kekal berasingan.

### Production verification — PASS (4 Oktober 2026)

- [x] Dashboard UI Refresh + Event Countdown deployed ke production GitHub Pages.
- [x] Production release commit **`6e14457` — `feat: refresh dashboard event countdown`**.
- [x] Production smoke test **PASS**.
- [x] Dashboard baharu, countdown, Event Day / Time Progress, KPI, Kedudukan Teratas dan Top 3 Individu berjaya dipaparkan.
- [x] House Ranking, bar relatif, logo/fallback berjaya dipaparkan; status terkini ialah logo rasmi MERAH/BIRU/KUNING dan fallback badge HIJAU sahaja.
- [x] REFRESH berjaya memuatkan data semasa.
- [x] HANTAR AKTIVITI production berjaya sehingga menerima **success receipt** bagi submission sebenar.
- [x] Backend kekal **Apps Script Version 8**; tiada backend/GAS deployment atau perubahan API contract diperlukan untuk release ini.

Status logo terkini (5 October 2026): MERAH, BIRU dan KUNING menggunakan logo rasmi; HIJAU sahaja masih menggunakan fallback badge. Final Mode dan submission cutoff masih **PLANNED / belum implemented**; status hero tamat tidak menyekat submission.

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

Verification khusus release retry/mobile terdahulu yang masih belum direkodkan (berasingan daripada verification Dashboard di atas):
- [ ] Simulasi kegagalan sementara dashboard dan sahkan retry memuat data; REFRESH production telah PASS dalam smoke test.
- [ ] Simulasi kegagalan sementara submission, sahkan mesej pengesahan, ID sama dan tiada ACT/screenshot duplicate.
- [ ] Semak splash berpusat dan input PIN sejarah pada peranti mobile.

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

Backend production semasa kekal **Version 8**; tiada version baharu diperlukan untuk commit frontend terkini sehingga 5 October 2026.

Dashboard UI Refresh + Event Countdown juga frontend-only dan tidak memerlukan deployment backend atau perubahan API contract.

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

- `6e14457` — `feat: refresh dashboard event countdown` (4 Oktober 2026); Dashboard UI Refresh + Event Countdown **production deployed and verified**, smoke test **PASS**.
- `45621f9` — tambah logo rasmi Rumah KUNING.
- `144ee62` — tambah runner background pada Event Countdown hero.
- `59624aa` — tambah logo Rumah Sukan pada Top 3 Individu dan kemaskan aset BIRU.
- `938bbcd` — ganti badge ranking Top 3 dengan PNG `podium_rank_1.png`, `podium_rank_2.png`, `podium_rank_3.png`.

## Roadmap dashboard

IMPLEMENTED merujuk release Dashboard yang **production deployed and verified** pada 4 Oktober 2026 (`6e14457`); status PLANNED kekal belum dilaksanakan.

| Feature | Status |
| --- | --- |
| Dashboard UI Refresh | IMPLEMENTED dalam release ini |
| Event Countdown | IMPLEMENTED dalam release ini |
| Event Day / Time Progress | IMPLEMENTED dalam release ini |
| House Ranking relative comparison | IMPLEMENTED dalam release ini |
| House logo support/fallback | IMPLEMENTED dalam release ini |
| House Battle enhancement (asas) | IMPLEMENTED; logo rasmi HIJAU sahaja menunggu asset |
| Today at STRAVA STRIKE | PLANNED / belum dilaksanakan |
| Personal Progress Card | PLANNED / belum dilaksanakan |
| Streak & Active Days | PLANNED / belum dilaksanakan |
| Milestone / Achievement badges ala Strava | PLANNED / belum dilaksanakan |
| October Activity Heatmap | PLANNED / belum dilaksanakan |
| Final Mode selepas event tamat | PLANNED / belum dilaksanakan |

Enhancement asas House Battle meliputi bar relatif dan logo/fallback; logo rasmi HIJAU sahaja masih menunggu asset; MERAH, BIRU dan KUNING menggunakan logo rasmi. Event statistics dan heatmap Oktober yang dirancang perlu berpandukan official event window. Final Mode selepas event tamat pada 1 November 2026 00:00 waktu Malaysia kekal PLANNED; hero tamat tidak melaksanakan Final Mode atau submission cutoff. Progress, milestone dan statistik tidak boleh menjadikan community target sebagai KPI rasmi urusetia.

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
