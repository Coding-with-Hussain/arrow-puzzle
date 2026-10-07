import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Absolute site URL for canonical / Open Graph tags. Set SITE_URL for custom
 * domains and GitHub Pages; Vercel and Netlify are detected automatically.
 */
function resolveSiteUrl(env) {
  const url =
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    env.URL ||
    '';
  return url.replace(/\/+$/, '');
}

function siteMeta(siteUrl) {
  return {
    name: 'arrow-escape-site-meta',
    transformIndexHtml(html) {
      // Without a known domain, fall back to page-relative URLs and drop og:url.
      const withUrls = html.replaceAll('__SITE_URL__/', siteUrl ? `${siteUrl}/` : './');
      return siteUrl ? withUrls : withUrls.replace(/\s*<meta property="og:url"[^>]*>/, '');
    },
  };
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Emits sw.js with a precache list of every built file, versioned by their content. */
function serviceWorker() {
  let publicDir;
  const skip = (file) => file.endsWith('.map') || file === 'og-image.png' || file === 'robots.txt';

  return {
    name: 'arrow-escape-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_, bundle) {
      const hash = createHash('sha256');
      const files = [];

      for (const [fileName, output] of Object.entries(bundle)) {
        if (skip(fileName)) continue;
        files.push(fileName);
        hash.update(fileName).update(output.type === 'chunk' ? output.code : output.source);
      }
      for (const path of listFiles(publicDir)) {
        const fileName = relative(publicDir, path).split('\\').join('/');
        if (skip(fileName)) continue;
        files.push(fileName);
        hash.update(fileName).update(readFileSync(path));
      }

      const urls = ['./', ...files.sort().map((file) => `./${file}`)];
      const template = readFileSync(new URL('./pwa/service-worker.js', import.meta.url), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 12))
          .replace('__PRECACHE_URLS__', JSON.stringify(urls, null, 2)),
      });
    },
  };
}

export default defineConfig({
  // Relative base works at a domain root and in a sub-folder (e.g. GitHub Pages).
  base: './',
  plugins: [react(), siteMeta(resolveSiteUrl(process.env)), serviceWorker()],
  build: {
    target: 'es2020',
  },
});
