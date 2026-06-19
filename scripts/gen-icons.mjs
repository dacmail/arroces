// =============================================================================
// gen-icons.mjs — Genera los iconos PWA (PNG), el favicon (SVG) y la imagen
// de compartir (OG) desde una ilustración de paellera vista desde arriba.
// Requiere `sharp` (devDependency).
//   node scripts/gen-icons.mjs
// =============================================================================

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
// "app-icons" (no "icons"): Apache reserva /icons/ con un Alias global
// (fancy-indexing), que intercepta esa ruta antes de llegar al docroot.
const iconsDir = join(pub, 'app-icons');

// Dibuja la paellera (asas + borde + arroz + ingredientes) centrada en (cx,cy)
// con radio r. Devuelve solo el contenido <g>, para poder reutilizarlo tanto
// en iconos cuadrados como en la imagen OG (rectangular).
function paellaArt(cx, cy, r) {
  const handleR = r * 0.165;
  const handleX = r * 1.04;
  const sw = r * 0.045;

  // Ingredientes en disposición radial (drumstick, judía verde, garrofón).
  const ring = r * 0.56;
  const chicken = [50, 230].map((deg) => ({ deg, type: 'pollo' }));
  const judia = [-15, 95, 165, 280].map((deg) => ({ deg, type: 'judia' }));
  const garrofon = [20, 130, 200, 310].map((deg) => ({ deg, type: 'garrofon' }));
  const items = [...chicken, ...judia, ...garrofon];

  const toRad = (deg) => (deg * Math.PI) / 180;
  const pos = (deg, rr) => ({ x: cx + rr * Math.cos(toRad(deg)), y: cy + rr * Math.sin(toRad(deg)) });

  const drumstick = ({ deg }) => {
    const { x, y } = pos(deg, ring);
    const a = deg + 180; // el muslo apunta hacia el centro
    return `<g transform="translate(${x} ${y}) rotate(${a})">
      <path d="M ${-r * 0.05} ${-r * 0.16} q ${r * 0.34} ${-r * 0.02} ${r * 0.36} ${r * 0.18} q ${r * 0.02} ${r * 0.22} ${-r * 0.16} ${r * 0.26} q ${-r * 0.22} ${r * 0.05} ${-r * 0.28} ${-r * 0.14} q ${-r * 0.07} ${-r * 0.13} ${r * 0.08} ${-r * 0.24} Z"
        fill="#d98a3d" stroke="#a3601f" stroke-width="${r * 0.015}"/>
      <circle cx="${-r * 0.16}" cy="${r * 0.07}" r="${r * 0.05}" fill="#f3d8b0"/>
    </g>`;
  };

  const greenBean = ({ deg }) => {
    const { x, y } = pos(deg, ring);
    return `<rect x="${x - r * 0.22}" y="${y - r * 0.045}" width="${r * 0.44}" height="${r * 0.09}"
      rx="${r * 0.045}" fill="#5fa648" stroke="#3f7a30" stroke-width="${r * 0.012}"
      transform="rotate(${deg + 90} ${x} ${y})"/>`;
  };

  const whiteBean = ({ deg }) => {
    const { x, y } = pos(deg, ring * 0.86);
    return `<g>
      <ellipse cx="${x}" cy="${y}" rx="${r * 0.085}" ry="${r * 0.065}" fill="#f5ecd8" stroke="#c9b98e" stroke-width="${r * 0.01}"
        transform="rotate(${deg} ${x} ${y})"/>
      <ellipse cx="${x - r * 0.015}" cy="${y}" rx="${r * 0.018}" ry="${r * 0.03}" fill="#7a5a2a"
        transform="rotate(${deg} ${x} ${y})"/>
    </g>`;
  };

  const renderItem = (item) =>
    item.type === 'pollo' ? drumstick(item) : item.type === 'judia' ? greenBean(item) : whiteBean(item);

  return `
  <!-- asas -->
  <circle cx="${cx - handleX}" cy="${cy}" r="${handleR}" fill="none" stroke="#1c1c1c" stroke-width="${r * 0.1}"/>
  <circle cx="${cx + handleX}" cy="${cy}" r="${handleR}" fill="none" stroke="#1c1c1c" stroke-width="${r * 0.1}"/>
  <!-- borde metálico de la paellera -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rim-${r})"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.93}" fill="none" stroke="#777" stroke-width="${sw}" opacity="0.6"/>
  <!-- arroz -->
  <circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="url(#rice-${r})"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="url(#speckle-${r})"/>
  <!-- ingredientes -->
  ${items.map(renderItem).join('\n  ')}
  `;
}

function defs(r) {
  return `<radialGradient id="rim-${r}" cx="40%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#8a8a8a"/>
      <stop offset="55%" stop-color="#4a4a4a"/>
      <stop offset="100%" stop-color="#1f1f1f"/>
    </radialGradient>
    <radialGradient id="rice-${r}" cx="48%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#ffda6e"/>
      <stop offset="65%" stop-color="#f3a82c"/>
      <stop offset="100%" stop-color="#d6831a"/>
    </radialGradient>
    <radialGradient id="speckle-${r}" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#a85d0a" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#7a3d00" stop-opacity="0.32"/>
    </radialGradient>`;
}

function iconSVG(size, pad = 0) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * (1 - pad) * 0.86; // deja hueco para las asas dentro del lienzo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${defs(r)}</defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#fff7e6"/>
  ${paellaArt(cx, cy, r)}
</svg>`;
}

function ogSVG(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const r = height * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>${defs(r)}</defs>
  <rect width="${width}" height="${height}" fill="#fffaf0"/>
  ${paellaArt(cx, cy, r)}
</svg>`;
}

async function png(svgStr, out) {
  await sharp(Buffer.from(svgStr)).png().toFile(out);
  console.log('✓', out);
}

await mkdir(iconsDir, { recursive: true });

await png(iconSVG(192), join(iconsDir, 'pwa-192x192.png'));
await png(iconSVG(512), join(iconsDir, 'pwa-512x512.png'));
await png(iconSVG(512, 0.12), join(iconsDir, 'maskable-512x512.png'));
await png(iconSVG(180), join(pub, 'apple-touch-icon-180x180.png'));
await png(ogSVG(1200, 630), join(pub, 'og-image.png'));

await writeFile(join(pub, 'favicon.svg'), iconSVG(64));
console.log('✓', join(pub, 'favicon.svg'));
console.log('Iconos generados.');
