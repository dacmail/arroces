// Pruebas del motor de cálculo. Validan la coherencia con la tabla maestra
// (las 90 combinaciones) y la lógica de capa/agua. Se ejecutan en CI antes de
// desplegar.  ->  node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRecipe } from '../src/engine.js';

const near = (a, b, tol = 0.015) => Math.abs(a - b) <= tol;

test('exactitud Q1/Q2 frente a la tabla maestra', () => {
  let r = computeRecipe(6, 55, 'Redondo', 'normal');
  assert.equal(r.riceG, 600);
  assert.equal(r.capa.status, 'gruesa');
  assert.ok(near(r.water.q1, 2.49), `Q1=${r.water.q1}`);
  assert.ok(near(r.water.q2, 2.77), `Q2=${r.water.q2}`);

  r = computeRecipe(4, 50, 'Bomba', 'normal');
  assert.ok(near(r.water.q1, 2.18), `Q1=${r.water.q1}`);
  assert.ok(near(r.water.q2, 2.29), `Q2=${r.water.q2}`);

  r = computeRecipe(9, 80, 'Albufera', 'normal');
  assert.ok(near(r.water.q1, 5.07, 0.02), `Q1=${r.water.q1}`);
  assert.ok(near(r.water.q2, 5.85), `Q2=${r.water.q2}`);
});

test('ingredientes sólidos (lineales + lookup, con corrección A1)', () => {
  const r = computeRecipe(3, 50, 'Bomba', 'normal');
  assert.equal(r.ingredients.judia, 200); // A1: nunca 170
  assert.equal(r.ingredients.pollo, 600);
  assert.equal(r.ingredients.garrofon, 75);
});

test('avisos de capa: insuficiente y excesiva con sugerencias', () => {
  const ins = computeRecipe(2, 80, 'Redondo', 'normal');
  assert.equal(ins.capa.status, 'insuficiente');
  assert.equal(ins.capa.severity, 'bad');
  assert.ok(ins.suggestions.length > 0);

  const exc = computeRecipe(10, 40, 'Redondo', 'normal');
  assert.equal(exc.capa.status, 'excesiva');
  assert.ok(exc.suggestions.length > 0);
});

test('combos de la web nunca se marcan como error', () => {
  // 5p/65 (la web lo ofrece) debe ser "muy fina" (aviso), no "insuficiente".
  const r = computeRecipe(5, 65, 'Redondo', 'normal');
  assert.equal(r.capa.status, 'muyFina');
  assert.notEqual(r.capa.severity, 'bad');
});

test('multiplicador por tipo y por fuego', () => {
  const base = computeRecipe(6, 55, 'Redondo', 'normal').water.q1;
  const bomba = computeRecipe(6, 55, 'Bomba', 'normal').water.q1;
  assert.ok(near(bomba, base * 1.148, 0.02), `bomba=${bomba}`);

  const alta = computeRecipe(6, 55, 'Redondo', 'alta').water.q1;
  assert.ok(alta > base, 'fuego alto debe pedir más caldo');
});

test('modo manual: el caldo escala con el arroz manteniendo la proporción', () => {
  const a = computeRecipe(6, 60, 'Redondo', 'normal', 600);
  const b = computeRecipe(6, 60, 'Redondo', 'normal', 900);
  assert.ok(near(b.water.q1, a.water.q1 * 1.5, 0.02), `q1=${b.water.q1}`);
  assert.ok(near(a.water.ratio, b.water.ratio, 0.05)); // misma proporción
  assert.equal(b.capa.status, 'muyGruesa');
});
