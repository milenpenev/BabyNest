function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * x);

  const approximation =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t +
      a1) *
      t *
      Math.exp(-x * x);

  return sign * approximation;
}

export function normalCdf(zScore: number) {
  return 0.5 * (1 + erf(zScore / Math.sqrt(2)));
}

export function zScoreToPercentile(zScore: number) {
  const percentile = normalCdf(zScore) * 100;

  return Math.min(
    99.9,
    Math.max(0.1, percentile),
  );
}
