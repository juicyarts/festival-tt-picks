// Take a screenshot of the nearest supermarket for offline use
// Run: node scripts/screenshot-map.js

const { chromium } = require('playwright');

const FESTIVAL = { lat: 52.60528, lon: 8.38817, name: 'Festival' };

// nearest supermarkets, sorted by proximity
const MARKETS = [
  { name: 'Netto', lat: 52.60728, lon: 8.37954, addr: 'Grafenstraße 23' },
  { name: 'ALDI', lat: 52.60815, lon: 8.36658, addr: 'Mollerstraße 20' },
  { name: 'Combi', lat: 52.60653, lon: 8.36606, addr: 'Flöthestraße 43' },
];

// center between festival and closest market (ALDI)
const CENTER = {
  lat: (FESTIVAL.lat + MARKETS[0].lat) / 2,
  lon: (FESTIVAL.lon + MARKETS[0].lon) / 2,
};

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
const map = L.map('map', { zoomControl: true, attributionControl: false })
  .setView([${CENTER.lat}, ${CENTER.lon}], 16);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// festival marker
L.marker([${FESTIVAL.lat}, ${FESTIVAL.lon}])
  .bindPopup('🎪 Festival')
  .addTo(map)
  .openPopup();

// supermarket markers
const markets = ${JSON.stringify(MARKETS)};
markets.forEach(m => {
  L.marker([m.lat, m.lon])
    .bindPopup('🛒 ' + m.name + '<br>' + m.addr)
    .addTo(map);
});

// route line from festival to nearest supermarket (ALDI)
L.polyline([
  [${FESTIVAL.lat}, ${FESTIVAL.lon}],
  [${MARKETS[0].lat}, ${MARKETS[0].lon}]
], {
  color: '#e94560', weight: 4, opacity: 0.8,
  dashArray: '10 6'
}).addTo(map);
<\/script>
</body></html>`;

  await page.setContent(html);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'appletree-2026/assets/supermarket-map.png' });
  console.log('✓ Saved appletree-2026/assets/supermarket-map.png (zoomed to nearest)');
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
