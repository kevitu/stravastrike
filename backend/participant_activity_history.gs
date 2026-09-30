// Standalone patch: paste into the existing Apps Script project; do not deploy yet.
// Uses only SpreadsheetApp.getActiveSpreadsheet(), SHEET_PESERTA, SHEET_AKTIVITI,
// and the private helpers defined in this file. Existing API contracts are unchanged.
function getParticipantActivityHistory_(payload) {
  const code = String(payload.kod_peserta || '').trim().toUpperCase();
  const pin = typeof payload.pin === 'string'
  ? payload.pin.trim()
  : '';
  if (!code || !/^\d{4}$/.test(pin)) throw new Error('Kod peserta atau PIN tidak sah.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet tidak tersedia.');
  const people = participantHistoryRows_(ss, SHEET_PESERTA, ['KOD_PESERTA', 'PIN', 'STATUS']);
  const matches = people.filter(function (person) { return String(person.KOD_PESERTA || '').trim().toUpperCase() === code; });
  if (matches.length !== 1) throw new Error('Kod peserta atau PIN tidak sah.');
  const person = matches[0];
  // Sheets may represent a four-digit PIN as a number with leading zeroes omitted.
  const storedPin = String(person.PIN ?? '').trim();
  const normalizedPin = /^\d{1,4}$/.test(storedPin) ? storedPin.padStart(4, '0') : storedPin;
  if (normalizedPin !== pin) throw new Error('Kod peserta atau PIN tidak sah.');
  if (String(person.STATUS || '').trim().toUpperCase() !== 'AKTIF') throw new Error('Peserta tidak aktif.');
  const rows = participantHistoryRows_(ss, SHEET_AKTIVITI, ['ID_AKTIVITI', 'TIMESTAMP', 'KOD_PESERTA', 'TARIKH_AKTIVITI', 'JARAK_KM', 'STATUS', 'SCREENSHOT_URL']);
  const activities = [];
  let approvedCount = 0;
  let approvedKm = 0;
  let pendingCount = 0;
  rows.forEach(function (row) {
    if (String(row.KOD_PESERTA || '').trim().toUpperCase() !== code) return;
    const status = String(row.STATUS || '').trim().toUpperCase();
    if (['SAH', 'PENDING', 'BATAL'].indexOf(status) < 0) return;
    const km = Number(row.JARAK_KM);
    if (!isFinite(km) || km <= 0) throw new Error('Jarak rekod aktiviti tidak sah.');
    const date = participantHistoryDate_(row.TARIKH_AKTIVITI);
    const timestamp = row.TIMESTAMP instanceof Date ? row.TIMESTAMP.getTime() : new Date(row.TIMESTAMP).getTime();
    activities.push({ id_aktiviti: String(row.ID_AKTIVITI || '').trim(), tarikh_aktiviti: date, jarak_km: km, status: status, screenshot_url: String(row.SCREENSHOT_URL || '').trim(), timestamp: isFinite(timestamp) ? timestamp : 0 });
    if (status === 'SAH') { approvedCount++; approvedKm += km; }
    if (status === 'PENDING') pendingCount++;
  });
  activities.sort(function (a, b) { return b.tarikh_aktiviti.localeCompare(a.tarikh_aktiviti) || b.timestamp - a.timestamp || b.id_aktiviti.localeCompare(a.id_aktiviti); });
  return {
    summary: { approved_count: approvedCount, approved_km: Number(approvedKm.toPrecision(15)), pending_count: pendingCount },
    activities: activities.map(function (activity) { return { id_aktiviti: activity.id_aktiviti, tarikh_aktiviti: activity.tarikh_aktiviti, jarak_km: activity.jarak_km, status: activity.status, screenshot_url: activity.screenshot_url }; })
  };
}

function participantHistoryRows_(ss, sheetName, fields) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 1) throw new Error('Sheet atau header tidak tersedia: ' + sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (value) { return String(value).trim().toUpperCase(); });
  const count = sheet.getLastRow() - 1;
  const result = Array.from({ length: Math.max(0, count) }, function () { return {}; });
  fields.forEach(function (field) {
    const index = headers.indexOf(field);
    if (index < 0 || headers.lastIndexOf(field) !== index) throw new Error('Header tidak sah: ' + field);
    if (count > 0) sheet.getRange(2, index + 1, count, 1).getValues().forEach(function (value, row) { result[row][field] = value[0]; });
  });
  return result;
}

function participantHistoryDate_(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const text = value.trim();
    const date = new Date(text + 'T00:00:00Z');
    if (!isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text) return text;
  } else {
    const date = value instanceof Date ? value : new Date(value);
    if (value && !isNaN(date.getTime())) return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  }
  throw new Error('Tarikh rekod aktiviti tidak sah.');
}
