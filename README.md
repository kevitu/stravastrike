# STRAVA STRIKE KEVITU 2026

**STRAVA STRIKE KEVITU** ialah platform pengurusan event dan papan skor komuniti untuk merekod, menyemak, mengesahkan dan memaparkan prestasi peserta dalam program kecergasan KEVITU. Sistem ini **bukan pengganti Strava** dan bukan aplikasi GPS; Strava atau aplikasi kecergasan lain kekal sebagai sumber rakaman/bukti aktiviti, manakala STRAVA STRIKE KEVITU menjadi **Official Event Management & Community Scoreboard** untuk urusan program dalaman.

Frontend menggunakan HTML, CSS dan Vanilla JavaScript tanpa framework berat.

**Status semasa (4 Oktober 2026):** frontend production tersedia melalui GitHub Pages, backend Apps Script kekal deployed sebagai **Version 8** pada 1 Oktober 2026. Penambahbaikan terbaru meliputi retry automatik dashboard/submission, butang REFRESH dashboard, splash mobile berpusat dan input PIN sejarah mobile yang lebih besar. Perubahan reliability/UI ini hanya pada frontend dan tidak memerlukan backend version baharu. Aliran login, submission, moderation, dashboard, sejarah peribadi dan perlindungan retry/duplicate telah diuji secara sebenar pada release terdahulu. Fungsi pembatalan sendiri oleh peserta untuk rekod PENDING telah dilaksanakan dan UI production telah dipaparkan; end-to-end cancel masih perlu direkodkan sebagai ujian release khusus.

**Release Dashboard UI Refresh + Event Countdown:** implementasi dan verification siap dalam workspace pada 4 Oktober 2026; masih menunggu review, commit/push dan deployment frontend. Status IMPLEMENTED dalam dokumen ini merujuk release tersebut, bukan pengesahan bahawa UI baharu sudah deployed ke production. Backend production kekal **Apps Script Version 8**.

## Tempoh rasmi event

**STRAVA STRIKE KEVITU 2026 berlangsung dari 1 Oktober 2026 hingga hujung 31 Oktober 2026, sebelum masuk 1 November 2026 (waktu Malaysia).**

Official event window ialah `1 Oktober 2026 00:00:00 +08:00 ≤ waktu < 1 November 2026 00:00:00 +08:00`, zon waktu **Asia/Kuala_Lumpur (UTC+08:00)**. Countdown dan Event Day / Time Progress dalam release ini menggunakan tempoh tersebut; event statistics, heatmap Oktober serta Final Mode yang dirancang juga perlu berpandukan tempoh ini. **Final Mode dan submission cutoff belum dilaksanakan**; selepas countdown tamat, hanya presentation hero berubah dan submission tidak disekat.

Pihak urusetia **tidak menetapkan sasaran KM komuniti rasmi**. Paparan **Sasaran Komuniti 2,000 KM telah dibuang daripada Dashboard** dalam release ini. Field/config lama `community_target_km` boleh kekal secara dalaman untuk compatibility API, tetapi bukan KPI rasmi program. Statistik komuniti merujuk pencapaian sebenar; event progress mengukur masa event sahaja, **bukan sasaran KM**.

## Skop rasmi sistem

Peranan utama sistem:
- mengurus identiti peserta dan Rumah Sukan;
- menerima penghantaran aktiviti dan bukti screenshot;
- membolehkan urusetia menyemak status PENDING → SAH / BATAL;
- mengira keputusan rasmi berdasarkan aktiviti SAH sahaja;
- memaparkan leaderboard individu, Top 3, ranking Rumah Sukan dan statistik pencapaian komuniti;
- menyimpan sejarah aktiviti peserta serta rekod audit program;
- memberi saluran pembatalan sendiri untuk submission PENDING yang tersalah dihantar.

Peranan Strava / aplikasi kecergasan:
- merekod aktiviti sebenar peserta;
- menyediakan screenshot/bukti yang dihantar ke STRAVA STRIKE KEVITU;
- tidak menjadi sumber keputusan rasmi secara automatik pada implementasi semasa.

Keputusan rasmi event kekal ditentukan oleh data yang disahkan dalam STRAVA STRIKE KEVITU.

> **GERAK BERSAMA. CAPAI LEBIH.**

## Sistem dan fail utama

```text
Google Form → DaftarStravaStrike2026 → PesertaStravaStrike2026
Participant PWA → Apps Script API → AktivitiStravaStrike2026 + bukti Google Drive
Peserta → PENDING → batal sendiri jika tersalah hantar
Urusetia → semakan PENDING → SAH / BATAL → keputusan live
```

| Komponen | Fail / lokasi |
| --- | --- |
| Participant frontend | `index.html`, `assets/css/app.css`, `assets/js/app.js` |
| Admin berasingan | `admin.html`, `assets/css/admin.css`, `assets/js/admin.js` |
| PWA | `manifest.webmanifest`, `service_worker.js` |
| Ikon | `assets/icon_192.png`, `assets/icon_512.png` |
| Logo KEVITU | `assets/img/kevitu-logo.png` |
| Backend reference/patch tempatan | `backend/dashboard_summary.gs`, `backend/participant_activity_history.gs` dan router patches |

Kod Apps Script penuh/deployed masih diurus di Google Apps Script dan tidak sepenuhnya dicerminkan dalam folder `backend/`.

- [GitHub repository](https://github.com/kevitu/stravastrike)
- [GitHub Pages](https://kevitu.github.io/stravastrike/)
- [Apps Script Web App API](https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec)

## Pendaftaran dan akses peserta

Pendaftaran melalui Google Form diselaraskan ke master `PesertaStravaStrike2026`. Setiap peserta mempunyai kod unik seperti `KEV019`, PIN 4 digit, status aktif/tidak aktif dan rumah sukan: **MERAH, BIRU, HIJAU, KUNING**. Kod dan PIN peserta lama dikekalkan semasa sync; peserta baharu diberi status `AKTIF`.

Login menggunakan **dropdown nama + PIN 4 digit**. Nama dipadankan dengan `KOD_PESERTA`; backend mengesahkan identiti dan status peserta.

Sesi peserta tamat selepas **12 jam tanpa aktiviti**. `localStorage` menyimpan metadata sesi sahaja: `kod_peserta`, `nama`, `rumah_sukan` dan `last_active`. PIN tidak dipersistkan dalam `localStorage` atau `sessionStorage`.

## Paparan participant

- **Dashboard:** hero Event Countdown, statistik live, lima kedudukan teratas, podium Top 3 Individu, lima aktiviti terkini dan Ranking Rumah Sukan dalam gaya official sports event / premium dashboard; butang **REFRESH** memuat semula ringkasan terkini.
- **Kedudukan:** leaderboard penuh menggunakan data live.
- **Aktiviti:** penghantaran sebenar, receipt, sejarah sendiri, pautan bukti dan pembatalan PENDING.
- **Peserta:** direktori aktif mengikut rumah sukan, nama A–Z dan bilangan peserta.

### Peraturan dashboard

Action `dashboard_summary` menggunakan peserta aktif dan hanya aktiviti **`STATUS = SAH`**. `PENDING` dan `BATAL` tidak menyumbang kepada jumlah aktiviti, total KM, hari aktif, leaderboard, Top 3, aktiviti terkini, jumlah Rumah Sukan atau statistik pencapaian komuniti.

Tarikh user-facing dipaparkan sebagai **DD/MM/YYYY**; nilai dalaman/API boleh kekal ISO `YYYY-MM-DD`.

Jika request `dashboard_summary` mengalami kegagalan sementara, frontend mencuba semula sekali selepas 1 saat (maksimum dua cubaan, timeout 30 saat bagi setiap cubaan). Splash mobile dipusatkan dalam viewport dengan mengambil kira safe area peranti.

### Dashboard UI Refresh + Event Countdown — IMPLEMENTED

- **Countdown:** frontend-only, dikira setiap saat tanpa API/network request dan tanpa dependency kepada `dashboard_summary`. State ialah **EVENT BELUM BERMULA**, **SEDANG BERLANGSUNG** dan **STRAVA STRIKE KEVITU 2026 TAMAT**; semasa event, baki hari/jam/minit/saat dipaparkan.
- **Event Day / Time Progress:** **HARI X / 31** dan bar nipis berdasarkan elapsed event time; sebelum event hari 0 / progress 0%, semasa event hari 1–31 mengikut waktu Malaysia, selepas event hari 31 / progress 100%.
- **Empat KPI:** **Peserta Aktif**, **Jumlah KM SAH**, **Jumlah Aktiviti SAH** dan **Hari Aktif**, daripada medan API sedia ada `participant_count`, `total_km`, `activity_count` dan `active_days`.
- **Kedudukan Teratas / Top 3 Individu:** kedudukan kekal berdasarkan data SAH sebenar; podium dikemas kini secara visual.
- **Ranking Rumah Sukan:** bar ialah perbandingan relatif kepada rumah dengan KM tertinggi (100% visual); rumah lain relatif kepadanya. Jika semua rumah 0 KM, semua bar 0%. Ini bukan progress kepada sasaran rasmi.
- **Logo rumah:** MERAH menggunakan `assets/img/rumah_merah.png`; BIRU menggunakan `assets/img/rumah_biru.jpeg` dalam frame seragam yang kemas untuk latar putih JPEG. HIJAU/KUNING menggunakan fallback badge warna sehingga asset rasmi tersedia. Image/logo failure memaparkan badge fallback tanpa menghilangkan nama rumah, KM, ranking atau bar relatif.
- **Aktiviti Terkini:** hanya nama peserta, tarikh aktiviti, Rumah Sukan dan jarak daripada field production sedia ada; tiada jenis aktiviti, avatar, masa aktiviti atau data mockup direka.
- **Participant identity:** nama peserta, Rumah Sukan dan LOG KELUAR dipolish secara compact menggunakan session sedia ada; session/logout logic tidak berubah.

### Reliability / guardrail release

Dashboard enhancement ini ialah **read-only / progressive enhancement**. Countdown, logo, event progress atau widget Dashboard **tidak boleh menjadi dependency kepada login atau `submit_activity`**; kegagalannya tidak boleh menghalang peserta login atau menghantar bukti.

Generic countdown `failSafely()` turut hide countdown units dan event progress jika wujud supaya stale event information tidak ditinggalkan. Event-progress failure diasingkan daripada countdown; kegagalan enhancement ini tidak menjejaskan participant app.

Backend/GAS/API contract tidak berubah dan backend production kekal **Apps Script Version 8**. Release ini tidak mengubah participant login, screenshot compression, `submit_activity`, `submission_id`, automatic submission retry, personal history, cancel PENDING atau admin/moderation.

## Penghantaran aktiviti

Peserta memberikan **tarikh aktiviti, jarak KM, screenshot wajib dan PIN pengesahan**. Jarak mesti nombor sah **lebih daripada 0**, perpuluhan dibenarkan dan tiada business-rule maksimum jarak.

Screenshot JPEG/PNG/WebP dikecilkan tanpa crop kepada sisi terpanjang maksimum 1280px dan dimampatkan sebelum base64 dihantar. Frontend menghadkan sumber kepada 15 MB dan sasaran upload selepas pemampatan sekitar 500 KB. Backend menghadkan decoded screenshot kepada 5 MB, memuat naik bukti ke Google Drive dan merekodkan aktiviti baharu sebagai **PENDING**.

### Idempotent retry / perlindungan duplicate

Mulai backend **Apps Script Version 7**, setiap penghantaran baharu membawa `submission_id` unik yang disimpan dalam kolum `SUBMISSION_ID` pada `AktivitiStravaStrike2026`.

Flow:
1. frontend menjana satu `submission_id` untuk satu cubaan logikal;
2. retry selepas sambungan gagal menggunakan `submission_id` yang sama;
3. backend menyemak `submission_id` di bawah `ScriptLock` sebelum jana ACT ID atau upload screenshot;
4. jika ID sama untuk peserta sama sudah wujud, backend memulangkan rekod asal;
5. tiada ACT baharu dan tiada screenshot kedua untuk retry yang sama.

Ujian sebenar pada 1 Oktober 2026 mengesahkan `ACT000013` dipulangkan semula apabila request dengan `submission_id` sama dihantar semula, dan **tiada `ACT000014` dicipta**.

Mulai 4 Oktober 2026, frontend turut retry `submit_activity` secara automatik sekali selepas kegagalan sementara, menggunakan payload dan `submission_id` yang sama. Semasa retry, butang memaparkan **MENGESAHKAN PENGHANTARAN...**. Mekanisme ini menggunakan perlindungan idempotent backend sedia ada; Apps Script kekal **Version 8**.

## Sejarah dan pembatalan aktiviti peserta

Action `participant_activity_history` memerlukan `kod_peserta` + PIN, mengesahkan peserta wujud, PIN betul dan status `AKTIF`, kemudian hanya mengembalikan rekod milik peserta tersebut.

Sejarah memaparkan **SAH, PENDING dan BATAL**, tarikh, jarak, ID aktiviti dan pautan **LIHAT BUKTI**.

Pada mobile (lebar sehingga 700px), input PIN sejarah dan butangnya diperbesarkan kepada minimum tinggi 56px; teks input PIN menggunakan saiz 20px untuk memudahkan pengesahan.

Mulai backend **Version 8**, peserta boleh membatalkan rekod sendiri melalui action `participant_cancel_activity` dengan syarat:
- aktiviti milik peserta tersebut;
- PIN 4 digit sah;
- peserta `AKTIF`;
- status semasa ialah **PENDING**.

Pembatalan menukar `PENDING → BATAL`; screenshot asal **tidak dipadam** untuk audit. Rekod `SAH` atau `BATAL` tidak boleh dibatalkan sendiri. Selepas batal, peserta boleh hantar semula bukti betul sebagai submission baharu.

## Urus setia

Admin menggunakan `admin.html`, Admin ID + PIN, sesi **2 jam tanpa aktiviti**, senarai PENDING dan tindakan **SAHKAN / BATALKAN**. Credentials admin disimpan dalam Apps Script Script Properties dan tidak di-hardcode pada frontend.

## API tersedia — Apps Script Version 8

| Action | Kegunaan |
| --- | --- |
| `participant_directory` | Direktori peserta aktif |
| `participant_login` | Pengesahan kod peserta + PIN |
| `submit_activity` | Submission + idempotent retry melalui `submission_id` |
| `dashboard_summary` | Ringkasan awam SAH sahaja |
| `participant_activity_history` | Sejarah peribadi |
| `participant_cancel_activity` | Batal sendiri jika masih PENDING |
| `admin_login` | Login admin |
| `admin_pending` | Senarai PENDING |
| `admin_update_status` | Urusetia tukar PENDING → SAH/BATAL |

## PWA dan deployment

GitHub Pages menggunakan branch `main` dengan folder **/(root)**. Production URL:
https://kevitu.github.io/stravastrike/

Deployment penting:
- `f1f7f95` — update login header PWA icon/cache;
- `5a0a10a` — duplicate activity submission protection;
- `968eabd` — participant self-cancel UI untuk PENDING.
- `034c179` — retry `dashboard_summary` pada transient API failure (2 Oktober 2026);
- `e597559` — dashboard **REFRESH** + mobile splash centered (2 Oktober 2026);
- `75c942e` — input PIN sejarah mobile diperbesarkan (3 Oktober 2026);
- `0538067` — retry `submit_activity` pada transient failure menggunakan `submission_id` sama (4 Oktober 2026);
- `761b798` — paparkan **MENGESAHKAN PENGHANTARAN...** semasa retry submission (4 Oktober 2026).

Lima commit terbaru ini ialah perubahan frontend sahaja dan tidak memerlukan deployment backend version baharu.

`service_worker.js` cache static app-shell sahaja. API POST, PIN, screenshot/base64, sejarah peribadi dan moderation admin tidak dicache.

## Status verifikasi

### Verification release Dashboard UI Refresh + Event Countdown

Verification implementasi dalam workspace pada 4 Oktober 2026:

- `node --check assets/js/app.js` — **PASS**.
- `node --test tests/dashboard-refresh.test.cjs` — **10/10 PASS**, termasuk robustness fix generic countdown failure yang mengesahkan `event-progress.hidden === true`.
- `git diff --check` — **PASS**, exit 0; amaran LF → CRLF sahaja.
- Desktop/tablet/mobile dan lebar 320px diuji tanpa horizontal overflow; **REFRESH** dan **HANTAR AKTIVITI** kekal tersedia.
- Countdown boundaries diuji sebelum mula, tepat mula, sebelum tamat dan tepat tamat; update timer serta API/network independence diuji.
- Countdown/event-progress failure isolation diuji; login tersedia dan HANTAR AKTIVITI masih membuka borang aktif ketika enhancement gagal.
- Relative House Ranking diuji termasuk semua rumah 0 KM; official logo loading dan image failure fallback turut diuji tanpa kehilangan nama, KM atau bar.
- Test guardrail mengesahkan `app.js` di luar `renderDashboard()` tidak berubah dalam release Dashboard ini; tiada backend/GAS berubah.

Preview browser menggunakan data awam production untuk semakan visual. Ujian isolation menggunakan fixture sesi ujian; tiada login atau submission sebenar dihantar. Verification ini tidak menggantikan E2E submission/cancel di bawah atau mengesahkan deployment release baharu.

### Verification terdahulu dan E2E pending

Telah disahkan pada release terdahulu:
- login/directory;
- submission + screenshot ke Drive;
- PENDING dan moderation PENDING → SAH;
- dashboard live;
- personal history;
- logout/session;
- `SUBMISSION_ID` pada submission baharu;
- retry ID sama pulangkan ACT asal tanpa duplicate;
- Pages production deployed;
- butang **BATALKAN** dipaparkan untuk PENDING.

Masih perlu E2E khusus:
- retry automatik dashboard/submission ketika kegagalan sementara, mesej pengesahan dan ketiadaan duplicate pada aliran retry terbaru;
- REFRESH dashboard, splash berpusat dan input PIN sejarah pada peranti mobile;
- tekan BATALKAN → confirm → PIN → `PENDING → BATAL`;
- history refresh dan butang BATALKAN hilang;
- rekod BATAL kekal tidak dikira dalam scoreboard.

## Roadmap dashboard

Status IMPLEMENTED merujuk release Dashboard UI Refresh yang siap di workspace; feature PLANNED masih belum dilaksanakan.

| Feature | Status |
| --- | --- |
| Dashboard UI Refresh | IMPLEMENTED dalam release ini |
| Event Countdown | IMPLEMENTED dalam release ini |
| Event Day / Time Progress | IMPLEMENTED dalam release ini |
| House Ranking relative comparison | IMPLEMENTED dalam release ini |
| House logo support/fallback | IMPLEMENTED dalam release ini |
| House Battle enhancement (asas) | IMPLEMENTED; logo rasmi HIJAU/KUNING menunggu asset |
| Today at STRAVA STRIKE | PLANNED / belum dilaksanakan |
| Personal Progress Card | PLANNED / belum dilaksanakan |
| Streak & Active Days | PLANNED / belum dilaksanakan |
| Milestone / Achievement badges ala Strava | PLANNED / belum dilaksanakan |
| October Activity Heatmap | PLANNED / belum dilaksanakan |
| Final Mode selepas event tamat | PLANNED / belum dilaksanakan |

Enhancement asas House Battle meliputi bar relatif dan logo/fallback; asset rasmi HIJAU/KUNING masih menunggu. Event statistics dan October Activity Heatmap yang dirancang perlu menggunakan official event window. Final Mode selepas 1 November 2026 00:00 waktu Malaysia kekal PLANNED; hero tamat tidak melaksanakan Final Mode atau submission cutoff. Progress, milestone dan statistik tidak boleh menganggap community target sebagai KPI rasmi urusetia.

**Prinsip keselamatan pembangunan:** semua feature dashboard baharu ialah **read-only / progressive enhancement** dan **tidak boleh menjadi dependency kepada login atau `submit_activity`**. Kegagalan widget/statistik dashboard tidak boleh menghalang peserta login atau menghantar bukti; aliran penghantaran mesti terus tersedia secara bebas daripada widget tambahan.

## Future / TODO

- annual programme/year management;
- archive previous year dan preserve history;
- reset leaderboard tahunan;
- konfigurasi sasaran tahunan pilihan hanya jika ditetapkan urusetia untuk program akan datang; tiada sasaran KM komuniti rasmi bagi event Oktober 2026;
- year-based participant/house configuration;
- eksport admin CSV;
- laporan PDF jika diperlukan;
- kemaskan visual butang **BATALKAN** (fungsi sudah ada, presentation desktop masih terlalu lebar).

Integrasi terus dengan Strava API **bukan sebahagian implementasi semasa** dan perlu dinilai berasingan dari sudut teknikal, privasi dan syarat penggunaan.
