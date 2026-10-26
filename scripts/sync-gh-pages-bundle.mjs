import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');
const ghBundleDir = path.join(rootDir, 'public', 'gh-pages-bundle');
const distGhBundleDir = path.join(distDir, 'gh-pages-bundle');

try {
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const jsFile = files.find((f) => f.endsWith('.js'));
    const cssFile = files.find((f) => f.endsWith('.css'));

    fs.mkdirSync(ghBundleDir, { recursive: true });
    fs.mkdirSync(distGhBundleDir, { recursive: true });

    if (jsFile) {
      fs.copyFileSync(path.join(assetsDir, jsFile), path.join(ghBundleDir, 'app.js'));
      fs.copyFileSync(path.join(assetsDir, jsFile), path.join(distGhBundleDir, 'app.js'));
    }
    if (cssFile) {
      fs.copyFileSync(path.join(assetsDir, cssFile), path.join(ghBundleDir, 'app.css'));
      fs.copyFileSync(path.join(assetsDir, cssFile), path.join(distGhBundleDir, 'app.css'));
    }
  }

  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  }
  console.log('[sync-gh-pages-bundle] Successfully synced dist/ and public/gh-pages-bundle/');
} catch (err) {
  console.warn('[sync-gh-pages-bundle] Warning:', err.message);
}
