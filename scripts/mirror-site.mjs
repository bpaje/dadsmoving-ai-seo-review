import fs from 'node:fs/promises';
import path from 'node:path';

const origin = new URL('https://dadsmoving.com/');
const root = process.cwd();
const pagePaths = [
  '/', '/local-moves/', '/international-moves/', '/storage-solutions/',
  '/why-choose-us/', '/case-study/', '/giving-back/', '/pet-relocation/',
  '/u-box/', '/officemoves/', '/get-a-quote/', '/contact-us/', '/thank-you/',
  '/the-perfect-weekend-in-baguio/',
  '/exploring-manila-the-top-5-must-do-activities/',
  '/top-drivable-beach-locations-from-manila/'
];

const queue = [];
const seen = new Set();
const pageSet = new Set(pagePaths);

function cleanPathname(url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (!path.posix.extname(pathname)) pathname += '/index.html';
  return pathname.replace(/^\/+/, '');
}

function destination(url) {
  return path.join(root, ...cleanPathname(url).split('/'));
}

function localReference(fromUrl, targetUrl) {
  const from = destination(fromUrl);
  const to = destination(targetUrl);
  let relative = path.relative(path.dirname(from), to).replaceAll('\\', '/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative + (targetUrl.hash || '');
}

function normalize(raw, base) {
  try {
    const url = new URL(raw, base);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function shouldMirror(url) {
  return url.hostname === origin.hostname && !url.pathname.startsWith('/wp-json/');
}

function enqueue(url) {
  url.search = '';
  const key = url.href;
  if (!seen.has(key)) {
    seen.add(key);
    queue.push(url);
  }
}

function rewriteHtml(html, pageUrl) {
  return html.replace(/\b(src|href|poster|action)=(['"])([^'"#]+)(\2)/gi, (all, attr, quote, raw) => {
    const target = normalize(raw, pageUrl);
    if (!target || !shouldMirror(target)) return all;
    if (attr.toLowerCase() !== 'action') enqueue(target);
    return `${attr}=${quote}${localReference(pageUrl, target)}${quote}`;
  }).replace(/\bsrcset=(['"])(.*?)\1/gi, (all, quote, value) => {
    const rewritten = value.split(',').map(item => {
      const [raw, size = ''] = item.trim().split(/\s+/, 2);
      const target = normalize(raw, pageUrl);
      if (!target || !shouldMirror(target)) return item.trim();
      enqueue(target);
      return `${localReference(pageUrl, target)}${size ? ` ${size}` : ''}`;
    }).join(', ');
    return `srcset=${quote}${rewritten}${quote}`;
  });
}

function rewriteCss(css, cssUrl) {
  return css.replace(/url\((['"]?)([^)'"\s]+)\1\)/gi, (all, quote, raw) => {
    if (raw.startsWith('data:')) return all;
    const target = normalize(raw, cssUrl);
    if (!target || !shouldMirror(target)) return all;
    enqueue(target);
    return `url(${quote}${localReference(cssUrl, target)}${quote})`;
  }).replace(/@import\s+(?:url\()?(['"])([^'"]+)\1\)?/gi, (all, quote, raw) => {
    const target = normalize(raw, cssUrl);
    if (!target || !shouldMirror(target)) return all;
    enqueue(target);
    return `@import ${quote}${localReference(cssUrl, target)}${quote}`;
  });
}

async function fetchOne(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'DadsmovingStaticReviewMirror/1.0' } });
  if (!response.ok) {
    console.warn(`SKIP ${response.status} ${url.href}`);
    return;
  }
  const finalUrl = new URL(response.url);
  const contentType = response.headers.get('content-type') || '';
  const out = destination(url);
  await fs.mkdir(path.dirname(out), { recursive: true });
  if (contentType.includes('text/html')) {
    const html = rewriteHtml(await response.text(), finalUrl);
    await fs.writeFile(out, html, 'utf8');
  } else if (contentType.includes('text/css') || url.pathname.endsWith('.css')) {
    const css = rewriteCss(await response.text(), finalUrl);
    await fs.writeFile(out, css, 'utf8');
  } else {
    await fs.writeFile(out, Buffer.from(await response.arrayBuffer()));
  }
  console.log(`MIRRORED ${url.pathname}`);
}

for (const pathname of pagePaths) enqueue(new URL(pathname, origin));

for (let cursor = 0; cursor < queue.length; cursor += 1) {
  await fetchOne(queue[cursor]);
}

const missing = [];
for (const pathname of pagePaths) {
  try { await fs.access(destination(new URL(pathname, origin))); }
  catch { missing.push(pathname); }
}
if (missing.length) throw new Error(`Missing mirrored pages: ${missing.join(', ')}`);
console.log(`DONE pages=${pageSet.size} resources=${seen.size - pageSet.size}`);
