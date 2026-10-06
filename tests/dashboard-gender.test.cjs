const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const app = fs.readFileSync('assets/js/app.js', 'utf8');
const backend = fs.readFileSync('backend/dashboard_summary.gs', 'utf8');
const baselineBackend = execFileSync('git', ['show', 'HEAD:backend/dashboard_summary.gs'], { encoding: 'utf8' });
const baselineApp = execFileSync('git', ['show', 'HEAD:assets/js/app.js'], { encoding: 'utf8' });
const plain = value => JSON.parse(JSON.stringify(value));

function aggregate(source, participants, activities) {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return plain(ctx.dashboardSummaryAggregate_(participants, activities));
}
test('backend exposes only canonical gender without changing SAH totals or tie order', () => {
  const participants = ['LELAKI', 'PEREMPUAN', '', 'L', 'WANITA', null].map((gender, i) => ({ KOD_PESERTA: `K${i}`, NAMA: `Nama ${i}`, STATUS: 'AKTIF', RUMAH_SUKAN: 'BIRU', JANTINA: gender }));
  participants.push({ KOD_PESERTA: 'OFF', NAMA: 'Inactive', STATUS: 'TIDAK AKTIF', JANTINA: 'LELAKI' });
  const activities = participants.flatMap((p, i) => ['SAH', 'PENDING', 'BATAL'].map(status => ({ ID_AKTIVITI: `${i}-${status}`, KOD_PESERTA: p.KOD_PESERTA, TARIKH_AKTIVITI: '2026-10-05', TIMESTAMP: '2026-10-05T10:00:00Z', JARAK_KM: status === 'SAH' ? 10 : 999, STATUS: status })));
  const result = aggregate(backend, participants, activities);
  assert.deepEqual(result.leaderboard.map(p => p.jantina), ['LELAKI', 'PEREMPUAN', '', '', '', '']);
  const old = aggregate(baselineBackend, participants, activities);
  result.leaderboard.forEach(p => delete p.jantina);
  assert.deepEqual(result, old);
});
test('handler reads JANTINA from participant master', () => {
  const ctx = vm.createContext({ SHEET_PESERTA: 'PesertaStravaStrike2026', SHEET_AKTIVITI: 'Aktiviti', SpreadsheetApp: { getActiveSpreadsheet: () => ({}) } });
  vm.runInContext(backend, ctx);
  ctx.dashboardSummaryReadRows_ = (_ss, sheet, headers) => sheet === 'PesertaStravaStrike2026' ? [{ KOD_PESERTA: 'K1', NAMA: 'Ali', STATUS: 'AKTIF', RUMAH_SUKAN: 'BIRU', ...(headers.includes('JANTINA') ? { JANTINA: 'LELAKI' } : {}) }] : [];
  assert.equal(ctx.getDashboardSummary_().leaderboard[0].jantina, 'LELAKI');
});
test('backend trims and uppercases gender before accepting only canonical values', () => {
  const values = [' lelaki ', ' perempuan ', 'LeLaKi', 'PeReMpUaN', '', null, undefined, ' L ', ' wanita ', 123];
  const participants = values.map((JANTINA, i) => ({ KOD_PESERTA: `K${i}`, NAMA: `Nama ${String(i).padStart(2, '0')}`, STATUS: 'AKTIF', RUMAH_SUKAN: 'BIRU', JANTINA }));
  const result = aggregate(backend, participants, []);
  assert.deepEqual(result.leaderboard.map(p => p.jantina), ['LELAKI', 'PEREMPUAN', 'LELAKI', 'PEREMPUAN', '', '', '', '', '', '']);
});

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.listeners = {}; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(name, value) { this[name] = value; }
  cloneNode() { return this; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
function render(rows, source = app, fail = false) {
  const elements = {};
  const ctx = vm.createContext({ document: { createElement: tag => new Element(tag) }, el: id => { if (fail && id === 'category-men') throw Error('Gender ranking DOM unavailable'); return elements[id] ??= new Element(); }, Intl, dashboardSummary: { participant_count: rows.length, activity_count: rows.length, total_km: 100, active_days: 1, leaderboard: rows, latest_activities: [], house_totals: [{ rumah_sukan: 'BIRU', total_km: 100, participant_count: rows.length }] } });
  vm.runInContext(source.slice(source.indexOf('function node('), source.indexOf('async function loadDashboardSummary')), ctx);
  vm.runInContext('renderDashboard()', ctx);
  return elements;
}
const rows = Array.from({ length: 14 }, (_, i) => ({ rank: i + 1, nama: `Peserta ${i}`, kod_peserta: `K${i}`, rumah_sukan: 'BIRU', total_km: 20 - i, activity_count: 1, jantina: i % 2 ? 'PEREMPUAN' : 'LELAKI' }));
test('gender groups split canonical genders, retain official order and cap at five', () => {
  const before = plain(rows);
  const elements = render(rows);
  for (const [id, names] of [['category-men', ['Peserta 0', 'Peserta 2', 'Peserta 4', 'Peserta 6', 'Peserta 8']], ['category-women', ['Peserta 1', 'Peserta 3', 'Peserta 5', 'Peserta 7', 'Peserta 9']]]) {
    assert.deepEqual(elements[id].children.map(row => row.children[1].textContent), names);
    assert.deepEqual(elements[id].children.map(row => row.children[0].textContent), ['#1', '#2', '#3', '#4', '#5']);
  }
  assert.deepEqual(rows, before);
});
test('unknown gender is excluded and empty gender groups still render', () => {
  const elements = render([{ ...rows[0], jantina: '' }, { ...rows[1], jantina: 'WANITA' }, { ...rows[2], jantina: 'LELAKI' }]);
  assert.equal(elements['category-men'].children.length, 1);
  assert.equal(elements['category-men'].children[0].children[1].textContent, 'Peserta 2');
  assert.equal(elements['category-women'].children[0].textContent, 'Belum ada kedudukan untuk kumpulan ini.');
  const legacy = render(rows.map(({ jantina, ...p }) => p));
  assert.equal(legacy['category-men'].children[0].textContent, 'Belum ada kedudukan untuk kumpulan ini.');
});
test('overall leaderboard and podium remain identical; gender ranking failure leaves house ranking usable', () => {
  const current = render(rows);
  const old = render(rows, baselineApp);
  for (const id of ['leaderboard-body', 'dashboard-leaderboard-body', 'podium']) assert.deepEqual(plain(current[id]), plain(old[id]));
  const failed = render(rows, app, true);
  assert.deepEqual(plain(failed['house-ranking']), plain(current['house-ranking']));
});
test('gender ranking house logo keeps accessible fallback when image fails', () => {
  const emblem = render(rows)['category-men'].children[0].children[2];
  assert.equal(emblem['aria-label'], 'Rumah Sukan: BIRU');
  const image = emblem.children[1];
  image.listeners.load();
  assert.equal(emblem.children[0].hidden, true);
  image.listeners.error();
  assert.equal(image.hidden, true);
  assert.equal(emblem.children[0].hidden, false);
});
