#!/usr/bin/env node
/**
 * scripts/restore-version-placeholder.js
 *
 * Restores the __BUILD_VERSION__ placeholder in public/sw.js and
 * public/manifest.webmanifest after `astro build` has copied them into
 * dist/. Keeps the working tree clean so a `git status` after `npm run
 * build` shows no spurious changes.
 *
 * Idempotent: if the placeholder is already present (e.g. someone ran this
 * twice, or the build failed before inject-version ran), it's a no-op.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PLACEHOLDER } from './inject-version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const manifestPath = resolve(root, 'public/manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.version !== PLACEHOLDER) {
  manifest.version = PLACEHOLDER;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[restore-version-placeholder] manifest.webmanifest → ${PLACEHOLDER}`);
}

const manifestJsonPath = resolve(root, 'public/manifest.json');
if (existsSync(manifestJsonPath)) {
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, 'utf8'));
  if (manifestJson.version !== PLACEHOLDER) {
    manifestJson.version = PLACEHOLDER;
    writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
    console.log(`[restore-version-placeholder] manifest.json → ${PLACEHOLDER}`);
  }
}

const swPath = resolve(root, 'public/sw.js');
const sw = readFileSync(swPath, 'utf8');
const swRestored = sw.replace(/^const VERSION = .*$/m, `const VERSION = '${PLACEHOLDER}';`);
if (swRestored !== sw) {
  writeFileSync(swPath, swRestored);
  console.log(`[restore-version-placeholder] sw.js → ${PLACEHOLDER}`);
}
