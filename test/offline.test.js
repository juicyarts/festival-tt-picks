// Offline PWA test suite for festival-tt-picks
// Requires: npm install && npx playwright install chromium
// Run:     node test/offline.test.js
// Or:      npm test

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, '..');
const expectedNotifCount = (fs.readFileSync(path.join(ROOT, 'appletree-2026', 'notifications.md'), 'utf8').match(/^\s*-\s+/gm) || []).length;

let server;
let browser;
let context;
let page;
let passed = 0;
let failed = 0;

function ok(label) { passed++; console.log(`  ✓ ${label}`); }
function fail(label, detail) { failed++; console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`); }

// ── helpers ──

function waitForServer() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      http.get(BASE + '/', res => {
        if (res.statusCode === 200) resolve();
        else if (Date.now() - start > 15000) reject(new Error('Server did not start'));
        else setTimeout(poll, 300);
      }).on('error', () => {
        if (Date.now() - start > 15000) reject(new Error('Server did not start'));
        else setTimeout(poll, 300);
      });
    };
    poll();
  });
}

async function goOffline() {
  await context.setOffline(true);
}

async function goOnline() {
  await context.setOffline(false);
}

async function visit(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 15000 });
}

async function waitForSW() {
  // Poll until a service worker is active
  for (let i = 0; i < 20; i++) {
    const active = await page.evaluate(() =>
      !!navigator.serviceWorker && !!navigator.serviceWorker.controller
    );
    if (active) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function getText(sel) {
  return page.textContent(sel).catch(() => '');
}

async function isVisible(sel) {
  return page.isVisible(sel).catch(() => false);
}

async function hasCached(url) {
  return page.evaluate(u =>
    caches.open('festival-picks-v2').then(c => c.match(u).then(r => !!r)),
    url
  );
}

// ── tests ──

async function run() {
  console.log('\n📴 Offline PWA Test Suite\n');

  // ── start server ──
  console.log('Starting server…');
  server = spawn('node', ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore'
  });
  server.on('error', err => { console.error('Server error:', err); process.exit(1); });

  try {
    await waitForServer();
    ok('Server started on port ' + PORT);
  } catch (e) {
    fail('Server start', e.message);
    process.exit(1);
  }

  // ── launch browser ──
  // try system Chrome first, fall back to Playwright's chromium
  let launchOpts = { headless: true };
  try {
    browser = await chromium.launch({ ...launchOpts, channel: 'chrome' });
  } catch {
    browser = await chromium.launch(launchOpts);
  }
  context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();

  // ── TEST 1: Listing page loads ──
  console.log('\n── Online tests ──');
  await visit('/');
  const title = await getText('h1');
  if (title === 'Achja?!') ok('Listing page loads');
  else fail('Listing page loads', 'title was: ' + title);

  const cards = await page.$$('.card');
  if (cards.length > 0) ok('Festival cards render (' + cards.length + ' found)');
  else fail('Festival cards render');

  // ── TEST 2: Service worker registers ──
  const swActive = await waitForSW();
  if (swActive) ok('Service worker registered and active');
  else fail('Service worker registration');

  // ── TEST 3: Navigate to festival page ──
  await page.click('.card');
  await page.waitForSelector('.tab-bar', { timeout: 5000 });
  const pageTitle = await getText('#pageTitle');
  if (pageTitle.includes('Appletree')) ok('Schedule page loads');
  else fail('Schedule page loads', 'title was: ' + pageTitle);

  // ── TEST 4: Artists tab has content ──
  const hasH2 = await isVisible('.md h2');
  if (hasH2) ok('Artists tab shows schedule');
  else fail('Artists tab shows schedule');

  // ── TEST 5: Locations tab ──
  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(500);
  const mapImg = await isVisible('#mapImg');
  if (mapImg) ok('Locations tab shows map');
  else fail('Locations tab shows map');

  // ── TEST 6: Notifications tab ──
  const notifBadge = await getText('[data-tab="notifications"] .tab-badge');
  if (notifBadge === String(expectedNotifCount)) ok('Notifications tab shows unread count badge');
  else fail('Notifications tab shows unread count badge', 'badge was: ' + notifBadge);

  await page.click('[data-tab="notifications"]');
  await page.waitForTimeout(500);
  const notifContent = await isVisible('.notif-md');
  if (notifContent) ok('Notifications tab shows content');
  else fail('Notifications tab shows content');

  const swimReminder = await getText('.tab-panel.tab-notifications');
  if (swimReminder.includes('shuttle bus') && swimReminder.includes('sunscreen')) ok('Notifications include swimming reminder');
  else fail('Notifications include swimming reminder');

  const notifBadgeCleared = await page.evaluate(() => !document.querySelector('[data-tab="notifications"] .tab-badge'));
  if (notifBadgeCleared) ok('Notifications badge clears after opening tab');
  else fail('Notifications badge clears after opening tab');

  // ── TEST 7: Back to listing ──
  await page.click('#backBtn');
  await page.waitForSelector('.listing.active', { timeout: 3000 });
  const listingVisible = await isVisible('.card');
  if (listingVisible) ok('Back button returns to listing');
  else fail('Back button returns to listing');

  // ── TEST 8: Assets cached ──
  console.log('\n── Cache tests ──');
  await visit('/#appletree-2026');
  await page.waitForSelector('.tab-bar', { timeout: 5000 });
  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(1000);

  const cachedSchedule = await hasCached(BASE + '/appletree-2026/schedule.md');
  if (cachedSchedule) ok('Schedule markdown cached');
  else fail('Schedule markdown cached');

  const cachedMap = await hasCached(BASE + '/appletree-2026/assets/at26_Lageplan.png');
  if (cachedMap) ok('Map image cached');
  else fail('Map image cached');

  const cachedNotif = await hasCached(BASE + '/appletree-2026/notifications.md');
  if (cachedNotif) ok('Notifications markdown cached');
  else fail('Notifications markdown cached');

  // ── TEST 9: Offline — listing page ──
  console.log('\n── Offline tests ──');
  await goOffline();
  ok('Switched to offline mode');

  await visit('/');
  const offlineTitle = await getText('h1');
  if (offlineTitle === 'Achja?!') ok('Listing page loads offline');
  else fail('Listing page loads offline', 'got: ' + offlineTitle);

  // ── TEST 10: Offline — schedule page ──
  await visit('/#appletree-2026');
  const offlineH2 = await getText('.md h2');
  if (offlineH2 && offlineH2.length > 0) ok('Schedule loads offline');
  else fail('Schedule loads offline');

  // ── TEST 11: Offline — locations tab ──
  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(500);
  const offlineMap = await isVisible('#mapImg');
  if (offlineMap) ok('Map loads offline');
  else fail('Map loads offline');

  // ── TEST 12: Offline — notifications tab ──
  await page.click('[data-tab="notifications"]');
  await page.waitForTimeout(500);
  const offlineNotif = await isVisible('.notif-md');
  if (offlineNotif) ok('Notifications load offline');
  else fail('Notifications load offline');

  // ── TEST 13: URL hash tab persistence ──
  await goOnline();
  await visit('/#appletree-2026:locations');
  await page.waitForSelector('.tab-bar', { timeout: 5000 });
  await page.waitForTimeout(500);
  const locActive = await page.evaluate(() =>
    document.querySelector('.tab-panel.tab-locations')?.classList.contains('active')
  );
  if (locActive) ok('URL hash persists tab (locations)');
  else fail('URL hash persists tab (locations)');

  // ── summary ──
  console.log('\n' + '─'.repeat(40));
  console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
  if (failed === 0) console.log('  ✅ All tests passed!');
  else console.log(`  ❌ ${failed} test(s) failed`);
  console.log('─'.repeat(40) + '\n');
}

// ── cleanup ──
async function cleanup() {
  if (page) await page.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill();
  process.exit(failed > 0 ? 1 : 0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

run().then(() => cleanup()).catch(err => {
  console.error('Test error:', err);
  cleanup();
});
