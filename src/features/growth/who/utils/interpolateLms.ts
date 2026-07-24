import type { WhoLmsRow } from "../types/whoGrowth.types";

export function interpolateLmsRow(
  rows: WhoLmsRow[],
  ageDays: number,
): WhoLmsRow {
  if (rows.length === 0) {
    throw new Error("WHO LMS dataset is empty");
  }

  const sortedRows = [...rows].sort(
    (a, b) => a.ageDays - b.ageDays,
  );

  if (ageDays <= sortedRows[0].ageDays) {
    return sortedRows[0];
  }

  const last = sortedRows[sortedRows.length - 1];

  if (ageDays >= last.ageDays) {
    return last;
  }

  const upperIndex = sortedRows.findIndex(
    (row) => row.ageDays >= ageDays,
  );

  const upper = sortedRows[upperIndex];
  const lower = sortedRows[upperIndex - 1];

  if (upper.ageDays === lower.ageDays) {
    return lower;
  }

  const ratio =
    (ageDays - lower.ageDays) /
    (upper.ageDays - lower.ageDays);

  return {
    ageDays,
    l: lower.l + (upper.l - lower.l) * ratio,
    m: lower.m + (upper.m - lower.m) * ratio,
    s: lower.s + (upper.s - lower.s) * ratio,
  };
}
