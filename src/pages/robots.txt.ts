const baseUrl = process.env.GITHUB_ACTIONS === 'true'
  ? 'https://izc05.github.io/izc05-isivoltpro-web'
  : 'https://isivoltpro.com';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
