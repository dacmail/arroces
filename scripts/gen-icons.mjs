// =============================================================================
// gen-icons.mjs — Genera los iconos PWA (PNG) y el favicon (SVG) desde un SVG
// de una paella vista desde arriba. Requiere `sharp` (devDependency).
//   node scripts/gen-icons.mjs
// =============================================================================

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const iconsDir = join(pub, 'icons');

// SVG de la paella. `pad` deja margen para iconos maskable (zona segura).
function paellaSVG(size, pad = 0) {
  const s = size;
  const c = s / 2;
  const r = (s / 2) * (1 - pad);
  const handle = r * 0.26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="rice" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#ffd874"/>
      <stop offset="70%" stop-color="#f0a838"/>
      <stop offset="100%" stop-color="#e07d1c"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="#fff7e6"/>
  <!-- asas -->
  <circle cx="${c - r - handle * 0.2}" cy="${c}" r="${handle}" fill="none" stroke="#3a2e22" stroke-width="${r * 0.07}"/>
  <circle cx="${c + r + handle * 0.2}" cy="${c}" r="${handle}" fill="none" stroke="#3a2e22" stroke-width="${r * 0.07}"/>
  <!-- borde de la paella -->
  <circle cx="${c}" cy="${c}" r="${r}" fill="#2f2a24"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.9}" fill="url(#rice)"/>
  <!-- tiras de pimiento rojo -->
  <g fill="#c4452a">
    <rect x="${c - r * 0.55}" y="${c - r * 0.1}" width="${r * 0.5}" height="${r * 0.12}" rx="${r * 0.06}" transform="rotate(-18 ${c} ${c})"/>
    <rect x="${c + r * 0.06}" y="${c - r * 0.42}" width="${r * 0.5}" height="${r * 0.12}" rx="${r * 0.06}" transform="rotate(22 ${c} ${c})"/>
  </g>
  <!-- gajos de limón -->
  <g fill="#ffe066" stroke="#e6b800" stroke-width="${r * 0.02}">
    <circle cx="${c + r * 0.42}" cy="${c + r * 0.42}" r="${r * 0.16}"/>
    <circle cx="${c - r * 0.46}" cy="${c + r * 0.34}" r="${r * 0.13}"/>
  </g>
  <!-- judías verdes -->
  <g stroke="#3f8f3a" stroke-width="${r * 0.06}" stroke-linecap="round" fill="none">
    <path d="M ${c - r * 0.2} ${c + r * 0.5} q ${r * 0.18} ${-r * 0.12} ${r * 0.36} 0"/>
    <path d="M ${c + r * 0.02} ${c + r * 0.12} q ${r * 0.18} ${-r * 0.12} ${r * 0.36} 0"/>
  </g>
  <!-- granos de azafrán -->
  <g fill="#b1310f">
    <circle cx="${c - r * 0.1}" cy="${c - r * 0.2}" r="${r * 0.03}"/>
    <circle cx="${c + r * 0.18}" cy="${c + r * 0.04}" r="${r * 0.03}"/>
    <circle cx="${c - r * 0.32}" cy="${c + r * 0.02}" r="${r * 0.03}"/>
  </g>
</svg>`;
}

async function png(size, pad, out) {
  const svg = Buffer.from(paellaSVG(size, pad));
  await sharp(svg).png().toFile(out);
  console.log('✓', out);
}

await mkdir(iconsDir, { recursive: true });

await png(192, 0, join(iconsDir, 'pwa-192x192.png'));
await png(512, 0, join(iconsDir, 'pwa-512x512.png'));
await png(512, 0.16, join(iconsDir, 'maskable-512x512.png'));
await png(180, 0, join(pub, 'apple-touch-icon-180x180.png'));

await writeFile(join(pub, 'favicon.svg'), paellaSVG(64));
console.log('✓', join(pub, 'favicon.svg'));
console.log('Iconos generados.');
