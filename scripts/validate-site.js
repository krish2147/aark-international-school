const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pages = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const errors = [];
const legacyPatterns = [
  /SCHOOL · DEMO WEBSITE/i, /ark-school\.example/i, /horizon-gate-school/i,
  /42 Meridian Hill/i, /90000 00000/, /picsum\.photos/i, /AAARK/,
  /Template notice/i, /"postalCode": "380015"/,
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${page}: missing title`);
  if (page !== 'admin.html' && !/<meta name="description"/.test(html)) errors.push(`${page}: missing description`);
  if (page !== 'admin.html' && !/<main(?:\s|>)/.test(html)) errors.push(`${page}: missing main landmark`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${page}: duplicate ids: ${[...new Set(duplicateIds)].join(', ')}`);
  for (const pattern of legacyPatterns) if (pattern.test(html)) errors.push(`${page}: contains legacy/demo content (${pattern})`);
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(ref) || ref.includes('${')) continue;
    if (!fs.existsSync(path.join(root, ref))) errors.push(`${page}: missing local reference ${ref}`);
  }
}

for (const file of ['robots.txt', 'sitemap.xml', 'vercel.json', '.env.example']) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${pages.length} HTML pages and production configuration.`);
