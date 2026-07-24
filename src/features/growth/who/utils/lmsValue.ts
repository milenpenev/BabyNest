import type { WhoLmsRow } from "../types/whoGrowth.types";

export function calculateLmsValueFromZScore(
  row: WhoLmsRow,
  zScore: number,
) {
  if (
    !Number.isFinite(row.l) ||
    !Number.isFinite(row.m) ||
    !Number.isFinite(row.s) ||
    !Number.isFinite(zScore) ||
    row.m <= 0 ||
    row.s <= 0
  ) {
    throw new Error("Invalid LMS data");
  }

  if (Math.abs(row.l) < 1e-8) {
    return row.m * Math.exp(row.s * zScore);
  }

  const base = 1 + row.l * row.s * zScore;

  if (base <= 0) {
    throw new Error(
      "LMS value cannot be calculated for this Z-score",
    );
  }

  return row.m * Math.pow(base, 1 / row.l);
}
