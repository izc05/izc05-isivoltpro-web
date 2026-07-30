import { defineConfig } from 'astro/config';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: isGitHubPages ? 'https://izc05.github.io' : 'https://isivoltpro.com',
  base: isGitHubPages ? '/izc05-isivoltpro-web' : '/',
  output: 'static',
});
