import type { CorrectedAgeOptions } from "../types/whoGrowth.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const TERM_GESTATION_WEEKS = 40;

function startOfLocalDay(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

export function differenceInCompletedDays(
  from: string | Date,
  to: string | Date,
) {
  const fromDate = startOfLocalDay(from);
  const toDate = startOfLocalDay(to);

  return Math.max(
    0,
    Math.floor(
      (toDate.getTime() - fromDate.getTime()) / DAY_MS,
    ),
  );
}

export function calculateGrowthAgeDays({
  birthDate,
  measuredAt,
  gestationalAgeWeeks,
  useCorrectedAge = true,
}: CorrectedAgeOptions) {
  const chronologicalAgeDays =
    differenceInCompletedDays(birthDate, measuredAt);

  const shouldCorrectAge =
    useCorrectedAge &&
    typeof gestationalAgeWeeks === "number" &&
    Number.isFinite(gestationalAgeWeeks) &&
    gestationalAgeWeeks < TERM_GESTATION_WEEKS;

  if (!shouldCorrectAge) {
    return {
      chronologicalAgeDays,
      correctedAgeDays: chronologicalAgeDays,
      usedCorrectedAge: false,
    };
  }

  const prematureWeeks =
    TERM_GESTATION_WEEKS - gestationalAgeWeeks;

  const correctionDays = Math.round(
    prematureWeeks * 7,
  );

  return {
    chronologicalAgeDays,
    correctedAgeDays: Math.max(
      0,
      chronologicalAgeDays - correctionDays,
    ),
    usedCorrectedAge: true,
  };
}
