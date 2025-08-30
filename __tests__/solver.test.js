/*
  Jest tests for the pure solver at js/solver.js
  To run:
    - npm i -D jest
    - npx jest
*/

const path = require('path');
const solverPath = path.join(__dirname, '..', 'js', 'solver.js');
const { solve } = require(solverPath);

describe('Solver.solve', () => {
  test('returns exact hit when already present', () => {
    const res = solve([100, 3, 6, 8, 25, 7], 100);
    expect(res.closest).toBe(100);
    expect(res.diff).toBe(0);
  });

  test('division only when divisible (integer results)', () => {
    const res = solve([5, 4], 2);
    // acceptable exact with subtraction then division not needed, ensure no fractional path
    const hasFraction = res.steps.some(s => /÷/.test(s) && /=\s*(?!\d+$)/.test(s));
    expect(hasFraction).toBe(false);
  });

  test('handles negative-difference proximity gracefully', () => {
    const res = solve([1, 2, 3, 4, 5, 6], 999);
    expect(res.diff).toBeGreaterThanOrEqual(0);
    expect(typeof res.closest).toBe('number');
  });

  test('classic puzzle sample - proximity (may not be exact)', () => {
    const res = solve([25, 50, 75, 3, 6, 8], 952);
    expect(res.diff).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.steps)).toBe(true);
  });
});
