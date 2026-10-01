# STRAVA STRIKE KEVITU 2026

**STRAVA STRIKE KEVITU** ialah platform pengurusan event dan papan skor komuniti untuk merekod, menyemak, mengesahkan dan memaparkan prestasi peserta dalam program kecergasan KEVITU. Sistem ini **bukan pengganti Strava** dan bukan aplikasi GPS; Strava atau aplikasi kecergasan lain kekal sebagai sumber rakaman/bukti aktiviti, manakala STRAVA STRIKE KEVITU menjadi **Official Event Management & Community Scoreboard** untuk urusan program dalaman.

Frontend menggunakan HTML, CSS dan Vanilla JavaScript tanpa framework berat.

**Status semasa:** frontend production tersedia melalui GitHub Pages, backend Apps Script deployed sebagai **Version 8** pada 1 Oktober 2026. Aliran login, submission, moderation, dashboard, sejarah peribadi dan perlindungan retry/duplicate telah diuji secara sebenar. Fungsi pembatalan sendiri oleh peserta untuk rekod PENDING telah dilaksanakan dan UI production telah dipaparkan; end-to-end cancel masih perlu direkodkan sebagai ujian release khusus.

## Skop rasmi sistem

Peranan utama sistem:
- mengurus identiti peserta dan Rumah Sukan;
- menerima penghantaran aktiviti dan bukti screenshot;
- membolehkan urusetia menyemak status PENDING → SAH / BATAL;
- mengira keputusan rasmi berdasarkan aktiviti SAH sahaja;
- memaparkan leaderboard individu, Top 3, ranking Rumah Sukan dan sasaran komuniti;
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

- **Dashboard:** KPI live, lima kedudukan teratas, podium Top 3, lima aktiviti terkini, ranking Rumah Sukan dan kemajuan sasaran komuniti.
- **Kedudukan:** leaderboard penuh menggunakan data live.
- **Aktiviti:** penghantaran sebenar, receipt, sejarah sendiri, pautan bukti dan pembatalan PENDING.
- **Peserta:** direktori aktif mengikut rumah sukan, nama A–Z dan bilangan peserta.

### Peraturan dashboard

Action `dashboard_summary` menggunakan peserta aktif dan hanya aktiviti **`STATUS = SAH`**. `PENDING` dan `BATAL` tidak menyumbang kepada jumlah aktiviti, total KM, hari aktif, leaderboard, Top 3, aktiviti terkini, jumlah Rumah Sukan atau kemajuan komuniti.

Tarikh user-facing dipaparkan sebagai **DD/MM/YYYY**; nilai dalaman/API boleh kekal ISO `YYYY-MM-DD`.

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

## Sejarah dan pembatalan aktiviti peserta

Action `participant_activity_history` memerlukan `kod_peserta` + PIN, mengesahkan peserta wujud, PIN betul dan status `AKTIF`, kemudian hanya mengembalikan rekod milik peserta tersebut.

Sejarah memaparkan **SAH, PENDING dan BATAL**, tarikh, jarak, ID aktiviti dan pautan **LIHAT BUKTI**.

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

`service_worker.js` cache static app-shell sahaja. API POST, PIN, screenshot/base64, sejarah peribadi dan moderation admin tidak dicache.

## Status verifikasi

Telah disahkan:
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
- tekan BATALKAN → confirm → PIN → `PENDING → BATAL`;
- history refresh dan butang BATALKAN hilang;
- rekod BATAL kekal tidak dikira dalam scoreboard.

## Future / TODO

- annual programme/year management;
- archive previous year dan preserve history;
- reset leaderboard tahunan;
- annual target configuration;
- year-based participant/house configuration;
- eksport admin CSV;
- laporan PDF jika diperlukan;
- kemaskan visual butang **BATALKAN** (fungsi sudah ada, presentation desktop masih terlalu lebar).

Integrasi terus dengan Strava API **bukan sebahagian implementasi semasa** dan perlu dinilai berasingan dari sudut teknikal, privasi dan syarat penggunaan.
