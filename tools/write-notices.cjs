'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const rows = [];
const texts = [];
for (const [location, meta] of Object.entries(lock.packages)) {
  if (!location || meta.dev) continue;
  const dir = path.join(root, location);
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const license = typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? pkg.licenses ?? 'See bundled package notice');
  const files = fs.readdirSync(dir).filter(n => /^(license|licence|copying|notice)([.-]|$)/i.test(n) && fs.statSync(path.join(dir,n)).isFile());
  rows.push(`| ${pkg.name} | ${pkg.version} | ${license.replace(/\|/g,'/')} | ${files.join(', ') || 'Package metadata'} |`);
  for (const file of files) texts.push(`\n===== ${pkg.name}@${pkg.version}: ${file} =====\n${fs.readFileSync(path.join(dir,file),'utf8')}`);
}
const heading = `---\nstatus: active\nsuperseded_by: null\n---\n\n# Third-party notices\n\nZuri is based on Munder Difflin, MIT, Copyright (c) 2026 Chaitanya Giri. See LICENSE and UPSTREAM.md.\n\nThe active Zuri office atlas/map and geometric app icons are original. Procedural avatar code retains upstream MIT. Historical LimeZu attribution is preserved in source; restricted art is excluded from the app. Bundled fonts retain their SIL Open Font License in src/renderer/src/assets/fonts/LICENSE.txt. Electron/Chromium notices ship with the Electron runtime (LICENSE.electron.txt and LICENSES.chromium.html in the distribution).\n\nProduction dependency inventory below was generated from installed packages in the locked production graph. Full available notices are in THIRD_PARTY_LICENSES.txt and individual packaged dependencies. Optional packages absent on this platform are excluded from this installed inventory; regenerate on another platform.\n\n| Package | Version | Declared license | Notice files |\n|---|---|---|---|\n`;
fs.writeFileSync(path.join(root,'THIRD_PARTY_NOTICES.md'),heading+rows.sort().join('\n')+'\n');
texts.push('\n===== Bundled fonts =====\n'+fs.readFileSync(path.join(root,'src/renderer/src/assets/fonts/LICENSE.txt'),'utf8'));
fs.writeFileSync(path.join(root,'THIRD_PARTY_LICENSES.txt'),texts.join('\n'));
console.log(`Recorded ${rows.length} installed production dependencies`);
