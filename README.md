# STRAVA STRIKE KEVITU 2026

Dashboard sukan dan PWA ringan untuk pendaftaran peserta, penghantaran aktiviti dengan screenshot peta larian, semakan urusetia dan keputusan individu/rumah sukan. Frontend menggunakan HTML, CSS dan Vanilla JavaScript tanpa framework berat.

**Status MVP:** ujian sebenar end-to-end telah lulus, berdasarkan pengesahan pemilik projek pada 30 September 2026. Backend Apps Script yang deployed ialah **Version 6**, termasuk sejarah aktiviti peribadi. Semakan release frontend dan pemasangan PWA pada telefon masih perlu diselesaikan.

## Sistem dan fail utama

```text
Google Form → DaftarStravaStrike2026 → PesertaStravaStrike2026
Participant PWA → Apps Script API → AktivitiStravaStrike2026 + bukti Google Drive
Urusetia → semakan PENDING → SAH / BATAL → keputusan live
```

| Komponen | Fail / lokasi |
| --- | --- |
| Participant frontend | `index.html`, `assets/css/app.css`, `assets/js/app.js` |
| Admin berasingan | `admin.html`, `assets/css/admin.css`, `assets/js/admin.js` |
| PWA | `manifest.webmanifest`, `service_worker.js` |
| Ikon diluluskan | `assets/icon_192.png`, `assets/icon_512.png` |
| Logo KEVITU pada login | `assets/img/kevitu-logo.png` |
| Patch Apps Script tempatan | `backend/dashboard_summary.gs`, `backend/participant_activity_history.gs` dan router patches masing-masing |

Patch tempatan ialah bahan integrasi; sumber penuh dan deployment Apps Script diurus berasingan daripada repository ini.

- [GitHub repository](https://github.com/kevitu/stravastrike)
- [Sasaran GitHub Pages](https://kevitu.github.io/stravastrike/)
- [Apps Script Web App API](https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec)

## Pendaftaran dan akses peserta

Pendaftaran melalui Google Form diselaraskan ke master `PesertaStravaStrike2026`. Setiap peserta mempunyai kod unik seperti `KEV019`, PIN 4 digit, status aktif/tidak aktif dan rumah sukan: **MERAH, BIRU, HIJAU, KUNING**. Kod dan PIN peserta lama dikekalkan semasa sync; peserta baharu diberi status `AKTIF`.

Login menggunakan **dropdown nama + PIN 4 digit**. Nama tidak ditaip secara manual; pilihan nama dipadankan dengan `KOD_PESERTA`. Backend mengesahkan identiti dan status peserta.

Sesi peserta tamat selepas **12 jam tanpa aktiviti**. `localStorage` menyimpan hanya `kod_peserta`, `nama`, `rumah_sukan` dan `last_active`. PIN tidak disimpan dalam `localStorage` atau `sessionStorage`; PIN untuk sejarah boleh berada dalam memori halaman dan perlu dimasukkan semula selepas refresh/session restore. Logout membersihkan sesi dan PIN dalam memori.

## Paparan participant yang telah dilaksanakan

- **Dashboard:** KPI live, lima kedudukan teratas, podium Top 3, lima aktiviti terkini, ranking rumah sukan dan kemajuan sasaran komuniti.
- **Kedudukan:** leaderboard penuh menggunakan data live.
- **Aktiviti:** penghantaran sebenar, receipt dan sejarah aktiviti peserta sendiri.
- **Peserta:** direktori aktif mengikut rumah sukan, nama A–Z dan bilangan peserta. Rumah yang tiada diletakkan dalam `BELUM DITETAPKAN`.

Navigasi menukar paparan tanpa page reload. Reka bentuk mobile-first menggunakan navy, magenta, biru, oren dan asas putih; tiada data demo atau rekod palsu pada dashboard.

### Peraturan dashboard

Action `dashboard_summary` menggunakan peserta aktif dan hanya aktiviti **`STATUS = SAH`**. `PENDING` dan `BATAL` tidak menyumbang kepada jumlah aktiviti, total KM, hari aktif, leaderboard, Top 3, aktiviti terkini, jumlah rumah sukan atau kemajuan komuniti.

- Jumlah Peserta: bilangan peserta aktif.
- Jumlah Aktiviti / Jumlah KM: bilangan dan jumlah jarak aktiviti SAH peserta aktif.
- Hari Aktif: bilangan tarikh aktiviti unik dalam rekod SAH.
- Ranking: jumlah KM menurun; seri dipecahkan melalui nama A–Z. Peserta 0 KM boleh disenaraikan selepas peserta yang mempunyai KM; podium hanya menunjukkan peserta dengan aktiviti yang disahkan.
- Sasaran komuniti semasa: **2,000 KM**. Bar kemajuan visual dihadkan kepada 100%.

Data dimuat semula selepas login/restore, apabila membuka Dashboard/Kedudukan dan selepas penghantaran berjaya, dengan penggabungan permintaan navigasi pantas. Ralat API dipaparkan secara inline tanpa fallback kepada data palsu.

## Penghantaran dan sejarah aktiviti

Peserta memberikan **tarikh aktiviti, jarak KM, screenshot wajib dan PIN pengesahan baharu**. Identiti datang daripada sesi. Jarak mesti nombor sah **lebih daripada 0**; perpuluhan dibenarkan dan **tiada maksimum jarak berdasarkan peraturan perniagaan**.

Screenshot JPEG/PNG/WebP dikecilkan tanpa crop kepada sisi terpanjang maksimum 1280px dan dimampatkan sebagai JPEG sebelum base64 dihantar. Had imej frontend ialah 15 MB untuk sumber dan 500 KB selepas pemampatan. Backend memuat naik bukti ke Google Drive dan merekodkan aktiviti sebagai **PENDING**. Perlindungan frontend menghalang penghantaran serentak/double click; ini bukan jaminan deduplikasi backend.

Receipt memaparkan ID aktiviti, jarak, tarikh dan mesej menunggu semakan, diikuti tindakan **LIHAT DASHBOARD**. PIN, screenshot dan base64 tidak dipersistkan dalam browser storage; screenshot/PIN penghantaran dibersihkan selepas kejayaan.

Action `participant_activity_history` memerlukan `kod_peserta` + PIN dan mengesahkan peserta wujud, PIN betul serta status `AKTIF` sebelum mengembalikan rekod peserta itu sahaja. Peserta tidak boleh mengambil rekod orang lain melalui endpoint ini.

Sejarah memaparkan **SAH, PENDING dan BATAL**, tarikh Malaysia, jarak, ID dan pautan **LIHAT BUKTI**. Ringkasan peribadi mengandungi Aktiviti SAH, Jumlah KM SAH dan Menunggu Semakan; BATAL tidak dikira sebagai KM. Sejarah dimuat semula selepas penghantaran dan boleh dimuat semula untuk melihat perubahan status. Bukti dibuka atas tindakan pengguna, bukan dimuat turun automatik.

## Urus setia

Link sekunder **URUS SETIA** pada login membuka `admin.html`. Admin menggunakan Admin ID + PIN, sesi **2 jam tanpa aktiviti**, senarai PENDING, screenshot expandable dan tindakan **SAHKAN / BATALKAN** dengan confirmation.

Selepas kejayaan, kad diproses dibuang serta-merta dan bilangan pending dikemas kini tanpa reload. Tindakan serentak dihalang. Tarikh dipaparkan mengikut Malaysia, contohnya `30/09/2026`.

Credentials admin dikonfigurasi dalam **Apps Script Script Properties**; nilai rahsia tidak didokumentasikan atau di-hardcode dalam frontend. PIN admin berada dalam memori halaman sahaja. Browser hanya menyimpan metadata selamat `admin_id`/`last_active` dalam `sessionStorage`; selepas refresh, admin perlu login semula sebelum tindakan privileged. Backend kekal autoriti bagi setiap tindakan.

## API yang tersedia — Apps Script Version 6

| Action | Kegunaan / akses |
| --- | --- |
| `participant_directory` | Direktori peserta aktif |
| `participant_login` | Pengesahan kod peserta + PIN |
| `submit_activity` | Penghantaran dengan kod peserta + PIN; status baharu PENDING |
| `dashboard_summary` | Ringkasan awam SAH sahaja; tiada PIN/credentials dalam response |
| `participant_activity_history` | Rekod peribadi selepas pengesahan kod peserta + PIN |
| `admin_login` | Pengesahan Admin ID + PIN |
| `admin_pending` | Senarai PENDING dengan credentials admin |
| `admin_update_status` | Tukar kepada SAH/BATAL dengan credentials admin |

## PWA dan pengalaman launch

`manifest.webmanifest` menetapkan nama **STRAVA STRIKE KEVITU 2026**, short name **Strava Strike**, `display: standalone`, `start_url: ./`, `scope: ./`, tema navy dan latar off-white. Ikon tempatan 192×192/512×512 menggunakan `purpose: any`; artwork diluluskan tidak diubah untuk maskable cropping.

```text
PWA/native launch → branded splash → loading → login atau sesi dipulihkan → Aktiviti
Penghantaran berjaya → success receipt → LIHAT DASHBOARD
```

Splash dalam aplikasi dipaparkan sekurang-kurangnya sekitar 1.2 saat, dengan loading mengikut konteks dan sokongan reduced motion. Logo KEVITU turut digunakan pada kawasan hero login.

`service_worker.js` menggunakan cache versi dengan allowlist **static app-shell sahaja**: halaman participant, CSS/JS, ikon dan manifest. Strategi network-first memberikan fallback shell daripada cache; live data masih memerlukan rangkaian. Tidak semua aset visual tambahan dimasukkan dalam cache shell.

Service worker **tidak cache** hasil Apps Script POST API, PIN, screenshot upload/base64, response sejarah atau data moderation admin. Admin pages dan API dinamik bukan offline cached.

Struktur PWA telah disediakan, tetapi pemasangan sebenar/Add to Home Screen, standalone dan native splash pada telefon memerlukan verifikasi akhir melalui **HTTPS seperti GitHub Pages**. `file://` tidak mencukupi; localhost sesuai untuk semakan teknikal awal.

## Verifikasi MVP dan langkah seterusnya

Pemilik projek mengesahkan ujian sebenar lulus untuk login/direktori peserta, penghantaran, screenshot Google Drive, PENDING, login admin, moderation **PENDING → SAH**, refresh dashboard live, sejarah peribadi, logout dan sesi.

**Snapshot semasa verifikasi MVP:** 20 peserta aktif, 2 aktiviti SAH, 6.81 KM. Ini ialah angka keadaan ujian, bukan nilai kekal atau konfigurasi sistem.

Rujuk [Project Status](docs/PROJECT_STATUS.md) untuk checklist release dan kerja masa hadapan. Pengurusan tahun/programme, archiving, konfigurasi sasaran tahunan dan eksport admin CSV/PDF belum dilaksanakan.
