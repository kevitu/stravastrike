# STRAVA STRIKE KEVITU 2026 — Project Status

Last updated: **30 September 2026** (Malaysia)

**Current phase:** MVP implemented dan real end-to-end verified; bersedia untuk review release frontend dan ujian PWA pada telefon. Backend Apps Script deployed: **Version 6**, termasuk `participant_activity_history`.

Pengesahan ujian sebenar di bawah dibekalkan oleh pemilik projek. Kemas kini ini ialah dokumentasi sahaja; tiada ujian live, perubahan sumber aplikasi atau deployment baharu dilakukan dalam tugas ini.

## Completed MVP

### Registration dan participant master

- [x] Pendaftaran Google Form, tab response `DaftarStravaStrike2026` dan trigger `onPendaftaranSubmit`.
- [x] Nama duplicate dikawal; nama berdaftar dikeluarkan daripada pilihan Form.
- [x] Master `PesertaStravaStrike2026`, kod unik format `KEV001` dan PIN 4 digit.
- [x] Peserta baharu diwujudkan selepas registration; kod/PIN lama dikekalkan semasa sync.
- [x] Status aktif/tidak aktif dan rumah sukan MERAH, BIRU, HIJAU, KUNING.

### Participant frontend

- [x] Login dropdown nama + PIN; pengesahan backend dan sesi idle 12 jam.
- [x] Dashboard, Kedudukan, Aktiviti dan Peserta menggunakan navigasi single-page.
- [x] Sesi ringan dipulihkan daripada `localStorage`; PIN tidak dipersistkan.
- [x] Peserta dikelompokkan mengikut rumah, nama A–Z dan counts; rumah tiada → BELUM DITETAPKAN.
- [x] Login hero menggunakan logo KEVITU diluluskan; sidebar navy dan active navigation magenta.
- [x] Error states, retry, loading mengikut konteks, keyboard focus dan responsive layout.

### Live dashboard

- [x] `dashboard_summary`: active participant count dan agregat SAH sahaja.
- [x] Jumlah Aktiviti, Jumlah KM dan unique activity-date Hari Aktif.
- [x] Leaderboard mengikut total KM menurun, seri nama A–Z; preview top 5 dan paparan penuh.
- [x] Top 3 peserta beraktiviti, latest SAH activities dan house totals/participant counts.
- [x] Sasaran komuniti semasa 2,000 KM; progress live dengan visual clamp 100%.
- [x] Refresh selepas login/restore, navigasi berkaitan dan successful submission; tiada continuous polling.
- [x] Tiada data demo/fake. PENDING/BATAL tidak dikira dalam keputusan.

### Penghantaran dan sejarah peribadi

- [x] Date, decimal KM > 0, screenshot mandatory dan fresh confirmation PIN.
- [x] Tiada business-rule maksimum jarak.
- [x] Screenshot client-side resize/compression tanpa crop dan upload ke Google Drive.
- [x] Aktiviti baharu direkodkan sebagai PENDING dalam `AktivitiStravaStrike2026`.
- [x] Frontend menghalang duplicate/concurrent submission; loading kekal pada butang submit.
- [x] Success receipt dengan ID, jarak, tarikh dan LIHAT DASHBOARD; PIN/preview dibersihkan.
- [x] `participant_activity_history` mengesahkan kod + PIN + AKTIF server-side dan hanya memulangkan rekod peserta itu.
- [x] SAH/PENDING/BATAL dipaparkan; ringkasan Aktiviti SAH, Jumlah KM SAH dan Menunggu Semakan.
- [x] Sejarah dimuat semula selepas submission; bukti dibuka atas tindakan peserta.
- [x] PIN sejarah hanya dalam memori halaman; prompt semula selepas refresh/restore.

### Admin / urus setia

- [x] `admin.html` berasingan, Admin ID + PIN dan 2-hour idle timeout.
- [x] Actions `admin_login`, `admin_pending`, `admin_update_status`.
- [x] Senarai PENDING dan screenshot atas tindakan admin.
- [x] Confirmation SAHKAN/BATALKAN dan lock terhadap tindakan serentak.
- [x] Kad diproses dibuang segera, pending count dikemas kini tanpa reload.
- [x] Tarikh paparan Malaysia, termasuk penukaran timestamp UTC kepada tarikh tempatan.
- [x] Credentials sebenar dalam Apps Script Script Properties; PIN admin hanya dalam memori frontend.
- [x] Reload memerlukan admin login semula; logout/expiry membersihkan credentials.

### PWA structure dan launch UX

- [x] `manifest.webmanifest`: nama event, approved icons, standalone, scope/start URL relatif.
- [x] `service_worker.js`: versioned network-first static app-shell cache sahaja.
- [x] Favicon, apple-touch-icon dan mobile app metadata menggunakan ikon sedia ada.
- [x] Native splash support melalui manifest; branded in-app splash minimum sekitar 1.2 saat.
- [x] Context loading, reduced-motion support dan perlindungan visual flicker.
- [x] Launch → splash/loading → login atau restore → Aktiviti.
- [x] Submission → receipt → LIHAT DASHBOARD, tanpa menyorok receipt serta-merta.

API POST results, PIN, screenshot uploads/base64, personal history dan admin moderation data **tidak dicache**. Cache shell bukan sokongan offline untuk transaksi atau live data. Pemasangan/native splash pada peranti masih perlu verifikasi HTTPS.

## Real end-to-end verification — passed

Berdasarkan pengesahan pemilik projek pada 30 September 2026:

| Ujian sebenar | Keputusan |
| --- | --- |
| Participant login dan participant directory | Lulus |
| Penghantaran aktiviti dan screenshot upload ke Drive | Lulus |
| Rekod baharu berstatus PENDING | Lulus |
| Admin login dan moderation PENDING → SAH | Lulus |
| Refresh dashboard live selepas semakan | Lulus |
| Personal activity history | Lulus |
| Logout dan session behaviour | Lulus |

Snapshot verifikasi: **20 peserta aktif, 2 aktiviti SAH, 6.81 KM**. Angka berubah mengikut data sebenar dan bukan configured defaults. `ACT000002` dengan 0.53 KM telah disahkan melalui aliran PENDING → SAH.

Semakan pembangunan sebelumnya juga meliputi mocked API success/error states, PIN handling, compression, concurrent-request protection, session expiry, Malaysia date formatting dan tiada horizontal overflow pada 390, 414, 768, 820, 1024, 1440px. Semakan ini berasingan daripada ujian telefon/PWA production.

## Release checks yang masih perlu dibuat

- [ ] Review documentation/source diff dan pastikan tiada secrets.
- [ ] Jalankan git release flow satu command pada satu masa: status → review diff → add → commit → push, selepas arahan/approval pemilik.
- [ ] Sahkan konfigurasi/deployment frontend GitHub Pages melalui HTTPS.
- [ ] Ujian telefon sebenar: Add to Home Screen, approved icon, standalone dan native/in-app splash.
- [ ] Sahkan PWA release behaviour, static cache update, live API dan launch/login/restore pada peranti.

Tiada commit, push atau deployment frontend dibuat sebagai sebahagian daripada tugas dokumentasi ini.

## Future / TODO — belum dilaksanakan

### Pengurusan programme tahunan

- [ ] Annual programme/year management dan create/select active year.
- [ ] Archive previous year dan reset leaderboard tahunan.
- [ ] Preserve historical results.
- [ ] Konfigurasi annual KM target.
- [ ] Year-based participant dan house configuration.

### Admin reporting

- [ ] Leaderboard CSV.
- [ ] Aktiviti SAH CSV.
- [ ] Ranking Rumah Sukan CSV.
- [ ] Kemungkinan PDF reports pada fasa seterusnya.

Eksport ialah fungsi admin masa hadapan, bukan menu participant. Screenshot ZIP/download tidak dirancang. Perlindungan duplicate submission semasa ialah frontend lock sahaja; deduplikasi backend belum didakwa tersedia.

## Technical references dan maintenance

- [README](../README.md): architecture, aliran pengguna, API dan polisi penyimpanan data.
- [Apps Script Web App API](https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec)
- [Google Drive evidence folder](https://drive.google.com/drive/folders/1m4X_X2y-GaaETUbXb1-4P7EwK_fLW18_)
- [GitHub repository](https://github.com/kevitu/stravastrike)
- [GitHub Pages target](https://kevitu.github.io/stravastrike/)

Kekalkan lightweight HTML/CSS/Vanilla JavaScript, mobile-first, live data sahaja dan screenshot atas tindakan pengguna. Jangan dokumentasikan nilai participant PIN/admin credentials. Bezakan implemented features, real verification, device release QA dan future work apabila mengemas kini status.
