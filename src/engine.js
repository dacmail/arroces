// =============================================================================
// engine.js — Motor de cálculo puro (sin DOM).
// Combina la calculadora web (ingredientes + Q1/Q2 exactos) con la tabla de
// Instagram (grosor de capa + ajuste por tipo de fuego).
// =============================================================================

import {
  factorArroz,
  conejo_g,
  judia_g,
  aceite_cl,
  sal_g,
  Q2_lookup,
  Q2_K,
  Q1_Redondo,
  Q1_FORMULA,
  riceByCapa,
  aguaIG_normal,
  aguaIG_alta,
  webRiceRange,
  DIAMETROS,
  COMENSALES_MIN,
  COMENSALES_MAX,
} from './data.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const area = (D) => Math.PI * (D / 2) ** 2;

// --- Interpolación lineal sobre un mapa {clave numérica: valor} ---------------
function surroundingKeys(keys, x) {
  const sorted = keys.slice().sort((a, b) => a - b);
  if (x <= sorted[0]) return [sorted[0], sorted[0], 0];
  if (x >= sorted[sorted.length - 1]) {
    const last = sorted[sorted.length - 1];
    return [last, last, 0];
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (x >= sorted[i] && x <= sorted[i + 1]) {
      const t = (x - sorted[i]) / (sorted[i + 1] - sorted[i]);
      return [sorted[i], sorted[i + 1], t];
    }
  }
  return [sorted[0], sorted[0], 0];
}

// Triplete [fina, media, gruesa] de arroz (g) para un diámetro arbitrario.
export function interpTriplet(D) {
  const keys = Object.keys(riceByCapa).map(Number);
  const [k0, k1, t] = surroundingKeys(keys, D);
  const a = riceByCapa[k0];
  const b = riceByCapa[k1];
  return a.map((v, i) => v + (b[i] - v) * t);
}

// Devuelve la celda [min,max] de una tabla de agua IG; si falta (32 media),
// la aproxima con el punto medio entre fina y gruesa de ese diámetro.
function igCell(table, Dkey, capa) {
  const row = table[Dkey];
  if (!row) return null;
  if (row[capa]) return row[capa];
  if (capa === 'media' && row.fina && row.gruesa) {
    return [(row.fina[0] + row.gruesa[0]) / 2, (row.fina[1] + row.gruesa[1]) / 2];
  }
  return row.fina || row.gruesa || null;
}

// Interpola un rango [min,max] de caldo por diámetro para una capa dada.
export function interpRange(table, D, capa) {
  const keys = Object.keys(table).map(Number);
  const [k0, k1, t] = surroundingKeys(keys, D);
  const c0 = igCell(table, k0, capa);
  const c1 = igCell(table, k1, capa);
  if (!c0 || !c1) return c0 || c1 || null;
  return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t];
}

// --- Capa de arroz ------------------------------------------------------------
// Estados: insuficiente | muyFina | ok(Fina/Media/Gruesa) | muyGruesa | excesiva
export function computeCapa(D, riceG) {
  const [F, M, G] = interpTriplet(D);
  const stepLow = Math.max(M - F, 1);
  const stepHigh = Math.max(G - M, 1);

  // Índice continuo de grosor: F→1, M→2, G→3 (extrapola fuera).
  let index;
  if (riceG <= M) index = 1 + (riceG - F) / stepLow;
  else index = 2 + (riceG - M) / stepHigh;

  // Banda aceptable: se ensancha hasta cubrir lo que ofrece la web.
  const wr = webRiceRange[D];
  const low = Math.min(F - stepLow, wr ? wr[0] : Infinity);
  const high = Math.max(G + stepHigh, wr ? wr[1] : -Infinity);

  let status, label, severity;
  if (riceG < low) {
    status = 'insuficiente';
    label = 'Insuficiente';
    severity = 'bad';
  } else if (riceG > high) {
    status = 'excesiva';
    label = 'Excesiva';
    severity = 'bad';
  } else if (riceG < F - 0.5 * stepLow) {
    status = 'muyFina';
    label = 'Muy fina';
    severity = 'warn';
  } else if (riceG < F + 0.5 * stepLow) {
    status = 'fina';
    label = 'Fina';
    severity = 'good';
  } else if (riceG < M + 0.5 * stepHigh) {
    status = 'media';
    label = 'Media';
    severity = 'good';
  } else if (riceG <= G + 0.5 * stepHigh) {
    status = 'gruesa';
    label = 'Gruesa';
    severity = 'good';
  } else {
    status = 'muyGruesa';
    label = 'Muy gruesa';
    severity = 'warn';
  }

  // Posición 0..1 en la barra (dominio del índice de 0.5 a 3.5).
  const gauge = clamp((index - 0.5) / 3.0, 0, 1);

  return { F, M, G, index, gauge, status, label, severity };
}

// Capa "canónica" (fina/media/gruesa) para buscar en las tablas IG.
function capaKey(status) {
  if (status === 'insuficiente' || status === 'muyFina' || status === 'fina') return 'fina';
  if (status === 'media') return 'media';
  return 'gruesa';
}

// Factor de caldo por fuego alto respecto al normal (derivado de la tabla IG).
export function fireFactor(D, capa) {
  const n0 = interpRange(aguaIG_normal, D, capa);
  const a0 = interpRange(aguaIG_alta, D, capa);
  if (!n0 || !a0) return 1.06;
  const midN = (n0[0] + n0[1]) / 2;
  const midA = (a0[0] + a0[1]) / 2;
  if (!midN) return 1.06;
  return midA / midN;
}

// --- Agua / caldo -------------------------------------------------------------
export function computeWater(n, D, tipo, fuego, riceG, status) {
  const capa = capaKey(status);

  let q1base = Q1_Redondo[n]?.[D];
  const exact = q1base != null;
  if (!exact) q1base = Q1_FORMULA.a * area(D) + Q1_FORMULA.b * n + Q1_FORMULA.c;

  const fire = fuego === 'alta' ? fireFactor(D, capa) : 1;
  let q1 = q1base * factorArroz[tipo] * fire;
  // Modo manual: el caldo sigue al arroz manteniendo la proporción del punto
  // de datos nominal (n×100 g) para ese diámetro/tipo/fuego.
  const nominalRice = n * 100;
  if (riceG > 0 && nominalRice > 0 && riceG !== nominalRice) {
    q1 *= riceG / nominalRice;
  }

  const q2 = Q2_lookup[D] != null ? Q2_lookup[D] : area(D) * Q2_K;
  const total = q1 + q2;

  // Rango de referencia de la tabla IG (JSendra) escalado por tipo de arroz.
  const baseRange = interpRange(fuego === 'alta' ? aguaIG_alta : aguaIG_normal, D, capa);
  const range = baseRange ? [baseRange[0] * factorArroz[tipo], baseRange[1] * factorArroz[tipo]] : null;

  const mlPer100g = riceG > 0 ? (q1 * 100000) / riceG : 0; // ml de caldo por 100 g
  const ratio = riceG > 0 ? (q1 * 1000) / riceG : 0; // partes de caldo por 1 de arroz

  return { q1, q2, total, range, mlPer100g, ratio, exact };
}

// --- Ingredientes sólidos (dependen solo de comensales) -----------------------
export function computeIngredients(n) {
  return {
    arroz: n * 100,
    aceite: aceite_cl[n],
    pollo: n * 200,
    conejo: conejo_g[n],
    judia: judia_g[n],
    garrofon: n * 25,
    tomate: n * 40,
    pimenton: 1.25 + n * 0.25,
    azafran: n * 0.05,
    sal: sal_g[n],
  };
}

// --- Sugerencias correctivas --------------------------------------------------
// Para "insuficiente"/"excesiva" propone un diámetro y/o nº de comensales que
// dejarían la capa en torno a "media".
export function suggestions(D, riceG, n, status) {
  if (status !== 'insuficiente' && status !== 'excesiva') return [];
  const out = [];

  // Diámetro cuyo valor "media" se acerca más al arroz actual.
  let bestD = null;
  let bestDiff = Infinity;
  for (const d of DIAMETROS) {
    if (d === D) continue;
    const media = interpTriplet(d)[1];
    const diff = Math.abs(media - riceG);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestD = d;
    }
  }
  if (bestD != null) {
    const dir = bestD > D ? 'Amplía' : 'Reduce';
    out.push({ type: 'diametro', value: bestD, label: `${dir} a Ø ${bestD} cm` });
  }

  // Comensales que dejarían "media" en el diámetro actual.
  const mediaG = interpTriplet(D)[1];
  const targetN = clamp(Math.round(mediaG / 100), COMENSALES_MIN, COMENSALES_MAX);
  if (targetN !== n) {
    const dir = targetN > n ? 'Sube' : 'Baja';
    out.push({ type: 'comensales', value: targetN, label: `${dir} a ${targetN} comensales` });
  }

  return out;
}

// --- Composición --------------------------------------------------------------
// riceOverride: gramos de arroz fijados a mano (modo avanzado) o null.
export function computeRecipe(n, D, tipo, fuego, riceOverride = null) {
  const ingredients = computeIngredients(n);
  const riceG = riceOverride != null ? riceOverride : ingredients.arroz;
  const capa = computeCapa(D, riceG);
  const water = computeWater(n, D, tipo, fuego, riceG, capa.status);
  const sugg = suggestions(D, riceG, n, capa.status);
  return { n, D, tipo, fuego, riceG, ingredients, capa, water, suggestions: sugg };
}
