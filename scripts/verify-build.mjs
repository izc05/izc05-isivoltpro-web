import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve } from 'node:path';

const distDir = resolve('dist');
const configuredBase = process.env.PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS === 'true' ? '/izc05-isivoltpro-web' : '/');
const basePath = configuredBase === '/' ? '/' : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`;
const errors = [];
const indexableCanonicals = new Set();
let htmlCount = 0;
let checkedReferences = 0;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function stripBase(pathname) {
  if (basePath === '/') return pathname.replace(/^\/+/, '');
  if (pathname === basePath.slice(0, -1)) return '';
  if (pathname.startsWith(basePath)) return pathname.slice(basePath.length);
  return pathname.replace(/^\/+/, '');
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolvesInsideDist(rawReference, sourceFile) {
  const withoutFragment = rawReference.split('#')[0].split('?')[0];
  if (!withoutFragment) return true;

  let relativePath;
  if (withoutFragment.startsWith('/')) {
    relativePath = stripBase(withoutFragment);
  } else {
    const sourceDirectory = relative(distDir, resolve(sourceFile, '..'));
    relativePath = normalize(join(sourceDirectory, withoutFragment));
  }

  if (relativePath.startsWith('..')) return false;
  const candidate = resolve(distDir, relativePath);
  const extension = extname(candidate);
  const candidates = extension
    ? [candidate]
    : [candidate, `${candidate}.html`, join(candidate, 'index.html')];

  for (const item of candidates) {
    if (item.startsWith(distDir) && await exists(item)) return true;
  }
  return false;
}

function duplicateIds(html) {
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

function metaContent(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const direct = html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'));
  if (direct) return direct[1];
  const reversed = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escaped}["']`, 'i'));
  return reversed?.[1] ?? null;
}

const files = await walk(distDir);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  htmlCount += 1;
  const html = await readFile(file, 'utf8');
  const displayName = relative(distDir, file);

  if (/http:\/\//i.test(html)) errors.push(`${displayName}: contiene una URL http sin cifrar`);
  if (/<html(?![^>]*\slang=["']es["'])/i.test(html)) errors.push(`${displayName}: falta lang="es"`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${displayName}: falta title`);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) errors.push(`${displayName}: falta meta description`);

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  if (!canonicalMatch) {
    errors.push(`${displayName}: falta canonical`);
  } else {
    const canonical = canonicalMatch[1];
    if (!canonical.startsWith('https://')) errors.push(`${displayName}: canonical no usa HTTPS`);
    const robots = metaContent(html, 'robots') ?? '';
    if (!/\bnoindex\b/i.test(robots)) indexableCanonicals.add(canonical);
  }

  const twitterCard = metaContent(html, 'twitter:card');
  if (twitterCard === 'summary_large_image' && !/<meta[^>]+property=["']og:image["']/i.test(html)) {
    errors.push(`${displayName}: usa summary_large_image sin og:image`);
  }

  for (const id of duplicateIds(html)) errors.push(`${displayName}: id duplicado "${id}"`);

  const references = [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|data:|blob:|javascript:|#)/i.test(reference)) continue;
    checkedReferences += 1;
    if (!await resolvesInsideDist(reference, file)) {
      errors.push(`${displayName}: referencia interna no resuelta "${reference}"`);
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)target=["']_blank["']([^>]*)>/gi)) {
    const attributes = `${match[1]} ${match[2]}`;
    if (!/rel=["'][^"']*(?:noopener|noreferrer)/i.test(attributes)) {
      errors.push(`${displayName}: enlace target="_blank" sin rel="noopener"`);
    }
  }
}

const robotsPath = resolve(distDir, 'robots.txt');
const sitemapPath = resolve(distDir, 'sitemap.xml');
const securityPath = resolve(distDir, '.well-known', 'security.txt');

if (!await exists(robotsPath)) {
  errors.push('Falta dist/robots.txt');
} else {
  const robots = await readFile(robotsPath, 'utf8');
  if (!/^Sitemap:\s+https:\/\//im.test(robots)) errors.push('robots.txt no declara un sitemap HTTPS');
}

if (!await exists(sitemapPath)) {
  errors.push('Falta dist/sitemap.xml');
} else {
  const sitemap = await readFile(sitemapPath, 'utf8');
  if (!/<urlset\b/i.test(sitemap) || !/<loc>https:\/\//i.test(sitemap)) {
    errors.push('sitemap.xml no contiene URLs HTTPS válidas');
  } else {
    const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/gi)].map((match) => match[1]));
    for (const canonical of indexableCanonicals) {
      if (!sitemapUrls.has(canonical)) errors.push(`sitemap.xml no incluye canonical indexable: ${canonical}`);
    }
    for (const url of sitemapUrls) {
      if (!indexableCanonicals.has(url)) errors.push(`sitemap.xml incluye URL sin canonical indexable equivalente: ${url}`);
    }
  }
}

if (!await exists(securityPath)) {
  errors.push('Falta dist/.well-known/security.txt');
} else {
  const security = await readFile(securityPath, 'utf8');
  if (!/^Contact:\s+mailto:/im.test(security)) errors.push('security.txt no declara Contact por correo');
  if (!/^Canonical:\s+https:\/\//im.test(security)) errors.push('security.txt no declara Canonical HTTPS');
  if (!/^Policy:\s+https:\/\//im.test(security)) errors.push('security.txt no declara Policy HTTPS');
  const expires = security.match(/^Expires:\s+([^\r\n]+)/im)?.[1]?.trim();
  if (!expires) {
    errors.push('security.txt no declara Expires');
  } else {
    const expiryTime = Date.parse(expires);
    if (Number.isNaN(expiryTime)) errors.push('security.txt contiene una fecha Expires inválida');
    else if (expiryTime <= Date.now()) errors.push('security.txt está caducado');
  }
}

if (htmlCount === 0) errors.push('No se generaron archivos HTML en dist');

if (errors.length) {
  console.error(`\nVerificación fallida (${errors.length} incidencias):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Verificación correcta: ${htmlCount} páginas HTML, ${indexableCanonicals.size} canonicals indexables y ${checkedReferences} referencias internas revisadas.`);
