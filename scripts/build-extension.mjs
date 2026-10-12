import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const extDir = path.join(rootDir, 'extension');

async function buildAndValidateExtension() {
  const entryPoint = path.join(extDir, 'sidepanel.entry.js');
  const outFile = path.join(extDir, 'sidepanel.js');

  await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'iife',
    target: ['es2022'],
    outfile: outFile,
    charset: 'utf8',
    banner: {
      js: '// Missed. — Extension Side Panel Bundle (Generated from extension/sidepanel.entry.js + @missed/engine via esbuild)',
    },
  });

  // Validate manifest.json
  const manifestPath = path.join(extDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.manifest_version !== 3) {
    throw new Error(`Invalid manifest_version: expected 3, got ${manifest.manifest_version}`);
  }
  const requiredPerms = ['sidePanel', 'activeTab', 'scripting'];
  for (const perm of requiredPerms) {
    if (!Array.isArray(manifest.permissions) || !manifest.permissions.includes(perm)) {
      throw new Error(`Missing required permission in manifest.json: ${perm}`);
    }
  }
  if (
    !Array.isArray(manifest.host_permissions) ||
    !manifest.host_permissions.includes('https://web.whatsapp.com/*')
  ) {
    throw new Error('Missing https://web.whatsapp.com/* in manifest.json host_permissions');
  }
  if (manifest.side_panel?.default_path !== 'sidepanel.html') {
    throw new Error('Invalid side_panel.default_path in manifest.json');
  }

  // Confirm all expected unpacked extension files exist and are non-empty
  const expectedFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'sidepanel.html',
    'sidepanel.css',
    'sidepanel.js',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png',
  ];

  for (const rel of expectedFiles) {
    const fullPath = path.join(extDir, rel);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required extension file: extension/${rel}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      throw new Error(`Extension file is empty (0 bytes): extension/${rel}`);
    }
  }

  console.log('✓ Bundled extension/sidepanel.js from @missed/engine via esbuild');
  console.log('✓ Validated extension/manifest.json (MV3, permissions, host_permissions, side_panel)');
  console.log(`✓ Verified all ${expectedFiles.length} unpacked extension files exist and are non-empty`);
}

buildAndValidateExtension().catch((err) => {
  console.error('Extension build failed:', err);
  process.exit(1);
});

