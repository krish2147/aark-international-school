#!/usr/bin/env node
// Replaces stock photo URLs across the site with real AARK photography.
//
// Usage:
//   1. Open assets/photo-manifest.json
//   2. For each entry, fill in "replacement_url_or_path" with either:
//        - a hosted URL (e.g. an uploaded photo on the school's CDN), or
//        - a local path under assets/photos/ (e.g. "assets/photos/campus-gate.jpg")
//   3. Run: node scripts/swap-photos.js
//
// Entries left with an empty "replacement_url_or_path" are skipped, so this
// script is safe to run repeatedly as photos come in.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'assets', 'photo-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let totalReplacements = 0;

for (const entry of manifest) {
  const replacement = (entry.replacement_url_or_path || '').trim();
  if (!replacement) continue;

  for (const file of entry.used_in_files) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping missing file: ${file}`);
      continue;
    }
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = original.split(entry.current_stock_url).join(replacement);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated);
      const count = original.split(entry.current_stock_url).length - 1;
      totalReplacements += count;
      console.log(`${file}: replaced ${count} occurrence(s) of "${entry.id}"`);
    }
  }
}

console.log(`\nDone. ${totalReplacements} total replacement(s) made.`);
if (totalReplacements === 0) {
  console.log('Nothing to do — fill in "replacement_url_or_path" fields in assets/photo-manifest.json first.');
}
