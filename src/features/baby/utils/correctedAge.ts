// Corrected age is an informational calculation and not medical guidance.
export interface CorrectedAgeInfo {
  chronologicalWeeks: number;
  correctedWeeks: number;
  weeksPremature: number;
  isAvailable: boolean;
}

export function calculateCorrectedAge(
  birthday: string,
  gestationalWeek?: number,
  referenceDate = new Date(),
): CorrectedAgeInfo {
  const birthDate = new Date(birthday);

  if (Number.isNaN(birthDate.getTime())) {
    return {
      chronologicalWeeks: 0,
      correctedWeeks: 0,
      weeksPremature: 0,
      isAvailable: false,
    };
  }

  const chronologicalWeeks = Math.max(
    0,
    Math.floor(
      (referenceDate.getTime() - birthDate.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    ),
  );

  if (gestationalWeek === undefined) {
    return {
      chronologicalWeeks,
      correctedWeeks: 0,
      weeksPremature: 0,
      isAvailable: false,
    };
  }

  const weeksPremature = Math.max(0, 40 - gestationalWeek);
  const correctedWeeks = Math.max(0, chronologicalWeeks - weeksPremature);

  return {
    chronologicalWeeks,
    correctedWeeks,
    weeksPremature,
    isAvailable: true,
  };
}
