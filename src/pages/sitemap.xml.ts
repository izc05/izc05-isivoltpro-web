import type { APIRoute } from 'astro';
import { ecosystemAreas } from '../data/catalog';
import { resourceArticles } from '../data/resources';

export const prerender = true;

const staticPaths = [
  '/',
  '/ecosistema',
  '/mantenimiento',
  '/aplicaciones',
  '/recursos',
  '/infraestructura',
  '/sobre-isivoltpro',
  '/contacto',
  '/aviso-legal',
  '/privacidad',
  '/cookies'
];

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const origin = site ?? new URL('https://www.isivoltpro.com');
  const root = new URL(base, origin);
  const paths = [
    ...staticPaths,
    ...ecosystemAreas.map((area) => `/aplicaciones/${area.slug}`),
    ...resourceArticles.map((article) => `/recursos/${article.slug}`)
  ];

  const urls = [...new Set(paths)].map((path) => {
    const relative = path === '/' ? '' : `${path.replace(/^\/+|\/+$/g, '')}/`;
    return `  <url><loc>${escapeXml(new URL(relative, root).toString())}</loc></url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
