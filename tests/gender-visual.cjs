// Local fixture preview only: no production API, login or submission requests.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/burnk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = process.argv[2];
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  let html = fs.readFileSync('index.html', 'utf8').replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<link[^>]+href="assets\/css\/app.css"[^>]*>/, `<style>${fs.readFileSync('assets/css/app.css', 'utf8')}</style>`);
  const app = fs.readFileSync('assets/js/app.js', 'utf8');
  await page.route('https://category.test/**', async route => {
    const file = decodeURIComponent(new URL(route.request().url()).pathname).slice(1);
    if (file === '') return route.fulfill({ contentType: 'text/html', body: html });
    if (file.startsWith('assets/')) return route.fulfill({ body: fs.readFileSync(path.join(process.cwd(), file)) });
    return route.abort();
  });
  await page.goto('https://category.test/');
  await page.evaluate(() => {
    document.body.classList.remove('app-booting');
    for (const id of ['app-splash', 'login-view', 'login-layout', 'login-brand', 'app-loading']) document.getElementById(id).hidden = true;
    for (const id of ['app-shell', 'home-view', 'view-dashboard']) document.getElementById(id).hidden = false;
    for (const id of ['view-kedudukan', 'view-aktiviti', 'view-peserta']) document.getElementById(id).hidden = true;
    document.getElementById('app-shell').inert = false;
  });
  const fixture = { participant_count: 14, activity_count: 14, total_km: 140, active_days: 6, leaderboard: Array.from({ length: 14 }, (_, i) => ({ rank: i + 1, kod_peserta: `K${i}`, nama: i < 2 ? 'NAMA PESERTA YANG SANGAT PANJANG BIN ABDULLAH KEVITU' : `Peserta Jantina ${i + 1}`, rumah_sukan: ['MERAH', 'BIRU', 'HIJAU', 'KUNING'][i % 4], jantina: i % 2 ? 'PEREMPUAN' : 'LELAKI', total_km: 105.35 - i, activity_count: 1 })), house_totals: ['MERAH', 'BIRU', 'HIJAU', 'KUNING'].map((rumah_sukan, i) => ({ rumah_sukan, total_km: 80 - i * 10, participant_count: 4 })), latest_activities: [] };
  await page.addScriptTag({ content: `const el=id=>document.getElementById(id); let dashboardSummary=${JSON.stringify(fixture)}; ${app.slice(app.indexOf('function node('), app.indexOf('async function loadDashboardSummary'))}; renderDashboard();` });
  await page.evaluate(() => Promise.all(Array.from(document.images, img => img.complete ? Promise.resolve() : new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); }))));
  fs.mkdirSync(output, { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('.category-ranking').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `category-${width}.png`), fullPage: true });
    await page.locator('.category-ranking').screenshot({ path: path.join(output, `category-card-${width}.png`) });
    const layout = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, bottom: r.bottom, width: r.width }; };
      return { viewport: innerWidth, scroll: document.documentElement.scrollWidth, card: rect('.category-ranking'), men: rect('.category-male'), women: rect('.category-female'), house: rect('.house-ranking'), podium: rect('.podium-card') };
    });
    if (layout.scroll > width || layout.card.y < layout.podium.bottom || layout.house.y < layout.card.bottom) throw Error(`Bad layout: ${JSON.stringify(layout)}`);
    if (width > 700 ? layout.men.y !== layout.women.y : layout.women.y <= layout.men.y) throw Error('Gender columns incorrect');
    console.log(JSON.stringify(layout));
  }
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
