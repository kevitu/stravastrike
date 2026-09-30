# STRAVA STRIKE KEVITU 2026

STRAVA STRIKE KEVITU 2026 ialah dashboard dan Progressive Web App (PWA) ringan untuk pendaftaran peserta, penghantaran aktiviti larian, dan paparan keputusan semasa. Peserta memasukkan sendiri jumlah jarak larian dan wajib menyertakan screenshot peta larian sebagai bukti. Keputusan dipaparkan melalui leaderboard individu dan rumah sukan.

Frontend sengaja dibina **lightweight** dan **mobile-first**, dengan aliran penghantaran yang ringkas tanpa konsep user account yang kompleks.

## Architecture

```text
REGISTRATION
      +
ACTIVITY SUBMISSION
      +
MANDATORY RUN MAP SCREENSHOT
      ↓
ACTIVITY RECORDS
      ↓
LEADERBOARD
```

### Architecture teknikal

```text
Google Form
     ↓
Google Sheet
     ↓
Google Apps Script
     ↓
Google Drive Screenshot Storage
     ↓
GitHub Pages PWA
```

### Technologies

- Google Forms
- Google Sheets
- Google Apps Script
- Google Drive
- GitHub
- GitHub Pages
- Progressive Web App
- HTML
- CSS
- Vanilla JavaScript

## Participant identification

Peserta dikenal pasti menggunakan **KOD_PESERTA + PIN** sahaja. Contoh kod peserta ialah `KEV019`, dipadankan dengan PIN 4 digit. PIN sebenar peserta tidak didokumentasikan.

## Registration

```text
Google Form
     ↓
DaftarStravaStrike2026
     ↓
PesertaStravaStrike2026
```

### Struktur DaftarStravaStrike2026

```text
Timestamp
NAMA
RUMAH SUKAN ANDA
```

### Struktur PesertaStravaStrike2026

```text
KOD_PESERTA
NAMA
PIN
STATUS
RUMAH_SUKAN
```

- Kod peserta menggunakan format `KEV001`, `KEV002`, dan seterusnya.
- PIN 4 digit dijana secara automatik.
- Peserta baharu diberikan `STATUS = AKTIF`.
- KOD dan PIN peserta lama mesti kekal apabila sync dijalankan semula.
- Duplicate registration berdasarkan nama akan dikawal.
- Nama peserta yang sudah mendaftar akan dikeluarkan daripada pilihan Google Form.

## Activity submission

```text
Peserta buka PWA
     ↓
Masukkan KOD_PESERTA + PIN
     ↓
Masukkan TARIKH_AKTIVITI
     ↓
Masukkan JARAK_KM
     ↓
Upload SCREENSHOT PETA LARIAN
     ↓
Submit
```

**Screenshot peta larian adalah WAJIB** bagi setiap penghantaran aktiviti. Peserta key-in jumlah jarak sendiri dalam unit kilometer.

### Struktur AktivitiStravaStrike2026

```text
ID_AKTIVITI
TIMESTAMP
KOD_PESERTA
NAMA
TARIKH_AKTIVITI
JARAK_KM
SCREENSHOT_URL
STATUS
```

Status aktiviti ialah `SAH` atau `BATAL`. **Hanya aktiviti berstatus SAH dikira dalam leaderboard.** Leaderboard utama berdasarkan **TOTAL JARAK KM**.

## Planned dashboard sections

- Jumlah peserta
- Jumlah aktiviti
- Jumlah KM
- Hari aktif
- Kedudukan individu
- Top 3 keseluruhan
- Ranking rumah sukan
- Aktiviti terkini
- Sasaran komuniti
- Bukti screenshot aktiviti

Screenshot tidak perlu dimuatkan bersama leaderboard semasa page load. Bukti hanya dimuatkan apabila pengguna memilih **Lihat Bukti**, supaya dashboard kekal ringan.

## PWA dan hosting

| Perkara | Nilai |
| --- | --- |
| PWA name | Strava Strike KEVITU |
| Short name | Strava Strike |
| GitHub Pages target | https://kevitu.github.io/stravastrike/ |
| GitHub repository | https://github.com/kevitu/stravastrike |

Frontend dan fail PWA masih dalam perancangan; URL GitHub Pages di atas ialah sasaran deployment.

## Design direction

- KEVITU branding
- White + navy base
- Pink / blue / orange accents
- Running silhouettes
- Sporty live scoreboard
- Responsive
- Lightweight
- Mobile-first

## Project status

Rujuk [Project Status](docs/PROJECT_STATUS.md) untuk status backend, senarai kerja pending, milestone seterusnya, dan peraturan perubahan projek.
