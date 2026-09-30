'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec';
const SESSION_KEY = 'strava_strike_participant_v1';
const IDLE_TIMEOUT = 12 * 60 * 60 * 1000;
const el = (id) => document.getElementById(id);
let appBooting = true;
const loadingTasks = new Map();
function syncLoading() {
  const context = Array.from(loadingTasks.values()).at(-1)?.text;
  el('app-loading').hidden = appBooting || !context;
  el('app-shell').inert = appBooting || !!context;
  el('app-shell').setAttribute('aria-busy', String(appBooting || !!context));
  if (context) { el('loading-context').textContent = context; if (appBooting) el('splash-status').textContent = session ? 'Memuatkan akaun...' : context; }
}
function beginLoading(text) {
  const token = Symbol('loading');
  const timer = setTimeout(() => endLoading(token), 32000);
  loadingTasks.set(token, { text, timer });
  syncLoading();
  return token;
}
function endLoading(token) {
  if (loadingTasks.has(token)) clearTimeout(loadingTasks.get(token).timer);
  loadingTasks.delete(token);
  syncLoading();
}
function finishBoot() {
  if (!appBooting) return;
  appBooting = false;
  document.body.classList.remove('app-booting');
  el('app-splash').setAttribute('aria-busy', 'false');
  el('app-splash').classList.add('splash-exit');
  syncLoading();
  setTimeout(() => { el('app-splash').hidden = true; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
}
let session = null;
let expiryTimer;
let directoryReady = false;
let loginPending = false;
let activeView = 'aktiviti';
let participantDirectory = [];
let historyPin = '';
let historyOwnerCode = '';
let historyData = null;
let historyPending = false;
let historyGeneration = 0;
let historyRefreshQueued = false;
let lastHistoryAttempt = 0;
const VIEW_LABELS = {
  dashboard: ['DASHBOARD', 'Paparan keputusan semasa'],
  kedudukan: ['KEDUDUKAN', 'Kedudukan keseluruhan peserta'],
  aktiviti: ['AKTIVITI', 'Hantar aktiviti dan semak rekod anda'],
  peserta: ['PESERTA', 'Senarai peserta aktif']
};

function switchView(view, focus = true) {
  if (!session || !VIEW_LABELS[view]) return;
  if (focus) refreshActivity();
  if (!session) return;
  activeView = view;
  Object.keys(VIEW_LABELS).forEach((key) => { el(`view-${key}`).hidden = key !== view; });
  document.querySelectorAll('.dashboard-nav [data-view]').forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle('nav-active', selected);
    if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  el('dashboard-title').textContent = VIEW_LABELS[view][0];
  el('view-subtitle').textContent = VIEW_LABELS[view][1];
  document.title = `${VIEW_LABELS[view][0]} | STRAVA STRIKE KEVITU 2026`;
  el('dashboard-feedback').hidden = !['dashboard', 'kedudukan'].includes(view);
  if (focus && ['dashboard', 'kedudukan'].includes(view)) loadDashboardSummary();
  if (view === 'aktiviti' && focus) loadActivityHistory();
  el('dashboard-actions').hidden = !['dashboard', 'aktiviti'].includes(view);
  if (view !== 'aktiviti') el('submission-pin').value = '';


  if (focus) el('dashboard-title').focus({ preventScroll: true });
}

function renderParticipants() {
  const houses = ['MERAH', 'BIRU', 'HIJAU', 'KUNING', 'BELUM DITETAPKAN'];
  const groups = new Map(houses.map((house) => [house, []]));
  participantDirectory.forEach((person) => {
    const code = person.kod_peserta ?? person.KOD_PESERTA;
    const value = person.rumah_sukan || person.RUMAH_SUKAN || (session && session.kod_peserta === code ? session.rumah_sukan : '');
    const house = typeof value === 'string' ? value.trim().toUpperCase() : '';
    groups.get(houses.includes(house) ? house : 'BELUM DITETAPKAN').push(person);
  });
  const nameOf = (person) => String(person.nama ?? person.NAMA ?? '');
  groups.forEach((participants) => participants.sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ms', { sensitivity: 'base' })));
  el('participants-summary').replaceChildren(...houses.map((house, index) => {
    const summary = node('div', `house-summary house-group-${index}`);
    summary.append(node('span', '', house), node('strong', '', groups.get(house).length));
    return summary;
  }));
  el('participants-groups').replaceChildren(...houses.map((house, index) => {
    const participants = groups.get(house);
    const section = node('section', `participant-group house-group-${index}`);
    const heading = node('div', 'house-group-heading');
    const title = node('h3', '', house);
    title.id = `participants-house-${index}`;
    section.setAttribute('aria-labelledby', title.id);
    heading.append(title, node('span', 'house-count', `${participants.length} peserta`));
    section.append(heading);
    if (participants.length) {
      const list = node('ul', 'participants-list');
      list.append(...participants.map((person) => {
        const item = node('li', 'participant-item');
        item.append(node('strong', '', nameOf(person)));
        return item;
      }));
      section.append(list);
    } else {
      section.append(node('p', 'section-note', 'Tiada peserta dalam kumpulan ini.'));
    }
    return section;
  }));
}

// Summary values are rendered only from the public SAH-only backend response.
let dashboardSummary = null;
let summaryPending = false;
let summaryGeneration = 0;
let lastSummaryAttempt = 0;
let summaryRefreshQueued = false;

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
function displayDate(value) {
  if (typeof value !== 'string' || !value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
function validateSummary(data) {
  const count = (value) => Number.isInteger(value) && value >= 0;
  const km = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!data || !count(data.participant_count) || !count(data.activity_count) || !km(data.total_km) || !count(data.active_days) || !km(data.community_target_km) || data.community_target_km <= 0 || !Array.isArray(data.leaderboard) || !Array.isArray(data.latest_activities) || !Array.isArray(data.house_totals)) throw new Error('Invalid summary');
  if (data.leaderboard.some((row) => typeof row.nama !== 'string' || typeof row.kod_peserta !== 'string' || !count(row.rank) || row.rank < 1 || !km(row.total_km) || !count(row.activity_count)) || data.latest_activities.some((row) => typeof row.nama !== 'string' || typeof row.tarikh_aktiviti !== 'string' || !km(row.jarak_km) || (row.status && row.status !== 'SAH')) || data.house_totals.some((row) => typeof row.rumah_sukan !== 'string' || !km(row.total_km) || !count(row.participant_count))) throw new Error('Invalid summary rows');
  return data;
}
function renderDashboard() {
  const data = dashboardSummary;
  const stats = [
    ['Jumlah Peserta', data?.participant_count ?? '—', 'navy'],
    ['Jumlah Aktiviti', data?.activity_count ?? '—', 'pink'],
    ['Jumlah KM', data ? data.total_km.toFixed(2) : '—', 'blue'],
    ['Hari Aktif', data?.active_days ?? '—', 'orange']
  ];
  el('stats-grid').replaceChildren(...stats.map(([label, value, color]) => {
    const card = node('article', `stat-card ${color}`);
    card.append(node('p', 'stat-label', label), node('p', 'stat-value', value));
    return card;
  }));
  el('leaderboard-body').replaceChildren(...(data?.leaderboard ?? []).map((person) => {
    const row = node('tr', person.rank === 1 ? 'first-rank' : '');
    const name = node('th', 'table-name', person.nama);
    name.scope = 'row';
    row.append(node('td', 'rank-cell', String(person.rank).padStart(2, '0')), name, node('td', 'distance-cell', person.total_km.toFixed(2)), node('td', '', person.activity_count), node('td', 'leaderboard-house', person.rumah_sukan || 'BELUM DITETAPKAN'));
    return row;
  }));
  if (!data?.leaderboard.length) {
    const row = node('tr', 'empty-leaderboard');
    const cell = node('td', 'section-note', data ? 'Belum ada kedudukan.' : 'Data kedudukan belum tersedia.');
    cell.colSpan = 5; row.append(cell); el('leaderboard-body').append(row);
  }
  // Reuse the existing live row rendering for the compact top-five preview.
  el('dashboard-leaderboard-body').replaceChildren(...Array.from(el('leaderboard-body').children).slice(0, 5).map((row) => row.cloneNode(true)));
  const top = data?.activity_count ? data.leaderboard.filter((person) => person.activity_count > 0).slice(0, 3) : [];
  el('podium').replaceChildren(...top.map((person, index) => {
    const item = node('li', `podium-place place-${index + 1}`);
    item.append(node('span', 'medal', index + 1), node('p', 'podium-name', person.nama), node('p', 'podium-km', `${person.total_km.toFixed(2)} KM`), node('span', 'podium-step', `#${index + 1}`));
    return item;
  }));
  if (!top.length) el('podium').append(node('li', 'summary-empty', data ? 'Belum ada kedudukan.' : 'Data kedudukan belum tersedia.'));
  const colors = { MERAH: 'red', BIRU: 'blue', HIJAU: 'green', KUNING: 'yellow' };
  el('house-ranking').replaceChildren(...(data?.house_totals ?? []).map((house, index) => {
    const item = node('li', `house-item ${colors[house.rumah_sukan] || ''}`);
    item.append(node('span', 'house-rank', `#${index + 1}`), node('strong', 'house-name', house.rumah_sukan), node('span', 'house-km', `${house.total_km.toFixed(2)} KM`), node('span', 'house-participant-count', `${house.participant_count} peserta`));
    return item;
  }));
  el('latest-activity').replaceChildren(...(data?.latest_activities ?? []).slice(0, 5).map((activity) => {
    const item = node('li', 'activity-item');
    const detail = node('div');
    detail.append(node('p', 'activity-name', activity.nama), node('p', 'activity-type', `${displayDate(activity.tarikh_aktiviti)} · ${activity.rumah_sukan || 'BELUM DITETAPKAN'}`));
    item.append(node('span', 'activity-symbol', '↗'), detail, node('strong', 'activity-distance', `${activity.jarak_km.toFixed(2)} KM`));
    return item;
  }));
  if (!data?.latest_activities.length) el('latest-activity').append(node('li', 'summary-empty', data ? 'Belum ada aktiviti yang disahkan.' : 'Data aktiviti belum tersedia.'));
  const target = data?.community_target_km ?? 2000;
  el('community-total').replaceChildren(node('strong', '', data ? data.total_km.toFixed(2) : '—'), node('span', '', ` / ${target.toLocaleString('en-US')} KM`));
  el('community-progress').max = target;
  el('community-progress').value = Math.min(data?.total_km ?? 0, target);
  el('community-percentage').textContent = data ? `${(data.total_km / target * 100).toLocaleString('ms-MY', { maximumFractionDigits: 2 })}% daripada sasaran komuniti` : 'Kemajuan belum tersedia.';
}
async function loadDashboardSummary(force = false) {
  if (!session) return;
  if (summaryPending) { if (force) summaryRefreshQueued = true; return; }
  // Coalesce rapid navigation; no polling or continuous refresh.
  if (!force && Date.now() - lastSummaryAttempt < 5000) return;
  lastSummaryAttempt = Date.now();
  summaryPending = true;
  const generation = summaryGeneration;
  el('dashboard-status').textContent = 'Memuatkan data semasa...';
  el('dashboard-error').hidden = true;
  el('dashboard-retry').hidden = true;
  try {
    const result = await request({ action: 'dashboard_summary' });
    if (!session || generation !== summaryGeneration) return;
    if (result.ok === false || result.success === false) throw new Error('Summary unavailable');
    dashboardSummary = validateSummary(result.data ?? result);
    renderDashboard();
    el('dashboard-status').textContent = 'Statistik dan kedudukan berdasarkan aktiviti SAH sahaja.';
  } catch {
    if (!session || generation !== summaryGeneration) return;
    el('dashboard-status').textContent = dashboardSummary ? 'Paparan terakhir yang berjaya dimuatkan dikekalkan.' : '';
    el('dashboard-error').textContent = 'Data semasa tidak dapat dimuatkan. Cuba semula sebentar lagi.';
    el('dashboard-error').hidden = false;
    el('dashboard-retry').hidden = false;
  } finally {
    summaryPending = false;
    if (summaryRefreshQueued) { summaryRefreshQueued = false; if (session) loadDashboardSummary(true); }
  }
}
async function request(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let loadingToken;
  if (payload.action === 'participant_directory') loadingToken = beginLoading('Memuatkan peserta...');
  if (payload.action === 'dashboard_summary' && !dashboardSummary && ['dashboard', 'kedudukan'].includes(activeView)) loadingToken = beginLoading('Memuatkan keputusan semasa...');
  if (payload.action === 'participant_activity_history' && !historyData && activeView === 'aktiviti' && !submissionPending && el('submission-success').hidden) loadingToken = beginLoading('Memuatkan rekod aktiviti...');
  try {
    // A simple POST avoids the preflight unsupported by Apps Script web apps.
    const response = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload), signal: controller.signal, redirect: 'follow',
      credentials: 'omit', cache: 'no-store'
    });
    if (!response.ok) throw new Error('API unavailable');
    return await response.json();
  } finally { clearTimeout(timeout); if (loadingToken) endLoading(loadingToken); }
}

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (value && ['kod_peserta', 'nama', 'rumah_sukan'].every((key) => typeof value[key] === 'string' && value[key].trim()) &&
        Number.isFinite(value.last_active) && value.last_active <= Date.now() && Date.now() - value.last_active < IDLE_TIMEOUT) {
      return { kod_peserta: value.kod_peserta, nama: value.nama, rumah_sukan: value.rumah_sukan, last_active: value.last_active };
    }
  } catch { /* Unavailable or invalid storage falls back to login. */ }
  clearStoredSession();
  return null;
}

function clearStoredSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* In-memory logout still works. */ }
}

function scheduleExpiry() {
  clearTimeout(expiryTimer);
  if (session) expiryTimer = setTimeout(() => logout(true), Math.max(0, IDLE_TIMEOUT - (Date.now() - session.last_active)));
}

function saveSession() {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* Keep the current session in memory. */ }
  scheduleExpiry();
}

function showHome() {
  if (historyOwnerCode && historyOwnerCode !== session.kod_peserta) clearHistory();
  el('participant-name').textContent = session.nama;
  el('participant-house').textContent = session.rumah_sukan;
  el('login-view').hidden = true;
  el('login-layout').hidden = true;
  el('login-brand').hidden = true;
  el('home-view').hidden = false;

  renderParticipants();
  switchView(activeView, false);
  if (activeView === 'aktiviti') loadActivityHistory(true);
  loadDashboardSummary(true);
  scheduleExpiry();
}

function showError(message) {
  el('login-error').textContent = message;
  el('login-error').hidden = false;
}

function logout(expired = false) {
  for (const token of Array.from(loadingTasks.keys())) endLoading(token);
  session = null;
  clearHistory();
  summaryGeneration++;
  dashboardSummary = null;
  lastSummaryAttempt = 0;
  renderDashboard();
  resetSubmission();
  el('submission-success').hidden = true;
  el('submission-receipt').replaceChildren();
  clearTimeout(expiryTimer);
  clearStoredSession();
  el('pin').value = '';
  el('participant-name').textContent = '';
  el('participant-house').textContent = '';
  el('home-view').hidden = true;
  el('login-view').hidden = false;
  el('login-layout').hidden = false;
  el('login-brand').hidden = false;
  activeView = 'aktiviti';
  renderParticipants();

  el('login-error').hidden = true;
  if (expired) showError('Sesi anda telah tamat. Sila masuk semula.');
  el('participant').focus();
}

async function loadDirectory() {
  directoryReady = false;
  el('participant').disabled = true;
  el('login-button').disabled = true;
  el('retry-directory').hidden = true;
  el('directory-status').textContent = 'Memuatkan peserta...';
  el('participants-status').textContent = 'Memuatkan peserta...';
  el('retry-participants').hidden = true;
  try {
    const result = await request({ action: 'participant_directory' });
    const participants = result.participants ?? result.data?.participants ?? result.data;
    if (result.ok === false || result.success === false || !Array.isArray(participants)) throw new Error('Invalid directory');
    const options = participants.filter((person) => person && (person.kod_peserta ?? person.KOD_PESERTA) && (person.nama ?? person.NAMA));
    if (!options.length) throw new Error('Empty directory');
    el('participant').replaceChildren(new Option('Pilih nama anda', ''));
    for (const person of options) {
      el('participant').add(new Option(person.nama ?? person.NAMA, person.kod_peserta ?? person.KOD_PESERTA));
    }
    directoryReady = true;
    participantDirectory = options;
    renderParticipants();
    el('participants-status').textContent = `${options.length} peserta aktif. Rumah sukan dipaparkan apabila tersedia dalam direktori atau sesi anda.`;
    el('participant').disabled = false;
    el('directory-status').textContent = 'Pilih nama seperti yang didaftarkan.';
  } catch {
    el('participant').replaceChildren(new Option('Senarai peserta belum tersedia', ''));
    el('directory-status').textContent = 'Tidak dapat memuatkan peserta. Sila cuba semula.';
    el('retry-directory').hidden = false;
    el('participants-status').textContent = 'Tidak dapat memuatkan direktori peserta. Sila cuba semula.';
    el('retry-participants').hidden = false;
  } finally { el('login-button').disabled = !directoryReady || loginPending; }
}

el('pin').addEventListener('input', () => {
  el('pin').value = el('pin').value.replace(/[^0-9]/g, '').slice(0, 4);
  el('login-error').hidden = true;
});
el('participant').addEventListener('change', () => { el('login-error').hidden = true; });
el('retry-directory').addEventListener('click', loadDirectory);
el('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (loginPending || !directoryReady) return;
  if (!el('participant').value || !/^[0-9]{4}$/.test(el('pin').value)) {
    showError('Sila pilih nama dan masukkan PIN 4 digit.');
    return;
  }
  loginPending = true;
  el('login-button').disabled = true;
  el('login-button').textContent = 'Mengesahkan...';
  el('login-form').setAttribute('aria-busy', 'true');
  el('login-error').hidden = true;
  el('participant').disabled = true;
  el('pin').disabled = true;
  let loginPin = el('pin').value;
  let loginTransition;
  try {
    const result = await request({ action: 'participant_login', kod_peserta: el('participant').value, pin: loginPin });
    el('pin').value = '';
    const participant = result.data ?? result;
    if (result.ok === false || result.success === false || (participant.authenticated ?? result.authenticated) !== true) {
      showError('Nama atau PIN tidak sepadan. Sila semak PIN dan cuba semula.');
      return;
    }
    if (!['kod_peserta', 'nama', 'rumah_sukan'].every((key) => typeof participant[key] === 'string' && participant[key].trim()) || participant.kod_peserta !== el('participant').value) throw new Error('Invalid session');
    session = { kod_peserta: participant.kod_peserta, nama: participant.nama, rumah_sukan: participant.rumah_sukan, last_active: Date.now() };
    setHistoryPin(loginPin);
    saveSession();
    activeView = 'aktiviti';
    loginTransition = beginLoading('Menyediakan paparan...');
    showHome();
    await new Promise((resolve) => setTimeout(resolve, 450));
    endLoading(loginTransition);
    el('activity-button').focus();
  } catch { showError('Pengesahan tidak dapat diselesaikan. Sila cuba semula sebentar lagi.'); }
  finally {
    if (loginTransition) endLoading(loginTransition);
    loginPin = '';
    el('pin').value = '';
    loginPending = false;
    el('participant').disabled = !directoryReady;
    el('pin').disabled = false;
    el('login-button').disabled = !directoryReady;
    el('login-button').textContent = 'MASUK →';
    el('login-form').removeAttribute('aria-busy');
    if (!session) el('pin').focus();
  }
});

function refreshActivity() {
  if (!session) return;
  if (Date.now() - session.last_active >= IDLE_TIMEOUT) { logout(true); return; }
  session.last_active = Date.now();
  saveSession();
}
for (const type of ['pointerdown', 'keydown', 'input', 'change', 'click', 'scroll']) {
  document.addEventListener(type, refreshActivity, { passive: true });
}
el('activity-button').addEventListener('click', () => {
  refreshActivity();
  if (session) openSubmission();
});
el('logout-button').addEventListener('click', () => logout());
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});
el('retry-participants').addEventListener('click', loadDirectory);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && session && Date.now() - session.last_active >= IDLE_TIMEOUT) logout(true);
});
window.addEventListener('storage', (event) => {
  if (event.key !== SESSION_KEY && event.key !== null) return;
  session = readSession();
  if (session) showHome(); else logout();
});

function clearHistory() {
  historyGeneration++;
  historyPin = '';
  historyOwnerCode = '';
  historyData = null;
  lastHistoryAttempt = 0;
  historyRefreshQueued = false;
  el('history-pin').value = '';
  el('history-error').hidden = true;
  el('history-loading').hidden = true;
  renderHistory();
}
function setHistoryPin(pin) {
  if (!session || !/^[0-9]{4}$/.test(pin)) return;
  if (historyOwnerCode !== session.kod_peserta || historyPin !== pin) {
    historyGeneration++;
    historyData = null;
    lastHistoryAttempt = 0;
  }
  historyOwnerCode = session.kod_peserta;
  historyPin = pin;
  el('history-pin').value = '';
  renderHistory();
}
function renderHistory() {
  const unlocked = !!session && !!historyPin && historyOwnerCode === session.kod_peserta;
  el('history-pin-form').hidden = unlocked;
  el('history-locked').hidden = !!historyData;
  el('history-locked').textContent = unlocked ? 'Rekod peribadi belum tersedia. Muat semula untuk mencuba lagi.' : 'Sahkan PIN untuk melihat rekod peribadi anda.';
  el('history-empty').hidden = !historyData || historyData.activities.length !== 0;
  const stats = [['AKTIVITI SAH', historyData?.summary.approved_count ?? '—'], ['JUMLAH KM', historyData ? historyData.summary.approved_km.toFixed(2) : '—'], ['MENUNGGU SEMAKAN', historyData?.summary.pending_count ?? '—']];
  el('history-summary').replaceChildren(...stats.map(([label, value]) => {
    const card = node('div', 'history-stat');
    card.append(node('p', '', label), node('strong', '', value));
    return card;
  }));
  el('history-list').replaceChildren(...(historyData?.activities ?? []).map((activity) => {
    const item = node('li', 'history-row');
    const detail = node('div');
    detail.append(node('p', '', displayDate(activity.tarikh_aktiviti)), node('p', 'history-id', activity.id_aktiviti));
    item.append(detail, node('p', 'history-distance', `${activity.jarak_km.toFixed(2)} KM`), node('span', `history-status history-${activity.status.toLowerCase()}`, activity.status));
    try {
      const url = new URL(activity.screenshot_url);
      if (url.protocol === 'https:' && !url.username && !url.password) {
        const link = node('a', 'history-evidence', 'LIHAT BUKTI ↗');
        link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        item.append(link);
      }
    } catch { /* Missing or unsafe URLs are not rendered. */ }
    return item;
  }));
}
function validateHistory(data) {
  const summary = data?.summary;
  const count = (value) => Number.isInteger(value) && value >= 0;
  const km = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!summary || !count(summary.approved_count) || !count(summary.pending_count) || !km(summary.approved_km) || !Array.isArray(data.activities) || data.activities.some((row) => typeof row.id_aktiviti !== 'string' || typeof row.tarikh_aktiviti !== 'string' || !km(row.jarak_km) || !['SAH', 'PENDING', 'BATAL'].includes(row.status))) throw new Error('Invalid history response');
  return data;
}
async function loadActivityHistory(force = false) {
  if (!session) return;
  renderHistory();
  if (!historyPin || historyOwnerCode !== session.kod_peserta) return;
  if (historyPending) { if (force) historyRefreshQueued = true; return; }
  if (!force && Date.now() - lastHistoryAttempt < 5000) return;
  historyPending = true;
  lastHistoryAttempt = Date.now();
  const generation = historyGeneration;
  const code = session.kod_peserta;
  el('history-loading').hidden = false;
  el('history-error').hidden = true;
  el('history-refresh').disabled = true;
  el('history-unlock').disabled = true;
  let payload = { action: 'participant_activity_history', kod_peserta: code, pin: historyPin };
  try {
    const result = await request(payload);
    if (!session || session.kod_peserta !== code || generation !== historyGeneration) return;
    if (result.ok === false || result.success === false) {
      const detail = `${result.code || ''} ${result.error?.message || result.error || ''} ${result.message || ''}`.toLowerCase();
      if (/pin|auth|credential|tidak aktif|inactive/.test(detail)) {
        clearHistory();
        el('history-error').textContent = /inactive|tidak aktif/.test(detail) ? 'Peserta tidak aktif. Sila hubungi urusetia.' : 'PIN tidak sah. Masukkan PIN peserta yang betul untuk melihat rekod.';
      } else el('history-error').textContent = 'Rekod aktiviti tidak dapat dimuatkan. Sila cuba semula sebentar lagi.';
      el('history-error').hidden = false;
      return;
    }
    historyData = validateHistory(result.data ?? result);
    renderHistory();
  } catch {
    if (session && generation === historyGeneration && session.kod_peserta === code) {
      el('history-error').textContent = 'Rekod aktiviti tidak dapat dimuatkan. Sila semak sambungan dan cuba semula.';
      el('history-error').hidden = false;
    }
  } finally {
    payload.pin = ''; payload = null;
    historyPending = false;
    el('history-loading').hidden = true;
    el('history-refresh').disabled = false;
    el('history-unlock').disabled = false;
    if (historyRefreshQueued) { historyRefreshQueued = false; if (session) loadActivityHistory(true); }
  }
}
el('history-pin').addEventListener('input', () => { el('history-pin').value = el('history-pin').value.replace(/[^0-9]/g, '').slice(0, 4); });
el('history-pin-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (historyPending) return;
  refreshActivity();
  if (!session) return;
  setHistoryPin(el('history-pin').value);
  loadActivityHistory(true);
});
el('history-refresh').addEventListener('click', () => loadActivityHistory(true));
window.addEventListener('pagehide', () => clearHistory());
renderHistory();
el('dashboard-retry').addEventListener('click', () => loadDashboardSummary(true));
el('leaderboard-view-all').addEventListener('click', () => switchView('kedudukan'));
renderDashboard();
session = readSession();
el('splash-status').textContent = session ? 'Memuatkan akaun...' : 'Memuatkan peserta...';
if (session) showHome();
el('app-shell').inert = true;
const bootWatchdog = setTimeout(finishBoot, 32000);
Promise.allSettled([loadDirectory(), new Promise((resolve) => setTimeout(resolve, 1200))]).then(() => { clearTimeout(bootWatchdog); finishBoot(); });
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./service_worker.js', { scope: './' }).catch(() => { /* PWA support is optional; app remains usable. */ }); });
}


// Backend V4 has no distance maximum. Require a finite, strictly positive number.
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 500 * 1024;
let compressedScreenshot = null;
let previewUrl = null;
let compressionVersion = 0;
let compressionPending = false;
let submissionPending = false;

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function submissionError(message) {
  el('submission-error').textContent = message;
  el('submission-error').hidden = false;
}
function clearScreenshot() {
  compressedScreenshot = null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  el('screenshot-preview').removeAttribute('src');
  el('screenshot-preview').hidden = true;
}
function resetSubmission() {
  compressionVersion++;
  compressionPending = false;
  clearScreenshot();
  el('activity-form').reset();
  el('activity-date').value = localToday();
  el('screenshot-info').textContent = 'JPEG, PNG atau WebP. Imej dikecilkan tanpa dipotong sebelum dihantar.';
  el('submission-error').hidden = true;
  el('submission-panel').hidden = true;
  el('submission-identity').textContent = '';
  el('submission-submit').disabled = submissionPending;
}
function openSubmission() {
  switchView('aktiviti');
  if (!session) return;
  el('submission-success').hidden = true;
  el('submission-identity').textContent = `${session.nama} · Rumah Sukan: ${session.rumah_sukan}`;
  if (!el('activity-date').value) el('activity-date').value = localToday();
  el('submission-panel').hidden = false;
  el('submission-title').focus({ preventScroll: true });
}
async function compressScreenshot(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Pilih screenshot JPEG, PNG atau WebP sahaja.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Screenshot terlalu besar. Pilih imej kurang daripada 15 MB.');
  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = sourceUrl;
    try { await image.decode(); } catch { throw new Error('Screenshot tidak dapat dibaca. Sila pilih imej lain.'); }
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 80000000) throw new Error('Dimensi screenshot terlalu besar. Pilih imej yang lebih kecil.');
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Pelayar tidak dapat memproses imej ini.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob;
    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) throw new Error('Screenshot tidak dapat dimampatkan. Sila pilih imej lain.');
      if (blob.size <= MAX_UPLOAD_BYTES) break;
    }
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Screenshot masih terlalu besar selepas dimampatkan. Pilih imej yang lebih kecil atau kurang terperinci.');
    return blob;
  } finally { URL.revokeObjectURL(sourceUrl); }
}
el('activity-screenshot').addEventListener('change', async () => {
  const version = ++compressionVersion;
  clearScreenshot();
  el('submission-error').hidden = true;
  const file = el('activity-screenshot').files[0];
  if (!file) { compressionPending = false; el('screenshot-info').textContent = 'Sila pilih screenshot peta larian.'; return; }
  compressionPending = true;
  el('screenshot-info').textContent = 'Memampatkan screenshot...';
  el('submission-submit').disabled = true;
  try {
    const blob = await compressScreenshot(file);
    if (version !== compressionVersion || !session) return;
    compressedScreenshot = blob;
    previewUrl = URL.createObjectURL(blob);
    el('screenshot-preview').src = previewUrl;
    el('screenshot-preview').hidden = false;
    el('screenshot-info').textContent = `${file.name} · kira-kira ${Math.ceil(blob.size / 1024)} KB selepas dimampatkan`;
  } catch (error) {
    if (version !== compressionVersion) return;
    el('activity-screenshot').value = '';
    el('screenshot-info').textContent = 'Screenshot belum dipilih.';
    submissionError(error.message || 'Screenshot tidak dapat dibaca. Sila pilih imej lain.');
  } finally {
    if (version === compressionVersion) { compressionPending = false; el('submission-submit').disabled = submissionPending; }
  }
});
el('submission-pin').addEventListener('input', () => {
  el('submission-pin').value = el('submission-pin').value.replace(/[^0-9]/g, '').slice(0, 4);
});
function blobBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Screenshot tidak dapat dibaca.'));
    reader.readAsDataURL(blob);
  });
}
function apiSubmissionError(result) {
  const detail = `${result.code || ''} ${typeof result.error === 'string' ? result.error : result.error?.message || ''} ${result.message || ''}`.toLowerCase();
  if (/inactive|tidak aktif|non.?active/.test(detail)) return 'Peserta tidak aktif. Sila hubungi urusetia.';
  if (/pin|unauthor|auth/.test(detail)) return 'PIN salah. Sila masukkan PIN peserta yang betul.';
  if (/size|large|besar/.test(detail)) return 'Screenshot terlalu besar. Sila pilih imej yang lebih kecil.';
  if (/screenshot|image|imej|bukti/.test(detail)) return 'Screenshot tidak diterima. Sila pilih screenshot peta larian yang sah.';
  if (/jarak|distance|km/.test(detail)) return 'Jarak tidak diterima. Sila semak nilai kilometer anda.';
  return 'Penghantaran tidak diterima. Sila semak maklumat atau hubungi urusetia.';
}
el('activity-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submissionPending) return;
  refreshActivity();
  if (!session) return;
  el('submission-error').hidden = true;
  const date = el('activity-date').value;
  const km = Number(el('activity-distance').value);
  if (!date || !el('activity-date').validity.valid) { submissionError('Sila pilih tarikh aktiviti.'); return; }
  if (!Number.isFinite(km) || km <= 0) { submissionError('Masukkan jarak lebih daripada 0 KM. Nilai perpuluhan dibenarkan.'); return; }
  if (compressionPending) { submissionError('Sila tunggu screenshot selesai dimampatkan.'); return; }
  if (!compressedScreenshot) { submissionError('Sila pilih screenshot peta larian.'); return; }
  if (!/^[0-9]{4}$/.test(el('submission-pin').value)) { submissionError('Masukkan PIN peserta 4 digit untuk pengesahan.'); return; }
  submissionPending = true;
  const owner = session;
  el('activity-fields').disabled = true;
  el('submission-submit').disabled = true;
  el('submission-submit').textContent = 'Sedang menghantar...';
  el('activity-form').setAttribute('aria-busy', 'true');
  let payload = null;
  try {
    payload = { action: 'submit_activity', kod_peserta: owner.kod_peserta, pin: el('submission-pin').value, tarikh_aktiviti: date, jarak_km: km, screenshot_base64: '', screenshot_mime: compressedScreenshot.type };
    el('submission-pin').value = '';
    payload.screenshot_base64 = await blobBase64(compressedScreenshot);
    if (session !== owner || Date.now() - owner.last_active >= IDLE_TIMEOUT) return;
    const result = await request(payload);
    if (session !== owner) return;
    const data = result.data ?? result;
    if (result.ok === false || result.success === false) { submissionError(apiSubmissionError(result)); return; }
    if ((data.status ?? result.status) !== 'PENDING') { submissionError('Status penghantaran tidak dapat disahkan. Jangan hantar semula sebelum menyemak dengan urusetia.'); return; }
    const id = data.id_aktiviti ?? data.ID_AKTIVITI ?? result.id_aktiviti ?? result.ID_AKTIVITI;
    setHistoryPin(payload.pin);
    el('submission-receipt').replaceChildren(node('dt', '', 'ID Aktiviti'), node('dd', '', id || 'Tidak dikembalikan oleh API'), node('dt', '', 'Jarak'), node('dd', '', `${data.jarak_km ?? km} KM`), node('dt', '', 'Tarikh'), node('dd', '', data.tarikh_aktiviti ?? date));
    resetSubmission();
    el('submission-success').hidden = false;
    switchView('aktiviti', false);
    loadDashboardSummary(true);
    loadActivityHistory(true);
    el('submission-done').focus({ preventScroll: true });
  } catch {
    if (session === owner) submissionError('Sambungan terputus atau API tidak dapat dihubungi. Penghantaran mungkin telah diterima; semak dengan urusetia sebelum mencuba semula.');
  } finally {
    if (payload) { payload.pin = ''; payload.screenshot_base64 = ''; payload = null; }
    el('submission-pin').value = '';
    submissionPending = false;
    el('activity-fields').disabled = false;
    el('submission-submit').disabled = compressionPending;
    el('submission-submit').textContent = 'HANTAR AKTIVITI';
    el('activity-form').removeAttribute('aria-busy');
  }
});
el('submission-cancel').addEventListener('click', () => { if (!submissionPending) resetSubmission(); });
el('submission-done').addEventListener('click', () => { switchView('dashboard'); });


