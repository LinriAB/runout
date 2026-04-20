// Mirrors the PWA files from the parent directory into ./www so Capacitor
// can sync them into the native projects. Run via `npm run copy:web`.
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..');
const dst = path.resolve(__dirname, 'www');

const include = ['index.html', 'sw.js', 'manifest.json', 'privacy.html', 'icon-192.png', 'icon-512.png'];

fs.mkdirSync(dst, { recursive: true });

for (const name of include) {
  const from = path.join(src, name);
  const to = path.join(dst, name);
  if (!fs.existsSync(from)) {
    console.warn(`skip: ${name} (not found)`);
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`copied: ${name}`);
}
