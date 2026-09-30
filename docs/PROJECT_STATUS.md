# STRAVA STRIKE KEVITU 2026
## Project Status

Last updated: 30 September 2026

**Current phase:** Backend foundation, registration automation, activity submission backend, and PWA preparation.

Status di bawah merekodkan baseline yang dibekalkan oleh pemilik projek. Ujian penghantaran aktiviti sebenar masih pending.

## COMPLETED

### Registration

- [x] Google Form pendaftaran tersedia
- [x] Google Sheet response tersedia
- [x] Tab `DaftarStravaStrike2026`
- [x] Field `RUMAH SUKAN ANDA`
- [x] Nama peserta duplicate dikawal
- [x] Nama yang sudah register dibuang daripada pilihan Google Form
- [x] Installable trigger `onPendaftaranSubmit`

### Participant Master

- [x] Tab `PesertaStravaStrike2026`
- [x] Auto participant code
- [x] Format `KEV001`
- [x] Auto PIN 4 digit
- [x] `STATUS = AKTIF`
- [x] `RUMAH_SUKAN`
- [x] KOD dan PIN peserta lama dikekalkan semasa sync
- [x] Peserta baru auto diwujudkan selepas registration

Live registration test pada **30 September 2026 berjaya**:

| Perkara | Keputusan |
| --- | --- |
| Participant | EN. SHEIKH BUKHORI BIN SHEIKH GHADZI |
| Generated | KEV019 |
| Status | AKTIF |
| Rumah Sukan | MERAH |

PIN sebenar peserta tidak didokumentasikan.

### Activity Records

- [x] Tab `AktivitiStravaStrike2026`
- [x] Schema aktiviti siap
- [x] `ID_AKTIVITI`
- [x] Apps Script `doPost`
- [x] Participant code validation
- [x] PIN validation
- [x] Active participant validation
- [x] Mandatory screenshot validation
- [x] Screenshot upload backend
- [x] Google Drive folder untuk bukti aktiviti
- [x] Activity append logic
- [x] `STATUS = SAH`
- [x] Apps Script Web App deployed

Apps Script Web App URL:
[Activity submission API](https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec)

Google Drive screenshot folder:
[Bukti aktiviti](https://drive.google.com/drive/folders/1m4X_X2y-GaaETUbXb1-4P7EwK_fLW18_)

## Current architecture

```text
Google Form
     ↓
DaftarStravaStrike2026
     ↓
Apps Script Registration Automation
     ↓
PesertaStravaStrike2026
     ↓
PWA Activity Submission
     ↓
Apps Script API
     ├── Google Drive Screenshot Storage
     └── AktivitiStravaStrike2026
                 ↓
             Leaderboard
                 ↓
          GitHub Pages PWA
```

Rajah menunjukkan aliran keseluruhan projek; komponen PWA dan leaderboard masih pending seperti disenaraikan di bawah.

## PENDING

### Backend

- [ ] Real activity submission test
- [ ] Verify screenshot upload using real participant
- [ ] Verify row inserted into `AktivitiStravaStrike2026`
- [ ] Duplicate activity protection
- [ ] Public dashboard data endpoint
- [ ] Leaderboard aggregation
- [ ] House leaderboard aggregation
- [ ] Latest activities API

### Frontend

- [ ] Dashboard UI
- [ ] Activity submission UI
- [ ] Participant KOD + PIN screen
- [ ] Screenshot compression before upload
- [ ] Individual leaderboard
- [ ] House leaderboard
- [ ] Top 3 podium
- [ ] Activity evidence modal
- [ ] Error/loading states

### PWA

- [ ] `manifest.json`
- [ ] `service_worker.js`
- [ ] PWA icons
- [ ] Favicon
- [ ] Install prompt
- [ ] Offline app shell

### Deployment

- [ ] Frontend implementation in repo
- [ ] GitHub Pages configuration
- [ ] Production QA
- [ ] Mobile QA
- [ ] PWA install QA

## IMPORTANT DESIGN RULES

Projek mesti kekal:

- **LIGHTWEIGHT**
- **MOBILE FIRST**
- **NO COMPLEX LOGIN**
- **FAST SUBMISSION**
- **LIVE RESULT**

Avoid:

- User account registration
- Email verification
- Password reset
- Heavy JS frameworks
- Loading all screenshots on page load

Participant authentication hanya **KOD_PESERTA + PIN**. Bukti screenshot hanya dimuatkan apabila pengguna memilih **Lihat Bukti**.

## NEXT MILESTONE

**REAL ACTIVITY SUBMISSION TEST**

## SAFETY / CHANGE CONTROL

Task baseline ini **documentation only**, terhad kepada `README.md` dan `docs/PROJECT_STATUS.md`.

Jangan:

- Ubah Apps Script
- Ubah HTML/CSS/JS
- Create frontend files atau fail PWA
- Delete files
- Rename existing source files
- Commit
- Push
- Deploy

Selepas dokumentasi disediakan, semak status Git dan diff penuh, kemudian berhenti dan tunggu approval. Commit atau push hanya boleh dilakukan selepas approval pemilik projek.
