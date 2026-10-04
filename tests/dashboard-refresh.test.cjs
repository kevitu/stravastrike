const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');

function countdown(now, fail = false, progressFail = false) {
  const source = html.match(/<script id="event-countdown-script">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, 'Isolated inline countdown must exist');
  const elements = Object.fromEntries(['event-countdown', 'event-status', 'event-message', 'countdown-units', 'countdown-days', 'countdown-hours', 'countdown-minutes', 'countdown-seconds', 'event-day', 'event-time-progress', 'event-progress'].map(id => [id, { textContent: '', hidden: false, dataset: {}, setAttribute(name, value) { this[name] = value; } }]));
  let tick;
  let cleared = false;
  const context = vm.createContext({
    document: { getElementById(id) { if (fail || (progressFail && id === 'event-time-progress')) throw Error('Widget DOM unavailable'); return elements[id]; } },
    Date: class extends Date { static now() { return now; } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() { cleared = true; },
    window: { addEventListener() {} }
  });
  vm.runInContext(source, context);
  return { elements, context, tick, setNow(value) { now = value; }, isCleared: () => cleared };
}

test('countdown follows Malaysia start/end boundaries', () => {
  const start = Date.parse('2026-10-01T00:00:00+08:00');
  const end = Date.parse('2026-11-01T00:00:00+08:00');
  const before = countdown(start - 1).elements;
  assert.equal(before['event-status'].textContent, 'EVENT BELUM BERMULA');
  assert.equal(before['countdown-units'].hidden, true);
  const beginning = countdown(start).elements;
  assert.equal(beginning['event-status'].textContent, 'SEDANG BERLANGSUNG');
  assert.equal(beginning['countdown-days'].textContent, '31');
  assert.equal(beginning['countdown-hours'].textContent, '00');
  const last = countdown(end - 1000).elements;
  assert.deepEqual(['days', 'hours', 'minutes', 'seconds'].map(unit => last[`countdown-${unit}`].textContent), ['00', '00', '00', '01']);
  const finished = countdown(end).elements;
  assert.equal(finished['event-status'].textContent, 'STRAVA STRIKE KEVITU 2026 TAMAT');
  assert.equal(finished['countdown-units'].hidden, true);
  assert.equal(countdown(end - 1).elements['countdown-seconds'].textContent, '01');
});

test('timer updates remaining seconds and transitions across both boundaries', () => {
  const start = Date.parse('2026-10-01T00:00:00+08:00');
  const end = Date.parse('2026-11-01T00:00:00+08:00');
  const widget = countdown(start - 1000);
  widget.setNow(start);
  widget.tick();
  assert.equal(widget.elements['event-status'].textContent, 'SEDANG BERLANGSUNG');
  widget.setNow(start + 1000);
  widget.tick();
  assert.equal(widget.elements['countdown-seconds'].textContent, '59');
  widget.setNow(end);
  widget.tick();
  assert.equal(widget.elements['event-status'].textContent, 'STRAVA STRIKE KEVITU 2026 TAMAT');
  assert.equal(widget.isCleared(), true);
});

test('countdown isolates initialization and timer failures', () => {
  const initialFailure = countdown(Date.parse('2026-10-04T00:00:00+08:00'), true);
  vm.runInContext('globalThis.submissionAvailable = true', initialFailure.context);
  assert.equal(initialFailure.context.submissionAvailable, true);
  const timerFailure = countdown(Date.parse('2026-10-04T00:00:00+08:00'));
  Object.defineProperty(timerFailure.elements['countdown-seconds'], 'textContent', { set() { throw Error('Render failed'); } });
  assert.doesNotThrow(() => timerFailure.tick());
  assert.equal(timerFailure.isCleared(), true);
  assert.equal(timerFailure.elements['event-progress'].hidden, true);
  vm.runInContext('globalThis.loginAvailable = true', timerFailure.context);
  assert.equal(timerFailure.context.loginAvailable, true);
});

test('countdown has no API dependency or network calls', () => {
  const source = html.match(/<script id="event-countdown-script">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|dashboard_summary|submit_activity|API_URL|request\s*\(/);
});

test('event-day and elapsed-time progress follow the official window, not KM', () => {
  const start = Date.parse('2026-10-01T00:00:00+08:00');
  const end = Date.parse('2026-11-01T00:00:00+08:00');
  for (const [now, day, percent] of [[start - 1, 0, 0], [start, 1, 0], [start + 3.5 * 86400000, 4, 3.5 / 31 * 100], [(start + end) / 2, 16, 50], [end, 31, 100], [end + 86400000, 31, 100]]) {
    const { elements } = countdown(now);
    assert.equal(elements['event-day'].textContent, `HARI ${day} / 31`);
    assert.equal(elements['event-time-progress'].value, percent);
  }
});

test('event-progress failure does not interrupt countdown', () => {
  const start = Date.parse('2026-10-01T00:00:00+08:00');
  const failedLookup = countdown(start, false, true);
  assert.equal(failedLookup.elements['countdown-days'].textContent, '31');
  const widget = countdown(start);
  Object.defineProperty(widget.elements['event-time-progress'], 'value', { set() { throw Error('Progress unavailable'); } });
  widget.setNow(start + 1000);
  assert.doesNotThrow(() => widget.tick());
  assert.equal(widget.elements['countdown-seconds'].textContent, '59');
  assert.equal(widget.isCleared(), false);
  assert.equal(widget.elements['event-progress'].hidden, true);
});

test('existing controls remain present exactly once; no community target card', () => {
  for (const id of ['dashboard-refresh', 'activity-button', 'leaderboard-view-all', 'view-dashboard', 'view-kedudukan', 'view-aktiviti', 'view-peserta']) {
    assert.equal(html.split(`id="${id}"`).length - 1, 1, id);
  }
  assert.doesNotMatch(html, /Sasaran Komuniti|community-progress|community-total/);
});

test('app logic outside dashboard rendering is unchanged', () => {
  const baseline = execFileSync('git', ['show', 'HEAD:assets/js/app.js'], { cwd: root, encoding: 'utf8' });
  const removeRender = source => source.replace(/function renderDashboard\(\) \{[\s\S]*?\nasync function loadDashboardSummary/, 'async function loadDashboardSummary').replace(/\r\n/g, '\n');
  assert.equal(removeRender(app), removeRender(baseline));
});

function housePreview(totals) {
  class Element {
    constructor() { this.children = []; this.style = {}; this.listeners = {}; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    setAttribute(name, value) { this[name] = value; }
    cloneNode() { return this; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const elements = {};
  const source = app.slice(app.indexOf('function node('), app.indexOf('async function loadDashboardSummary'));
  const context = vm.createContext({ document: { createElement: () => new Element() }, el: id => elements[id] ??= new Element(), dashboardSummary: null, Intl });
  vm.runInContext(source, context);
  context.dashboardSummary = { participant_count: 8, activity_count: 4, total_km: 35, active_days: 2, leaderboard: [], latest_activities: [], house_totals: totals.map((total_km, index) => ({ rumah_sukan: ['MERAH', 'BIRU', 'HIJAU', 'KUNING'][index], total_km, participant_count: 2 })) };
  vm.runInContext('renderDashboard()', context);
  return elements['house-ranking'].children;
}

test('house bars use the highest house KM and handle zero totals', () => {
  for (const totals of [[20, 10, 5, 0], [0, 0, 0, 0]]) {
    const bars = housePreview(totals).map(item => item.children.find(child => child.className === 'house-comparison'));
    assert.deepEqual(bars.map(bar => bar.value), totals[0] ? [100, 50, 25, 0] : [0, 0, 0, 0]);
  }
});

test('official house logos fall back without losing name, KM or relative bar', () => {
  const rows = housePreview([20, 10, 5, 0]);
  const expectedSources = ['assets/img/rumah_merah.png', 'assets/img/rumah_biru.jpeg', undefined, undefined];
  rows.forEach((row, index) => {
    const emblem = row.children.find(child => child.className === 'house-emblem');
    assert.ok(emblem);
    const image = emblem.children.find(child => child.className === 'house-logo-image');
    assert.equal(image?.src, expectedSources[index]);
    assert.ok(emblem.children.some(child => child.className === 'house-badge'));
    if (image) {
      assert.doesNotThrow(() => image.listeners.error());
      assert.equal(image.hidden, true);
    }
    assert.equal(row.children.find(child => child.className === 'house-name').textContent, ['MERAH', 'BIRU', 'HIJAU', 'KUNING'][index]);
    assert.equal(row.children.find(child => child.className === 'house-km').textContent, `${[20, 10, 5, 0][index].toFixed(2)} KM`);
    assert.equal(row.children.find(child => child.className === 'house-comparison').value, [100, 50, 25, 0][index]);
  });
});
