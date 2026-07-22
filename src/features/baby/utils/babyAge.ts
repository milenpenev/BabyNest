export interface BabyAge {
  years: number;
  months: number;
  weeks: number;
  days: number;
  totalDays: number;
}

export function calculateBabyAge(
  birthday: string,
  referenceDate = new Date(),
): BabyAge {
  const birth = new Date(birthday);

  let years = referenceDate.getFullYear() - birth.getFullYear();
  let months = referenceDate.getMonth() - birth.getMonth();
  let days = referenceDate.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;

    const previousMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      0,
    );

    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.max(
    0,
    Math.floor(
      (referenceDate.getTime() - birth.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    weeks: Math.floor(totalDays / 7),
    days: Math.max(0, days),
    totalDays,
  };
}

export function formatBabyAgeInWeeks(
  age: BabyAge,
  language: string,
): string {
  const remainingDays = age.totalDays % 7;

  if (language === "bg") {
    const weeksLabel = age.weeks === 1 ? "седмица" : "седмици";
    const daysLabel = remainingDays === 1 ? "ден" : "дни";
    return `${age.weeks} ${weeksLabel} и ${remainingDays} ${daysLabel}`;
  }

  const weeksLabel = age.weeks === 1 ? "week" : "weeks";
  const daysLabel = remainingDays === 1 ? "day" : "days";
  return `${age.weeks} ${weeksLabel} and ${remainingDays} ${daysLabel}`;
}

export function formatBabyAge(
  age: BabyAge,
  language: string,
): string {
  if (language === "bg") {
    if (age.years > 0) {
      return `${age.years} г. ${age.months} мес. ${age.days} дни`;
    }

    if (age.months > 0) {
      return `${age.months} мес. ${age.days} дни`;
    }

    if (age.weeks > 0) {
      return `${age.weeks} седм. ${age.days % 7} дни`;
    }

    return `${age.days} дни`;
  }

  if (age.years > 0) {
    return `${age.years}y ${age.months}m ${age.days}d`;
  }

  if (age.months > 0) {
    return `${age.months}m ${age.days}d`;
  }

  if (age.weeks > 0) {
    return `${age.weeks}w ${age.days % 7}d`;
  }

  return `${age.days}d`;
}
