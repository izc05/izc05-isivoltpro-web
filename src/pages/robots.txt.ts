import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const origin = site ?? new URL('https://www.isivoltpro.com');
  const root = new URL(base, origin);
  const sitemap = new URL('sitemap.xml', root);

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap.toString()}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
