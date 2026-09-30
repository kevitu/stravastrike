'use strict';

const API_URL = 'https://script.google.com/macros/s/AKfycbylWG4JXS3Yg-5fyujcEpQ7vd_qWt8tO8FY_vGpiEZ3UXGbxmR07Vsl_qJH2iMGnMfvWQ/exec';
const SESSION_KEY = 'strava_strike_admin_v1';
const IDLE_TIMEOUT = 2 * 60 * 60 * 1000;
const el = (id) => document.getElementById(id);
let adminSession = null;
let credentials = null; // PIN exists only in this page's memory, never persisted.
let idleTimer;
let loginPending = false;
let listPending = false;
let moderationPending = false;
let pendingActivities = [];
let confirmation = null;
let loginGeneration = 0;
const requests = new Set();

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
function message(id, text) { el(id).textContent = text; el(id).hidden = !text; }
function clearMetadata() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Memory still clears. */ } }
// Reload cannot restore credentials, so saved metadata never grants access.
clearMetadata();

function saveMetadata() {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ admin_id: adminSession.admin_id, last_active: adminSession.last_active })); } catch { /* Memory session remains usable. */ }
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => logout('Sesi urusetia tamat. Sila log masuk semula.'), Math.max(0, IDLE_TIMEOUT - (Date.now() - adminSession.last_active)));
}
function hasCredentials() {
  if (!adminSession || !credentials || Date.now() - adminSession.last_active >= IDLE_TIMEOUT) {
    logout('Sesi urusetia tamat atau maklumat pengesahan tiada. Sila log masuk semula.');
    return false;
  }
  return true;
}
function refreshActivity() {
  if (!adminSession || !hasCredentials()) return;
  adminSession.last_active = Date.now();
  saveMetadata();
}
function logout(reason = '') {
  loginGeneration++;
  if (credentials) credentials.admin_pin = '';
  credentials = null;
  adminSession = null;
  clearTimeout(idleTimer);
  clearMetadata();
  for (const controller of requests) controller.abort();
  pendingActivities = [];
  confirmation = null;
  if (el('moderation-dialog').open) el('moderation-dialog').close();
  el('pending-list').replaceChildren();
  el('pending-count').textContent = '0';
  el('admin-identity').textContent = '';
  el('admin-pin').value = '';
  el('admin-main-view').hidden = true;
  el('admin-login-view').hidden = false;
  message('admin-notice', '');
  message('admin-main-error', '');
  message('admin-login-error', reason);
  el('login-title').focus({ preventScroll: true });
}
async function request(payload) {
  const controller = new AbortController();
  requests.add(controller);
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), credentials: 'omit', cache: 'no-store', redirect: 'follow', signal: controller.signal });
    if (!response.ok) throw new Error('API unavailable');
    return await response.json();
  } finally { clearTimeout(timer); requests.delete(controller); payload.admin_pin = ''; }
}
function isSuccess(result) { return result.ok === true || result.success === true; }
function errorText(result) {
  return `${result.code || ''} ${result.message || ''} ${typeof result.error === 'string' ? result.error : result.error?.message || ''}`.toLowerCase();
}
function handleFailure(result) {
  const text = errorText(result);
  if (/pin|credential|unauthor|auth|admin.*(invalid|not found)|expired|sesi/.test(text)) { logout('Pengesahan urusetia tidak sah atau tamat. Sila log masuk semula.'); return; }
  if (/already|processed|telah|sudah/.test(text)) message('admin-main-error', 'Aktiviti ini telah diproses. Muat semula senarai untuk menyemak status terkini.');
  else if (/not.found|tidak.*(jumpa|ditemui)|tiada aktiviti/.test(text)) message('admin-main-error', 'Aktiviti tidak ditemui. Sila muat semula senarai.');
  else message('admin-main-error', 'Permintaan tidak dapat diselesaikan. Sila cuba semula atau hubungi penyelaras.');
}
function screenshotUrl(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function normalizeActivity(row) {
  return { id: row.id_aktiviti ?? row.ID_AKTIVITI, name: row.nama ?? row.NAMA, code: row.kod_peserta ?? row.KOD_PESERTA, date: row.tarikh_aktiviti ?? row.TARIKH_AKTIVITI, km: row.jarak_km ?? row.JARAK_KM, status: row.status ?? row.STATUS, screenshot: row.screenshot_url ?? row.SCREENSHOT_URL };
}
function formatActivityDate(value) {
  if (typeof value !== 'string' || !value) return 'Tidak tersedia';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Tidak tersedia' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
function setBusyButtons() {
  el('pending-refresh').disabled = listPending || moderationPending;
  el('pending-list').querySelectorAll('button').forEach((button) => { button.disabled = moderationPending || listPending; });
}
function renderPending() {
  el('pending-count').textContent = pendingActivities.length;
  el('pending-empty').hidden = pendingActivities.length !== 0 || listPending;
  el('pending-list').replaceChildren(...pendingActivities.map((activity) => {
    const card = node('article', 'panel activity-card');
    const title = node('div', 'activity-title');
    title.append(node('h3', '', activity.id), node('span', 'status-badge', 'PENDING'));
    const details = node('dl');
    for (const [label, value] of [['Nama Peserta', activity.name], ['Kod Peserta', activity.code], ['Tarikh Aktiviti', formatActivityDate(activity.date)], ['Jarak KM', activity.km]]) details.append(node('dt', '', label), node('dd', '', value ?? 'Tidak tersedia'));
    card.append(title, details);
    const url = screenshotUrl(activity.screenshot);
    if (url) {
      const evidence = node('details', 'evidence');
      evidence.append(node('summary', '', 'LIHAT SCREENSHOT'));
      const image = node('img');
      image.alt = `Screenshot peta larian aktiviti ${activity.id}`;
      image.referrerPolicy = 'no-referrer';
      const failed = node('p', 'hint', 'Pratonton tidak dapat dimuatkan. Buka screenshot penuh melalui pautan di bawah.');
      failed.hidden = true;
      image.addEventListener('error', () => { image.hidden = true; failed.hidden = false; });
      const link = node('a', '', 'Buka screenshot penuh ↗');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      evidence.append(image, failed, link);
      evidence.addEventListener('toggle', () => { if (evidence.open && !image.hasAttribute('src')) image.src = url; });
      card.append(evidence);
    } else card.append(node('p', 'hint', 'Pautan screenshot tidak tersedia. Semak dengan penyelaras sebelum mengesahkan.'));
    const actions = node('div', 'actions');
    for (const [status, label, className] of [['SAH', 'SAHKAN', 'primary approve'], ['BATAL', 'BATALKAN', 'secondary reject']]) {
      const button = node('button', className, label);
      button.type = 'button';
      button.setAttribute('aria-label', `${label} aktiviti ${activity.id}`);
      button.addEventListener('click', () => openConfirmation(activity, status, button));
      actions.append(button);
    }
    card.append(actions);
    return card;
  }));
  setBusyButtons();
}
async function loadPending() {
  if (listPending || moderationPending || !hasCredentials()) return;
  listPending = true;
  const owner = credentials;
  message('admin-main-error', '');
  el('pending-loading').hidden = false;
  el('pending-empty').hidden = true;
  setBusyButtons();
  try {
    const result = await request({ action: 'admin_pending', ...owner });
    if (credentials !== owner) return;
    if (result.ok === false || result.success === false) { handleFailure(result); return; }
    const rows = result.data?.activities ?? result.data?.pending ?? result.activities ?? result.pending ?? result.data;
    if (!Array.isArray(rows)) throw new Error('Invalid pending response');
    const activities = rows.map(normalizeActivity);
    if (activities.some((row) => typeof row.id !== 'string' || !row.id.trim())) throw new Error('Missing activity identity');
    pendingActivities = activities.filter((row) => !row.status || row.status === 'PENDING');
    renderPending();
  } catch { if (credentials === owner) message('admin-main-error', 'Senarai tidak dapat dimuatkan. Semak sambungan dan cuba muat semula.'); }
  finally { listPending = false; el('pending-loading').hidden = true; setBusyButtons(); if (credentials === owner && el('admin-main-error').hidden) el('pending-empty').hidden = pendingActivities.length !== 0; }
}
function openConfirmation(activity, status, source) {
  if (moderationPending || listPending || !hasCredentials()) return;
  confirmation = { activity, status, source };
  el('confirmation-title').textContent = status === 'SAH' ? 'Sahkan aktiviti ini?' : 'Batalkan aktiviti ini?';
  el('confirmation-detail').textContent = `${activity.id} · ${activity.name ?? activity.code ?? ''} · ${activity.km ?? '—'} KM`;
  el('confirmation-apply').textContent = status === 'SAH' ? 'SAHKAN' : 'BATALKAN';
  el('moderation-dialog').showModal();
}
async function applyModeration() {
  if (moderationPending || !confirmation || !hasCredentials()) return;
  const { activity, status } = confirmation;
  const owner = credentials;
  confirmation = null;
  el('moderation-dialog').close();
  moderationPending = true;
  setBusyButtons();
  message('admin-main-error', '');
  message('admin-notice', 'Sedang mengemas kini aktiviti...');
  try {
    const result = await request({ action: 'admin_update_status', ...owner, id_aktiviti: activity.id, status });
    if (credentials !== owner) return;
    const returnedStatus = result.data?.status ?? result.status;
    if (result.ok === false || result.success === false) { message('admin-notice', ''); handleFailure(result); return; }
    if (returnedStatus && returnedStatus !== status) throw new Error('Unexpected updated status');
    if (!isSuccess(result) && returnedStatus !== status) throw new Error('Unconfirmed update');
    pendingActivities = pendingActivities.filter((row) => row.id !== activity.id);
    renderPending();
    message('admin-notice', `Aktiviti ${activity.id} telah ${status === 'SAH' ? 'disahkan' : 'dibatalkan'}.`);
    el('pending-title').focus({ preventScroll: true });
  } catch {
    if (credentials === owner) { message('admin-notice', ''); message('admin-main-error', 'Status kemas kini tidak dapat disahkan. Muat semula senarai sebelum mencuba semula.'); }
  } finally { moderationPending = false; setBusyButtons(); }
}
el('admin-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (loginPending) return;
  const adminId = el('admin-id').value.trim();
  if (!adminId || !el('admin-pin').value) { message('admin-login-error', 'Masukkan Admin ID dan PIN.'); return; }
  loginPending = true;
  const generation = loginGeneration;
  const candidate = { admin_id: adminId, admin_pin: el('admin-pin').value };
  el('admin-pin').value = '';
  el('admin-login-submit').disabled = true;
  el('admin-login-submit').textContent = 'Mengesahkan...';
  el('admin-login-form').setAttribute('aria-busy', 'true');
  message('admin-login-error', '');
  try {
    const result = await request({ action: 'admin_login', ...candidate });
    if (generation !== loginGeneration) return;
    const data = result.data ?? result;
    if (result.ok === false || result.success === false || (data.authenticated ?? result.authenticated) !== true) { message('admin-login-error', 'Admin ID atau PIN tidak sah. Sila cuba semula.'); return; }
    credentials = { ...candidate };
    adminSession = { admin_id: adminId, last_active: Date.now() };
    saveMetadata();
    el('admin-identity').textContent = adminId;
    el('admin-login-view').hidden = true;
    el('admin-main-view').hidden = false;
    el('pending-title').focus({ preventScroll: true });
    await loadPending();
  } catch { if (generation === loginGeneration) message('admin-login-error', 'Pengesahan tidak dapat diselesaikan. Semak sambungan dan cuba semula.'); }
  finally { candidate.admin_pin = ''; el('admin-pin').value = ''; loginPending = false; el('admin-login-submit').disabled = false; el('admin-login-submit').textContent = 'MASUK'; el('admin-login-form').removeAttribute('aria-busy'); }
});
el('pending-refresh').addEventListener('click', loadPending);
el('admin-logout').addEventListener('click', () => logout());
el('confirmation-apply').addEventListener('click', applyModeration);
el('confirmation-cancel').addEventListener('click', () => el('moderation-dialog').close());
el('moderation-dialog').addEventListener('close', () => { const source = confirmation?.source; confirmation = null; if (source?.isConnected) source.focus(); });
for (const event of ['pointerdown', 'keydown', 'input', 'change', 'click', 'scroll']) document.addEventListener(event, refreshActivity, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && adminSession) hasCredentials(); });
window.addEventListener('pagehide', () => logout());
