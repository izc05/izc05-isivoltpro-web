import { defineConfig } from 'astro/config';

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const defaultSite = isGitHubActions ? 'https://izc05.github.io' : 'https://www.isivoltpro.com';
const defaultBase = isGitHubActions ? '/izc05-isivoltpro-web' : '/';
const site = process.env.PUBLIC_SITE_URL || defaultSite;
const configuredBase = process.env.PUBLIC_BASE_PATH || defaultBase;
const base = configuredBase === '/' ? '/' : `/${configuredBase.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
  site,
  base,
  output: 'static',
  build: {
    assets: 'assets'
  }
});
