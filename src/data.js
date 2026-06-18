// =============================================================================
// data.js — Tablas de lookup transcritas de:
//   - Calculadora de arrocesconestilo.com
//   - Tabla de Instagram @arrocesconestilo
// Fuente consolidada: calculadora-paella-valenciana.md
// Se aplican las correcciones de anomalías (A1–A4) documentadas en el .md.
// =============================================================================

// --- Opciones de la UI --------------------------------------------------------

export const TIPOS_ARROZ = [
  { id: 'Redondo', label: 'Redondo', hint: 'Senia / J. Sendra' },
  { id: 'Albufera', label: 'Albufera', hint: 'absorbe más' },
  { id: 'Bomba', label: 'Bomba', hint: 'el que más absorbe' },
];

export const TIPOS_FUEGO = [
  { id: 'normal', label: 'Normal', hint: 'tubo redondo', icon: '🔥' },
  { id: 'alta', label: 'Alta potencia', hint: 'tubo plano', icon: '🔥🔥' },
];

// Diámetros ofrecidos en la UI (cm). Unión de los presentes en ambas fuentes.
export const DIAMETROS = [32, 36, 40, 46, 50, 55, 60, 65, 70, 80, 90];

export const COMENSALES_MIN = 2;
export const COMENSALES_MAX = 10;

// --- Multiplicador de caldo por tipo de arroz (sobre Redondo) -----------------
export const factorArroz = { Redondo: 1.0, Albufera: 1.072, Bomba: 1.148 };

// --- Ingredientes sólidos -----------------------------------------------------
// Lineales: arroz=n*100, pollo=n*200, garrofon=n*25, tomate=n*40,
//           azafran=n*0.05, pimenton=1.25 + n*0.25.
// No lineales → lookup (§8.2). A1: judía 3p siempre 200 g (se ignora el 170).
export const conejo_g = { 2: 250, 3: 300, 4: 350, 5: 400, 6: 450, 7: 500, 8: 550, 9: 600, 10: 650 };
export const judia_g  = { 2: 150, 3: 200, 4: 250, 5: 300, 6: 350, 7: 400, 8: 450, 9: 500, 10: 550 };
export const aceite_cl = { 2: 6, 3: 8, 4: 11, 5: 14, 6: 17, 7: 19, 8: 22, 9: 25, 10: 29 };
export const sal_g     = { 2: 12, 3: 19, 4: 25, 5: 33, 6: 39, 7: 46, 8: 53, 9: 60, 10: 66 };

// --- Q2: agua de cocción de carnes, depende solo del diámetro (§8.3) ----------
export const Q2_lookup = {
  36: 1.18, 40: 1.46, 46: 1.85, 50: 2.29, 55: 2.77,
  60: 3.29, 65: 3.86, 70: 4.48, 80: 5.85,
};
// Constante de la fórmula de respaldo: Q2 ≈ π·(D/2)²·k
export const Q2_K = 0.001164;

// --- Q1: agua de cocción del arroz (base Redondo) (§8.5) ----------------------
// Q1_Redondo[comensales][diámetro] = litros. Otros tipos: × factorArroz.
export const Q1_Redondo = {
  2: { 36: 0.88, 40: 1.15 },
  3: { 40: 1.25, 46: 1.53, 50: 1.81 },
  4: { 46: 1.63, 50: 1.9, 55: 2.29, 60: 2.4 },
  5: { 55: 2.39, 60: 2.51, 65: 2.62 },
  6: { 55: 2.49, 60: 2.62, 65: 2.74, 70: 3.27 },
  7: { 55: 2.59, 60: 2.72, 65: 2.85, 70: 3.38 },
  8: { 60: 2.82, 65: 2.95, 70: 3.5 },
  9: { 60: 2.93, 65: 3.05, 70: 3.61, 80: 4.73 },
  10: { 65: 3.16, 70: 3.72, 80: 4.84 },
};
// Coeficientes de la fórmula de respaldo de Q1 (Redondo, fuego normal):
// Q1 ≈ a·area + b·comensales + c
export const Q1_FORMULA = { a: 0.000718, b: 0.0884, c: 0.059 };

// --- Cantidad de arroz por diámetro y capa (§7) -------------------------------
// riceByCapa[D] = [fina, media, gruesa] en gramos.
export const riceByCapa = {
  32: [100, 200, 300],
  40: [200, 300, 400],
  45: [200, 300, 400],
  50: [300, 400, 500],
  55: [400, 500, 600],
  60: [600, 700, 800],
  65: [700, 800, 900],
  70: [800, 1000, 1200],
  80: [1200, 1500, 1800],
  90: [1800, 2000, 2500],
};

// --- Rangos de caldo de la tabla de Instagram (JSendra/Redondo) (§8.6) --------
// [min, max] litros por capa. media:null donde la fuente no da dato (32 cm).
export const aguaIG_normal = {
  32: { fina: [0.4, 0.6], media: null, gruesa: [0.8, 1.0] },
  40: { fina: [1.0, 1.2], media: [1.1, 1.3], gruesa: [1.2, 1.4] },
  45: { fina: [1.1, 1.3], media: [1.3, 1.5], gruesa: [1.6, 1.7] },
  50: { fina: [1.6, 1.8], media: [1.8, 2.0], gruesa: [1.9, 2.1] },
  55: { fina: [2.1, 2.3], media: [2.3, 2.5], gruesa: [2.5, 2.6] },
  60: { fina: [2.5, 2.8], media: [2.6, 2.9], gruesa: [2.8, 3.0] },
  65: { fina: [2.8, 3.1], media: [2.9, 3.1], gruesa: [3.1, 3.2] },
  70: { fina: [3.6, 4.0], media: [3.8, 4.2], gruesa: [4.1, 4.5] },
  80: { fina: [5.5, 5.7], media: [5.4, 5.9], gruesa: [5.8, 6.2] },
  90: { fina: [5.5, 6.1], media: [6.8, 7.4], gruesa: [7.2, 7.8] },
};
export const aguaIG_alta = {
  32: { fina: [0.7, 0.9], media: null, gruesa: [0.85, 1.05] },
  40: { fina: [1.1, 1.3], media: [1.2, 1.4], gruesa: [1.3, 1.5] },
  45: { fina: [1.4, 1.6], media: [1.5, 1.7], gruesa: [1.65, 1.75] },
  50: { fina: [1.8, 2.0], media: [2.0, 2.2], gruesa: [2.05, 2.15] },
  55: { fina: [2.3, 2.5], media: [2.5, 2.6], gruesa: [2.6, 2.7] },
  60: { fina: [2.6, 2.9], media: [2.8, 3.0], gruesa: [3.0, 3.2] },
  65: { fina: [2.9, 3.1], media: [3.1, 3.2], gruesa: [3.2, 3.3] },
  70: { fina: [3.8, 4.2], media: [4.1, 4.5], gruesa: [4.5, 4.9] },
  80: { fina: [5.4, 5.9], media: [5.8, 6.2], gruesa: [6.2, 6.6] },
  90: { fina: [6.8, 7.4], media: [7.2, 7.8], gruesa: [7.8, 8.4] },
};

// --- Rango de arroz que ofrece la web por diámetro (derivado de Q1_Redondo) ---
// Se usa para ensanchar la banda "aceptable" de capa y no marcar como error
// combinaciones que la propia calculadora web ofrece.
export const webRiceRange = (() => {
  const acc = {}; // D -> [min, max] en gramos
  for (const nStr of Object.keys(Q1_Redondo)) {
    const n = Number(nStr);
    const rice = n * 100;
    for (const dStr of Object.keys(Q1_Redondo[n])) {
      const d = Number(dStr);
      if (!acc[d]) acc[d] = [rice, rice];
      acc[d][0] = Math.min(acc[d][0], rice);
      acc[d][1] = Math.max(acc[d][1], rice);
    }
  }
  return acc;
})();

// --- Textos de consejos según el fuego (de la imagen de Instagram) ------------
export const TIPS = {
  normal: {
    title: 'Fuego de potencia normal (tubo redondo)',
    body: 'Quemadores de gas de tubo redondo, donde el fuego no está tan bien distribuido ni es tan potente como en los de tubo plano. Necesita algo menos de caldo porque evapora menos.',
  },
  alta: {
    title: 'Fuego de alta potencia (tubo plano / chafado)',
    body: 'Quemadores de tubo plano/chafado, donde la potencia suele estar mejor distribuida y la paella está más cerca del fuego. Evapora más, así que pide algo más de caldo.',
  },
};
