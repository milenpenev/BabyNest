import type { WhoLmsRow } from "../types/whoGrowth.types";

export function calculateLmsZScore(
  value: number,
  row: WhoLmsRow,
) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Growth value must be positive");
  }

  if (
    !Number.isFinite(row.l) ||
    !Number.isFinite(row.m) ||
    !Number.isFinite(row.s) ||
    row.m <= 0 ||
    row.s <= 0
  ) {
    throw new Error("Invalid WHO LMS row");
  }

  if (Math.abs(row.l) < 1e-8) {
    return Math.log(value / row.m) / row.s;
  }

  return (
    (Math.pow(value / row.m, row.l) - 1) /
    (row.l * row.s)
  );
}
