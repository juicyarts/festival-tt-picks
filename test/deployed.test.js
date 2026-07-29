// PWA test for deployed GitHub Pages site
// Run: BASE_URL=https://juicyarts.github.io/festival-tt-picks node test/deployed.test.js

const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'https://juicyarts.github.io/festival-tt-picks';
let browser, context, page;
let passed = 0;
let failed = 0;

function ok(label) { passed++; console.log(`  ✓ ${label}`); }
function fail(label, detail) { failed++; console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`); }

async function visit(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
}

async function waitForSW() {
  for (let i = 0; i < 25; i++) {
    const active = await page.evaluate(() =>
      !!navigator.serviceWorker && !!navigator.serviceWorker.controller
    );
    if (active) return true;
    await new Promise(r => setTimeout(r, 600));
  }
  return false;
}

async function getText(sel) { return page.textContent(sel).catch(() => ''); }
async function isVisible(sel) { return page.isVisible(sel).catch(() => false); }

async function hasCached(url) {
  return page.evaluate(u =>
    caches.open('festival-picks-v2').then(c => c.match(u).then(r => !!r)),
    url
  );
}

async function run() {
  console.log('\n📴 PWA Deploy Test — ' + BASE + '\n');

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();

  // ── Online tests ──
  console.log('── Online ──');
  await visit('/');
  const title = await getText('h1');
  if (title === 'Achja?!') ok('Listing page loads');
  else fail('Listing page loads', 'got: ' + title);

  const cards = await page.$$('.card');
  if (cards.length > 0) ok('Festival cards render');
  else fail('Festival cards render');

  const swActive = await waitForSW();
  if (swActive) ok('Service worker active');
  else fail('Service worker active');

  await page.click('.card');
  await page.waitForSelector('.tab-bar', { timeout: 8000 });
  const pageTitle = await getText('#pageTitle');
  if (pageTitle.includes('Appletree')) ok('Schedule page loads');
  else fail('Schedule page loads', 'got: ' + pageTitle);

  if (await isVisible('.md h2')) ok('Artists tab shows schedule');
  else fail('Artists tab shows schedule');

  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(800);
  if (await isVisible('#mapImg')) ok('Locations tab shows map');
  else fail('Locations tab shows map');

  await page.click('[data-tab="notifications"]');
  await page.waitForTimeout(800);
  if (await isVisible('.notif-md')) ok('Notifications tab shows content');
  else fail('Notifications tab shows content');

  // ── Cache tests ──
  console.log('── Cache ──');
  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(1000);

  const scheduleUrl = BASE + '/appletree-2026/schedule.md';
  const mapUrl = BASE + '/appletree-2026/assets/at26_Lageplan.png';
  const notifUrl = BASE + '/appletree-2026/notifications.md';

  if (await hasCached(scheduleUrl)) ok('Schedule cached');
  else fail('Schedule cached');

  if (await hasCached(mapUrl)) ok('Map image cached');
  else fail('Map image cached');

  if (await hasCached(notifUrl)) ok('Notifications cached');
  else fail('Notifications cached');

  // ── Offline tests ──
  console.log('── Offline ──');
  await context.setOffline(true);
  ok('Switched offline');

  await visit('/');
  const offTitle = await getText('h1');
  if (offTitle === 'Achja?!') ok('Listing offline');
  else fail('Listing offline', 'got: ' + offTitle);

  await visit('/#appletree-2026');
  await page.waitForSelector('.tab-bar', { timeout: 8000 });
  const offH2 = await getText('.md h2');
  if (offH2 && offH2.length > 0) ok('Schedule offline');
  else fail('Schedule offline');

  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(800);
  if (await isVisible('#mapImg')) ok('Map offline');
  else fail('Map offline');

  await page.click('[data-tab="notifications"]');
  await page.waitForTimeout(800);
  if (await isVisible('.notif-md')) ok('Notifications offline');
  else fail('Notifications offline');

  // ── Tab URL hash ──
  await context.setOffline(false);
  await visit('/#appletree-2026:locations');
  await page.waitForSelector('.tab-bar', { timeout: 8000 });
  await page.waitForTimeout(500);
  const locActive = await page.evaluate(() =>
    document.querySelector('.tab-panel.tab-locations')?.classList.contains('active')
  );
  if (locActive) ok('URL hash persists tab');
  else fail('URL hash persists tab');

  // ── Result ──
  console.log('\n' + '─'.repeat(40));
  console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
  console.log(failed === 0 ? '  ✅ All passed!' : `  ❌ ${failed} failed`);
  console.log('─'.repeat(40) + '\n');
}

async function cleanup() {
  if (page) await page.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  process.exit(failed > 0 ? 1 : 0);
}

run().then(cleanup).catch(err => { console.error('Fatal:', err); cleanup(); });
