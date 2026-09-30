// Paste this handler into the existing Apps Script project. No deployment is performed.
// Add exactly this case to the existing doPost(e) switch:
// case 'dashboard_summary':
//   result = getDashboardSummary_();
//   break;
// The existing router wraps the returned object in { ok: true, data: result }.

function getDashboardSummary_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak tersedia.');
  const participants = dashboardSummaryReadRows_(ss, SHEET_PESERTA, ['KOD_PESERTA', 'NAMA', 'STATUS', 'RUMAH_SUKAN']);
  const activities = dashboardSummaryReadRows_(ss, SHEET_AKTIVITI, ['ID_AKTIVITI', 'TIMESTAMP', 'KOD_PESERTA', 'TARIKH_AKTIVITI', 'JARAK_KM', 'STATUS']);
  return dashboardSummaryAggregate_(participants, activities);
}

// Only explicitly listed public fields are read into row objects. PINs, credentials,
// and screenshot URLs are never returned by this public action.
function dashboardSummaryReadRows_(ss, sheetName, requiredHeaders) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet tidak tersedia: ' + sheetName);
  if (sheet.getLastRow() < 1) throw new Error('Header sheet tidak tersedia: ' + sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (value) { return String(value).trim().toUpperCase(); });
  const columns = requiredHeaders.map(function (header) {
    const index = headers.indexOf(header);
    if (index < 0) throw new Error('Header tidak tersedia: ' + sheetName + ' / ' + header);
    if (headers.lastIndexOf(header) !== index) throw new Error('Header berulang: ' + header);
    return { name: header, column: index + 1 };
  });
  const count = sheet.getLastRow() - 1;
  if (count <= 0) return [];
  const rows = Array.from({ length: count }, function () { return {}; });
  columns.forEach(function (field) {
    sheet.getRange(2, field.column, count, 1).getValues().forEach(function (value, index) { rows[index][field.name] = value[0]; });
  });
  return rows;
}

function dashboardSummaryDate_(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const text = value.trim();
    const date = new Date(text + 'T00:00:00Z');
    if (!isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text) return text;
  } else {
    const date = value instanceof Date ? value : new Date(value);
    if (value && !isNaN(date.getTime())) return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  }
  throw new Error('Tarikh aktiviti SAH tidak sah.');
}

function dashboardSummaryAggregate_(participantRows, activityRows) {
  const participants = new Map();
  participantRows.forEach(function (row) {
    if (String(row.STATUS).trim().toUpperCase() !== 'AKTIF') return;
    const code = String(row.KOD_PESERTA || '')
  .trim()
  .toUpperCase();
    const name = String(row.NAMA || '').trim();
    if (!code || !name) throw new Error('Maklumat peserta aktif tidak lengkap.');
    if (participants.has(code)) throw new Error('Kod peserta aktif berulang.');
    participants.set(code, { kod_peserta: code, nama: name, rumah_sukan: String(row.RUMAH_SUKAN || '').trim().toUpperCase(), total_km: 0, activity_count: 0 });
  });
  const houses = ['MERAH', 'BIRU', 'HIJAU', 'KUNING'].map(function (house) { return { rumah_sukan: house, total_km: 0, participant_count: 0 }; });
  participants.forEach(function (person) { const house = houses.find(function (item) { return item.rumah_sukan === person.rumah_sukan; }); if (house) house.participant_count++; });
  const approved = [];
  const days = new Set();
  let totalKm = 0;
  activityRows.forEach(function (row) {
    if (String(row.STATUS || '').trim().toUpperCase() !== 'SAH') return;
    const person = participants.get(
  String(row.KOD_PESERTA || '')
    .trim()
    .toUpperCase()
);
    if (!person) return; // Inactive or unknown participants do not enter any public ranking.
    const km = Number(row.JARAK_KM);
    if (!isFinite(km) || km <= 0) throw new Error('Jarak aktiviti SAH tidak sah.');
    const date = dashboardSummaryDate_(row.TARIKH_AKTIVITI);
    const timestamp = row.TIMESTAMP instanceof Date ? row.TIMESTAMP.getTime() : new Date(row.TIMESTAMP).getTime();
    person.total_km += km;
    person.activity_count++;
    totalKm += km;
    days.add(date);
    const house = houses.find(function (item) { return item.rumah_sukan === person.rumah_sukan; });
    if (house) house.total_km += km;
    approved.push({ id_aktiviti: String(row.ID_AKTIVITI || '').trim(), kod_peserta: person.kod_peserta, nama: person.nama, rumah_sukan: person.rumah_sukan, tarikh_aktiviti: date, jarak_km: km, timestamp: isFinite(timestamp) ? timestamp : 0 });
  });
  const round = function (value) { return Number(value.toPrecision(15)); };
  const leaderboard = Array.from(participants.values()).sort(function (a, b) { return round(b.total_km) - round(a.total_km) || a.nama.localeCompare(b.nama, 'ms', { sensitivity: 'base' }) || a.kod_peserta.localeCompare(b.kod_peserta); }).map(function (person, index) { return { rank: index + 1, kod_peserta: person.kod_peserta, nama: person.nama, rumah_sukan: person.rumah_sukan, total_km: round(person.total_km), activity_count: person.activity_count }; });
  approved.sort(function (a, b) { return b.tarikh_aktiviti.localeCompare(a.tarikh_aktiviti) || b.timestamp - a.timestamp || b.id_aktiviti.localeCompare(a.id_aktiviti); });
  const latest = approved.slice(0, 5).map(function (activity) { return { id_aktiviti: activity.id_aktiviti, kod_peserta: activity.kod_peserta, nama: activity.nama, rumah_sukan: activity.rumah_sukan, tarikh_aktiviti: activity.tarikh_aktiviti, jarak_km: activity.jarak_km }; });
  const houseTotals = houses.map(function (house) { return { rumah_sukan: house.rumah_sukan, total_km: round(house.total_km), participant_count: house.participant_count }; }).sort(function (a, b) { return b.total_km - a.total_km || a.rumah_sukan.localeCompare(b.rumah_sukan); });
  return { participant_count: participants.size, activity_count: approved.length, total_km: round(totalKm), active_days: days.size, community_target_km: 2000, leaderboard: leaderboard, latest_activities: latest, house_totals: houseTotals };
}
