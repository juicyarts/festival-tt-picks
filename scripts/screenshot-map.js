// Generate a supermarket/location overview map for a festival
// Usage: node scripts/screenshot-map.js <festival-slug>
// Example: node scripts/screenshot-map.js appletree-2026

const { chromium } = require('playwright');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/screenshot-map.js <festival-slug>'); process.exit(1); }

// Festival configurations
const FESTIVALS = {
  'appletree-2026': {
    festival: { lat: 52.60528, lon: 8.38817, name: 'Appletree Garden' },
    zoom: 16,
    markets: [
      { name: 'famila', lat: 52.60595, lon: 8.38344, addr: 'Groweg 50' },
      { name: 'Netto', lat: 52.60728, lon: 8.37954, addr: 'Grafenstraße 23' },
      { name: 'ALDI', lat: 52.60815, lon: 8.36658, addr: 'Mollerstraße 20' },
    ],
  },
  'hoflaerm-2026': {
    festival: { lat: 50.7430, lon: 7.6970, name: 'Hoflärm Open Air' },
    zoom: 15,
    markets: [
      { name: 'REWE', lat: 50.7387, lon: 7.6728, addr: 'Marktzentrum 7' },
    ],
  },
};

const cfg = FESTIVALS[slug];
if (!cfg) { console.error('Unknown festival: ' + slug); process.exit(1); }

const F = cfg.festival;
const CENTER = {
  lat: (F.lat + cfg.markets[0].lat) / 2,
  lon: (F.lon + cfg.markets[0].lon) / 2,
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
  .setView([${CENTER.lat}, ${CENTER.lon}], ${cfg.zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

// festival marker
L.marker([${F.lat}, ${F.lon}])
  .bindPopup('🎪 ${F.name}')
  .addTo(map)
  .openPopup();

// market markers
const markets = ${JSON.stringify(cfg.markets)};
markets.forEach(m => {
  L.marker([m.lat, m.lon])
    .bindPopup('🛒 ' + m.name + '<br>' + m.addr)
    .addTo(map);
});

// route line
L.polyline([
  [${F.lat}, ${F.lon}],
  [${cfg.markets[0].lat}, ${cfg.markets[0].lon}]
], {
  color: '#e94560', weight: 4, opacity: 0.8,
  dashArray: '10 6'
}).addTo(map);
<\/script>
</body></html>`;

  await page.setContent(html);
  await page.waitForTimeout(2500);
  const outPath = slug + '/assets/supermarket-map.png';
  await page.screenshot({ path: outPath });
  console.log('✓ Saved ' + outPath);
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
