import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve } from 'node:path';

const distDir = resolve('dist');
const configuredBase = process.env.PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS === 'true' ? '/izc05-isivoltpro-web' : '/');
const basePath = configuredBase === '/' ? '/' : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`;
const errors = [];
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
  if (basePath === '/') return pathname.replace(/^\//, '');
  if (pathname === basePath.slice(0, -1)) return '';
  if (pathname.startsWith(basePath)) return pathname.slice(basePath.length);
  return null;
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
    if (relativePath === null) return false;
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

const files = await walk(distDir);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  htmlCount += 1;
  const html = await readFile(file, 'utf8');
  const displayName = relative(distDir, file);

  if (/http:\/\//i.test(html)) errors.push(`${displayName}: contiene una URL http sin cifrar`);
  if (/<html(?![^>]*\slang=["']es["'])/i.test(html)) errors.push(`${displayName}: falta lang="es"`);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) errors.push(`${displayName}: falta meta description`);
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) errors.push(`${displayName}: falta canonical`);

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

if (htmlCount === 0) errors.push('No se generaron archivos HTML en dist');

if (errors.length) {
  console.error(`\nVerificación fallida (${errors.length} incidencias):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Verificación correcta: ${htmlCount} páginas HTML y ${checkedReferences} referencias internas revisadas.`);
