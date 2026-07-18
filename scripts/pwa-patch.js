/**
 * Post-procesa el export web (dist/) para dejarlo listo como PWA en iPhone:
 * título, metadatos apple-mobile-web-app, manifest e íconos.
 * Se ejecuta con: node scripts/pwa-patch.js  (después de `expo export -p web`)
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const assets = path.join(__dirname, '..', 'assets');

// Prefijo de ruta (p. ej. "/teleprompter" en GitHub Pages), leído de app.json.
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
const BASE = (appJson.expo.experiments && appJson.expo.experiments.baseUrl) || '';

if (!fs.existsSync(dist)) {
  console.error('No existe dist/. Corre primero: npx expo export -p web');
  process.exit(1);
}

// 1. Íconos PWA
fs.copyFileSync(path.join(assets, 'pwa-icon-180.png'), path.join(dist, 'icon-180.png'));
fs.copyFileSync(path.join(assets, 'pwa-icon-512.png'), path.join(dist, 'icon-512.png'));

// 2. Manifest
const manifest = {
  name: 'Teleprompter',
  short_name: 'Teleprompter',
  start_url: `${BASE}/`,
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#000000',
  icons: [{ src: `${BASE}/icon-512.png`, sizes: '512x512', type: 'image/png' }],
};
fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 3. index.html
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, '<title>Teleprompter</title>');
const extra = [
  '<meta name="theme-color" content="#000000">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Teleprompter">',
  `<link rel="manifest" href="${BASE}/manifest.json">`,
  `<link rel="apple-touch-icon" href="${BASE}/icon-180.png">`,
  '<style>html,body{background:#000;overscroll-behavior:none}</style>',
].join('');
html = html.replace('</head>', extra + '</head>');
fs.writeFileSync(indexPath, html);

console.log('PWA patch aplicado a dist/');
