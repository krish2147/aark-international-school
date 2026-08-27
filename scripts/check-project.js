const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const failures = [];

function resolveInternalHref(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || /^(https?:|mailto:|tel:|data:|#|javascript:)/.test(clean)) return null;
  const decoded = decodeURIComponent(clean);
  if (decoded.startsWith('/api/')) return null;
  const relative = decoded.replace(/^\//, '');
  if (!relative) return 'index.html';
  if (path.extname(relative)) return relative;
  return `${relative}.html`;
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (/Horizon Gate/i.test(html)) failures.push(`${file}: legacy branding remains`);
  if (file !== 'admin.html' && !/<meta name="description"/.test(html)) failures.push(`${file}: missing meta description`);
  if (file !== 'admin.html' && !/<link rel="canonical"/.test(html)) failures.push(`${file}: missing canonical link`);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) failures.push(`${file}: expected one h1, found ${h1Count}`);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const target = resolveInternalHref(match[1]);
    if (target && !fs.existsSync(path.join(root, target))) failures.push(`${file}: broken link ${match[1]}`);
  }
}

const jsFiles = ['assets/js/main.js', 'assets/js/cms.js', 'assets/js/config.js'];
for (const file of jsFiles) {
  try { new Function(fs.readFileSync(path.join(root, file), 'utf8')); }
  catch (error) { failures.push(`${file}: JavaScript syntax error: ${error.message}`); }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Checked ${htmlFiles.length} HTML pages, internal links, SEO basics, branding, and shared JavaScript syntax.`);
