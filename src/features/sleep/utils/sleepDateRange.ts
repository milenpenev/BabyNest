export interface SleepDateRange {
  startedAt: Date;
  endedAt: Date;
  continuesNextDay: boolean;
  durationSeconds: number;
}

function createLocalDate(dateValue: string, timeValue: string) {
  const dateParts = dateValue.split("-").map(Number);
  const timeParts = timeValue.split(":").map(Number);
  if (dateParts.length !== 3 || timeParts.length !== 2) return null;
  const [year, month, day] = dateParts;
  const [hours, minutes] = timeParts;
  if (!year || !month || !day || !Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null;
  return result;
}

/** Builds a local sleep range from one calendar date and two clock values.
 * An earlier end clock belongs to the next local calendar day. */
export function createSleepDateRange(dateValue: string, startTime: string, endTime: string): SleepDateRange | null {
  const startedAt = createLocalDate(dateValue, startTime);
  const sameDayEnd = createLocalDate(dateValue, endTime);
  if (!startedAt || !sameDayEnd) return null;
  const continuesNextDay = sameDayEnd.getTime() < startedAt.getTime();
  const endedAt = new Date(sameDayEnd);
  if (continuesNextDay) endedAt.setDate(endedAt.getDate() + 1);
  return {
    startedAt,
    endedAt,
    continuesNextDay,
    durationSeconds: Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
  };
}
