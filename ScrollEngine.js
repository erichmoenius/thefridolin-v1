export function calculateStateWeights(progress) {

  progress = Math.max(0, Math.min(1, progress));

  function smoothStep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  const gasStart    = 0.00;
  const waterStart  = 0.40;
  const solidStart  = 0.60;
  const fireStart   = 0.75;
  const stillStart  = 0.88;

  const gas =
    1.0 - smoothStep(gasStart, waterStart, progress);

  const water =
    smoothStep(gasStart, waterStart, progress) *
    (1.0 - smoothStep(waterStart, solidStart, progress));

  const solid =
    smoothStep(waterStart, solidStart, progress) *
    (1.0 - smoothStep(solidStart, fireStart, progress));

  const fire =
    smoothStep(solidStart, fireStart, progress) *
    (1.0 - smoothStep(fireStart, stillStart, progress));

  const stillness =
    smoothStep(fireStart, stillStart, progress);

  return { gas, water, solid, fire, stillness };
}
