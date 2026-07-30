import { ecosystemAreas } from '../data/catalog';
import { resourceArticles } from '../data/resources';

const baseUrl = 'https://isivoltpro.com';

export function GET() {
  const paths = [
    '/',
    '/ecosistema',
    '/aplicaciones',
    '/recursos',
    '/contacto',
    ...ecosystemAreas.map((area) => `/aplicaciones/${area.slug}`),
    ...resourceArticles.map((article) => `/recursos/${article.slug}`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${baseUrl}${path}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}