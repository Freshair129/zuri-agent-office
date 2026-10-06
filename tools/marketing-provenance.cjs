'use strict';
// Run after an explicitly approved, pinned skill import. Never fetches or executes skills.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseSkillFrontmatter } = require('../test/load-ts.cjs')('src/main/skills.ts');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'resources/marketing-skills');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = {};
function walk(base, prefix = '') {
  for (const entry of fs.readdirSync(base, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const rel = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Symlink in bundle: ' + rel);
    if (entry.isDirectory()) walk(path.join(base, entry.name), rel + '/');
    else files[rel] = sha(fs.readFileSync(path.join(base, entry.name)));
  }
}
walk(path.join(dir, 'skills'), 'skills/');
files.LICENSE = sha(fs.readFileSync(path.join(dir, 'LICENSE')));
const skills = fs.readdirSync(path.join(dir, 'skills')).sort().map(name => {
  const md = fs.readFileSync(path.join(dir, 'skills', name, 'SKILL.md'), 'utf8');
  const fm = parseSkillFrontmatter(md);
  const version = /^\s+version:\s*["']?([\d.]+)/m.exec(md)?.[1];
  if (fm.name !== name || !fm.description || !version) throw new Error('Invalid metadata: ' + name);
  return { id: 'marketing:' + name, name, description: fm.description, version };
});
if (skills.length !== 50) throw new Error('Expected 50 pinned skills');
const catalog = { repository: 'https://github.com/coreyhaines31/marketingskills', commit: 'dda3841f0b294e01e93b1541486beefbfab0915e', version: '2.11.17', skills };
for (const [file, data] of [['src/shared/marketingCatalog.json', catalog], ['resources/marketing-skills/origin.json', { ...catalog, files }]]) {
  const output = JSON.stringify(data, null, 2) + '\n';
  if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, file), output);
  else if (fs.readFileSync(path.join(root, file), 'utf8') !== output) throw new Error('Provenance mismatch: ' + file);
}
console.log(JSON.stringify({ skills: skills.length, hashedFiles: Object.keys(files).length, mode: process.argv.includes('--write') ? 'write' : 'verify' }));
