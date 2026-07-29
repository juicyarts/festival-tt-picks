// Take a screenshot of a supermarket map for offline use
// Run: node scripts/screenshot-map.js

const { chromium } = require('playwright');

const FESTIVAL = { lat: 52.607, lon: 8.371 };

const MARKETS = [
  { name: 'ALDI', lat: 52.60815, lon: 8.36658 },
  { name: 'Combi', lat: 52.60653, lon: 8.36606 },
  { name: 'Lidl', lat: 52.60710, lon: 8.36246 },
  { name: 'E-Center', lat: 52.61471, lon: 8.36443 },
  { name: 'Netto', lat: 52.60728, lon: 8.37954 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 700 } });

  // Build a simple HTML page with Leaflet map + markers
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css" />
<style>body{margin:0}#map{width:800px;height:700px}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>
<script>
const map = L.map('map', { zoomControl: true, attributionControl: false })
  .setView([${FESTIVAL.lat}, ${FESTIVAL.lon}], 14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// festival marker (star)
L.marker([${FESTIVAL.lat}, ${FESTIVAL.lon}])
  .bindPopup('🎪 Festival')
  .addTo(map)
  .openPopup();

// supermarket markers
const markets = ${JSON.stringify(MARKETS)};
markets.forEach(m => {
  L.marker([m.lat, m.lon])
    .bindPopup('🛒 ' + m.name)
    .addTo(map);
});
<\/script>
</body></html>`;

  await page.setContent(html);
  await page.waitForTimeout(2000); // let tiles load
  await page.screenshot({ path: 'appletree-2026/assets/supermarket-map.png' });
  console.log('✓ Saved appletree-2026/assets/supermarket-map.png');
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
