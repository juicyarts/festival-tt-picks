// Generate a festival grounds overview map from OpenStreetMap
// Usage: node scripts/screenshot-lageplan.js <festival-slug>
// Example: node scripts/screenshot-lageplan.js hoflaerm-2026

const { chromium } = require('playwright');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/screenshot-lageplan.js <festival-slug>'); process.exit(1); }

// Festival location configs
const FESTIVALS = {
  'hoflaerm-2026': {
    lat: 50.7430, lon: 7.6970, name: 'Hoflärm Open Air',
    zoom: 16, radius: 300,
  },
  'appletree-2026': {
    lat: 52.60528, lon: 8.38817, name: 'Appletree Garden',
    zoom: 16, radius: 300,
  },
};

const cfg = FESTIVALS[slug];
if (!cfg) { console.error('Unknown festival: ' + slug); process.exit(1); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 650 } });

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css" />
<style>body{margin:0}#map{width:800px;height:650px}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>
<script>
const map = L.map('map', { zoomControl: false, attributionControl: false })
  .setView([${cfg.lat}, ${cfg.lon}], ${cfg.zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// festival marker
L.marker([${cfg.lat}, ${cfg.lon}])
  .bindPopup('🎪 ${cfg.name}')
  .addTo(map)
  .openPopup();

// radius circle
L.circle([${cfg.lat}, ${cfg.lon}], {
  radius: ${cfg.radius},
  color: '#e94560',
  fillColor: '#e94560',
  fillOpacity: 0.1,
  weight: 2,
  dashArray: '6 4'
}).addTo(map);
<\/script>
</body></html>`;

  await page.setContent(html);
  await page.waitForTimeout(2500);
  const outPath = slug + '/assets/lageplan.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Saved ' + outPath);
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
