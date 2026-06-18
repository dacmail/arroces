// =============================================================================
// main.js — Conexión UI <-> motor, render y estado.
// =============================================================================

import './styles.css';
import {
  TIPOS_ARROZ,
  TIPOS_FUEGO,
  DIAMETROS,
  COMENSALES_MIN,
  COMENSALES_MAX,
  TIPS,
} from './data.js';
import { computeRecipe } from './engine.js';
import { initPWA } from './pwa.js';

const $ = (sel) => document.querySelector(sel);

// --- Estado -------------------------------------------------------------------
const STORE_KEY = 'paella-state-v1';
const DEFAULT_STATE = {
  comensales: 4,
  diametro: 55,
  tipo: 'Redondo',
  fuego: 'normal',
  manual: false,
  manualRice: 400,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const s = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    s.comensales = clamp(s.comensales, COMENSALES_MIN, COMENSALES_MAX);
    if (!DIAMETROS.includes(s.diametro)) s.diametro = DEFAULT_STATE.diametro;
    if (!TIPOS_ARROZ.some((t) => t.id === s.tipo)) s.tipo = DEFAULT_STATE.tipo;
    if (!TIPOS_FUEGO.some((f) => f.id === s.fuego)) s.fuego = DEFAULT_STATE.fuego;
    return s;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible */
  }
}

const state = loadState();
const checked = new Set(); // casillas marcadas (lista de compra), efímero

const clampFn = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function clamp(v, lo, hi) {
  return clampFn(v, lo, hi);
}

// --- Formateo (es-ES) ---------------------------------------------------------
const nf = (v, dec = 0) =>
  v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtG = (g) => `${nf(Math.round(g))} g`;
const fmtGsmall = (g) => `${nf(g, 2)} g`;
const fmtCl = (cl) => `${nf(Math.round(cl))} cl`;
const fmtL = (l) => `${nf(l, 2)} L`;

// --- Definición de ingredientes para la lista ---------------------------------
const ING_ROWS = [
  { key: 'arroz', name: 'Arroz', fmt: fmtG, primary: true },
  { key: 'aceite', name: 'Aceite de oliva V.E.', fmt: fmtCl },
  { key: 'pollo', name: 'Pollo', fmt: fmtG },
  { key: 'conejo', name: 'Conejo', fmt: fmtG },
  { key: 'judia', name: 'Judía plana (ferraúra)', fmt: fmtG },
  { key: 'garrofon', name: 'Garrofón', fmt: fmtG },
  { key: 'tomate', name: 'Tomate', fmt: fmtG },
  { key: 'pimenton', name: 'Pimentón dulce', fmt: fmtGsmall },
  { key: 'azafran', name: 'Azafrán', fmt: fmtGsmall },
  { key: 'sal', name: 'Sal', fmt: fmtG },
];

// --- Construcción de controles ------------------------------------------------
function buildControls() {
  // Stepper de comensales
  document.querySelectorAll('.stepper__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.step);
      state.comensales = clamp(state.comensales + step, COMENSALES_MIN, COMENSALES_MAX);
      onChange();
    });
  });

  // Chips de diámetro
  const dWrap = $('#diametro-chips');
  dWrap.innerHTML = '';
  DIAMETROS.forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.d = d;
    b.setAttribute('role', 'radio');
    b.textContent = `${d} cm`;
    b.addEventListener('click', () => {
      state.diametro = d;
      onChange();
    });
    dWrap.appendChild(b);
  });

  // Segmentado tipo de arroz
  const aWrap = $('#arroz-seg');
  aWrap.innerHTML = '';
  TIPOS_ARROZ.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg';
    b.dataset.tipo = t.id;
    b.setAttribute('role', 'radio');
    b.innerHTML = `<span class="seg__label">${t.label}</span><span class="seg__hint">${t.hint}</span>`;
    b.addEventListener('click', () => {
      state.tipo = t.id;
      onChange();
    });
    aWrap.appendChild(b);
  });

  // Segmentado tipo de fuego
  const fWrap = $('#fuego-seg');
  fWrap.innerHTML = '';
  TIPOS_FUEGO.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg';
    b.dataset.fuego = f.id;
    b.setAttribute('role', 'radio');
    b.innerHTML = `<span class="seg__label">${f.icon} ${f.label}</span><span class="seg__hint">${f.hint}</span>`;
    b.addEventListener('click', () => {
      state.fuego = f.id;
      onChange();
    });
    fWrap.appendChild(b);
  });

  // Ajuste manual
  const manualToggle = $('#manual-toggle');
  const manualBlock = $('#manual-block');
  const manualRange = $('#manual-range');
  manualToggle.addEventListener('change', () => {
    state.manual = manualToggle.checked;
    if (state.manual) {
      // arranca en los gramos actuales por comensales
      state.manualRice = clamp(state.comensales * 100, 100, 2500);
      manualRange.value = state.manualRice;
    }
    manualBlock.hidden = !state.manual;
    onChange();
  });
  manualRange.addEventListener('input', () => {
    state.manualRice = Number(manualRange.value);
    onChange();
  });

  // Compartir
  $('#share-btn').addEventListener('click', shareRecipe);
}

// --- Sincroniza estado visual de los controles --------------------------------
function syncControls() {
  $('#comensales-value').textContent = state.comensales;

  const dWrap = $('#diametro-chips');
  dWrap.querySelectorAll('.chip').forEach((b) => {
    const active = Number(b.dataset.d) === state.diametro;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-checked', active ? 'true' : 'false');
    if (active) {
      const target = b.offsetLeft - dWrap.clientWidth / 2 + b.clientWidth / 2;
      dWrap.scrollTo({ left: Math.max(0, target), behavior: 'auto' });
    }
  });
  document.querySelectorAll('[data-tipo]').forEach((b) => {
    const active = b.dataset.tipo === state.tipo;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  document.querySelectorAll('[data-fuego]').forEach((b) => {
    const active = b.dataset.fuego === state.fuego;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-checked', active ? 'true' : 'false');
  });

  $('#manual-toggle').checked = state.manual;
  $('#manual-block').hidden = !state.manual;
  $('#manual-range').value = state.manualRice;
  $('#manual-value').textContent = `${nf(state.manualRice)} g`;
}

// --- Mensajes de capa ---------------------------------------------------------
const CAPA_MSG = {
  insuficiente: (D) =>
    `Muy poco arroz para una paella de Ø ${D} cm: la capa quedaría demasiado fina o no cubriría.`,
  muyFina: () => 'Capa muy fina, en el límite. El arroz quedará suelto; vigila que no se reseque.',
  fina: () => 'Capa fina: el arroz queda suelto, estilo paella tradicional bien extendida.',
  media: () => 'Capa media: la proporción estándar, fácil de clavar.',
  gruesa: () => 'Capa gruesa: más cuerpo. Reparte bien el arroz para que cueza por igual.',
  muyGruesa: () => 'Capa muy gruesa, en el límite. Riesgo de que el arroz de arriba quede duro.',
  excesiva: (D) => `Demasiado arroz para Ø ${D} cm: la capa quedaría excesiva. Conviene ampliar la paella.`,
};

// --- Render -------------------------------------------------------------------
function render() {
  const riceOverride = state.manual ? state.manualRice : null;
  const r = computeRecipe(state.comensales, state.diametro, state.tipo, state.fuego, riceOverride);

  // Capa
  const badge = $('#capa-badge');
  badge.textContent = r.capa.label;
  badge.className = `capa__badge sev-${r.capa.severity}`;
  const marker = $('#capa-marker');
  marker.style.left = `${r.capa.gauge * 100}%`;
  marker.className = `gauge__marker sev-${r.capa.severity}`;
  $('#capa-msg').textContent = (CAPA_MSG[r.capa.status] || (() => ''))(r.D);

  // Sugerencias
  const sWrap = $('#suggestions');
  sWrap.innerHTML = '';
  r.suggestions.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip chip--suggest';
    b.textContent = s.label;
    b.addEventListener('click', () => {
      if (s.type === 'diametro') state.diametro = s.value;
      if (s.type === 'comensales') state.comensales = s.value;
      onChange();
    });
    sWrap.appendChild(b);
  });

  // Proporción / agua
  $('#ratio-main').textContent = `1 : ${nf(r.water.ratio, 1)}`;
  $('#ratio-sub').textContent = `≈ ${nf(Math.round(r.water.mlPer100g))} ml de caldo por 100 g de arroz`;
  $('#q1-value').textContent = fmtL(r.water.q1);
  $('#q1-range').textContent = r.water.range
    ? `rango ${nf(r.water.range[0], 2)}–${nf(r.water.range[1], 2)} L`
    : '';
  $('#q2-value').textContent = fmtL(r.water.q2);
  $('#qt-value').textContent = fmtL(r.water.total);

  const notes = [];
  if (r.capa.severity === 'bad') {
    notes.push('Combinación no recomendada: ajusta el diámetro o los comensales para una proporción fiable.');
  } else {
    if (!r.water.exact) notes.push('Valores estimados (combinación fuera de la tabla original).');
    if (state.fuego === 'alta') notes.push('Fuego alto: algo más de caldo por mayor evaporación.');
  }
  $('#water-note').textContent = notes.join(' ');

  // Ingredientes
  const list = $('#ing-list');
  list.innerHTML = '';
  ING_ROWS.forEach((row) => {
    let value = r.ingredients[row.key];
    if (row.key === 'arroz') value = r.riceG; // refleja override manual si lo hay
    const li = document.createElement('li');
    li.className = 'ing' + (row.primary ? ' ing--primary' : '');
    if (checked.has(row.key)) li.classList.add('is-checked');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'ing__check';
    cb.checked = checked.has(row.key);
    cb.setAttribute('aria-label', `Marcar ${row.name}`);
    cb.addEventListener('change', () => {
      if (cb.checked) checked.add(row.key);
      else checked.delete(row.key);
      li.classList.toggle('is-checked', cb.checked);
    });

    const name = document.createElement('span');
    name.className = 'ing__name';
    name.textContent = row.name;

    const amount = document.createElement('span');
    amount.className = 'ing__amount';
    amount.textContent = row.fmt(value);

    li.append(cb, name, amount);
    list.appendChild(li);
  });

  // Consejos según fuego
  const tip = TIPS[state.fuego];
  $('#tips-body').innerHTML = `<p><strong>${tip.title}</strong></p><p>${tip.body}</p>`;

  return r;
}

let lastRecipe = null;
function onChange() {
  syncControls();
  lastRecipe = render();
  saveState();
}

// --- Compartir / copiar -------------------------------------------------------
function buildShareText() {
  const r = lastRecipe;
  if (!r) return '';
  const tipoLabel = TIPOS_ARROZ.find((t) => t.id === r.tipo)?.label || r.tipo;
  const fuegoLabel = TIPOS_FUEGO.find((f) => f.id === r.fuego)?.label || r.fuego;
  const lines = [
    '🥘 Paella Valenciana',
    `${r.n} comensales · Ø ${r.D} cm · arroz ${tipoLabel} · fuego ${fuegoLabel}`,
    `Capa: ${r.capa.label}`,
    '',
    'Ingredientes:',
    ...ING_ROWS.map((row) => {
      const v = row.key === 'arroz' ? r.riceG : r.ingredients[row.key];
      return `• ${row.name}: ${row.fmt(v)}`;
    }),
    '',
    `Caldo (arroz): ${fmtL(r.water.q1)}`,
    `Agua sofrito/carne: ${fmtL(r.water.q2)}`,
    `Agua total: ${fmtL(r.water.total)}`,
    `Proporción: 1 : ${nf(r.water.ratio, 1)} (${nf(Math.round(r.water.mlPer100g))} ml/100 g)`,
  ];
  return lines.join('\n');
}

async function shareRecipe() {
  const text = buildShareText();
  const data = { title: 'Paella Valenciana', text };
  try {
    if (navigator.share) {
      await navigator.share(data);
      return;
    }
  } catch {
    return; // el usuario canceló
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('Receta copiada al portapapeles');
  } catch {
    showToast('No se pudo compartir');
  }
}

// --- Toast --------------------------------------------------------------------
let toastTimer = null;
function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => (el.hidden = true), 250);
  }, 2200);
}

// --- Init ---------------------------------------------------------------------
buildControls();
onChange();
initPWA({ onToast: showToast });
