// PWA test for deployed GitHub Pages site
// Run: BASE_URL=https://juicyarts.github.io/festival-tt-picks node test/deployed.test.js

const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'https://juicyarts.github.io/festival-tt-picks';
let browser, context, page;
let passed = 0;
let failed = 0;

function ok(label) { passed++; console.log(`  ✓ ${label}`); }
function fail(label, detail) { failed++; console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`); }
function info(label) { console.log(`  ℹ ${label}`); }

async function visit(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
}

// ── debug: dump SW + cache state ──
async function debugSW() {
  const state = await page.evaluate(() => {
    const reg = navigator.serviceWorker;
    const result = {
      hasSW: !!reg,
      hasController: !!reg?.controller,
      controllerState: reg?.controller?.state || 'none',
    };

    // try to get registration
    return result;
  });

  // also try getting registration via getRegistration
  const regInfo = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return { registered: false };
      return {
        registered: true,
        scope: reg.scope,
        active: reg.active?.state || 'none',
        waiting: reg.waiting?.state || 'none',
        installing: reg.installing?.state || 'none',
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('  ℹ SW API:', JSON.stringify(state));
  console.log('  ℹ SW Registration:', JSON.stringify(regInfo));
}

async function debugCaches() {
  const cacheInfo = await page.evaluate(async () => {
    const keys = await caches.keys();
    const result = {};
    for (const key of keys) {
      const cache = await caches.open(key);
      const urls = (await cache.keys()).map(r => r.url);
      result[key] = {
        count: urls.length,
        sample: urls.slice(0, 5),
        all: urls,
      };
    }
    return result;
  });
  console.log('  ℹ Caches:', JSON.stringify(cacheInfo, null, 2));
}

async function hasCached(url) {
  return page.evaluate(u =>
    caches.open('festival-picks-v2').then(c => c.match(u).then(r => !!r)),
    url
  );
}

// find a cached URL matching a pattern
async function findCached(pattern) {
  return page.evaluate(async (p) => {
    const keys = await caches.keys();
    for (const key of keys) {
      const cache = await caches.open(key);
      const urls = (await cache.keys()).map(r => r.url);
      const match = urls.find(u => u.includes(p));
      if (match) return match;
    }
    return null;
  }, pattern);
}

async function getText(sel) { return page.textContent(sel).catch(() => ''); }
async function isVisible(sel) { return page.isVisible(sel).catch(() => false); }

async function run() {
  console.log('\n📴 PWA Deploy Test — ' + BASE + '\n');

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();

  // collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // ── Visit listing and wait ──
  console.log('── Online ──');
  info('Visiting ' + BASE + '/');
  await visit('/');

  const title = await getText('h1');
  if (title === 'Achja?!') ok('Listing page loads');
  else fail('Listing page loads', 'got: ' + title);

  const cards = await page.$$('.card');
  if (cards.length > 0) ok('Festival cards render');
  else fail('Festival cards render');

  // give SW time to install/activate
  info('Waiting for SW to install…');
  await new Promise(r => setTimeout(r, 2000));

  // reload so controller takes over (clients.claim needs a tick)
  info('Reloading for SW controller…');
  await page.reload({ waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 1000));

  await debugSW();
  await debugCaches();

  if (consoleErrors.length > 0) {
    info('Console errors: ' + JSON.stringify(consoleErrors.slice(0, 5)));
  }

  // Check SW via getRegistration
  const regOk = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!(reg && reg.active);
    } catch (e) { return false; }
  });
  if (regOk) ok('Service worker registered and active');
  else fail('Service worker registered');

  // ── Navigate to festival ──
  info('Navigating to festival page…');
  await page.click('.card');
  await page.waitForSelector('.tab-bar', { timeout: 8000 });

  const pageTitle = await getText('#pageTitle');
  if (pageTitle.includes('Appletree')) ok('Schedule page loads');
  else fail('Schedule page loads', 'got: ' + pageTitle);

  if (await isVisible('.md h2')) ok('Artists tab shows schedule');
  else fail('Artists tab shows schedule');

  // ── Visit all tabs to trigger caching ──
  await page.click('[data-tab="locations"]');
  await page.waitForTimeout(1000);
  if (await isVisible('#mapImg')) ok('Locations tab shows map');
  else fail('Locations tab shows map');

  await page.click('[data-tab="notifications"]');
  await page.waitForTimeout(1000);
  if (await isVisible('.notif-md')) ok('Notifications tab shows content');
  else fail('Notifications tab shows content');

  // go back to artists to trigger schedule.md fetch
  await page.click('[data-tab="artists"]');
  await page.waitForTimeout(500);

  // ── Cache diagnostics ──
  console.log('── Cache ──');
  await debugCaches();

  // Find cached URLs by content pattern (more reliable than exact URL)
  const scheduleHit = await findCached('schedule.md');
  if (scheduleHit) ok('Schedule cached', 'at ' + scheduleHit);
  else fail('Schedule cached');

  const mapHit = await findCached('Lageplan');
  if (mapHit) ok('Map image cached', 'at ' + mapHit);
  else fail('Map image cached');

  const notifHit = await findCached('notifications.md');
  if (notifHit) ok('Notifications cached', 'at ' + notifHit);
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
