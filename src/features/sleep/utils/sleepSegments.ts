import type { SleepActivity } from "../../../entities/activity/model/activity.types";

export const SLEEP_PERIODS = {
  dayStartsAtHour: 8,
  nightStartsAtHour: 20,
} as const;

export interface SleepDaySegment {
  segmentId: string;
  activityId: string;
  babyId: string;
  dayKey: string;
  segmentStartedAt: string;
  segmentEndedAt: string;
  rawDurationSeconds: number;
  activeDurationSeconds: number;
  pausedDurationSeconds: number;
  daySleepSeconds: number;
  nightSleepSeconds: number;
  isFirstSegment: boolean;
  isLastSegment: boolean;
  crossesMidnight: boolean;
  originalStartedAt: string;
  originalEndedAt: string;
}

export interface SleepPeriodBreakdown {
  daySleepSeconds: number;
  nightSleepSeconds: number;
}

export function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function nextLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function intervalsOverlap(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  return start.getTime() < rangeEnd.getTime() && end.getTime() > rangeStart.getTime();
}

function allocateIntegerTotal(total: number, weights: number[]) {
  const safeTotal = Math.max(0, Math.floor(total));
  const weightTotal = weights.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (weights.length === 0 || weightTotal <= 0) return weights.map(() => 0);
  let allocated = 0;
  return weights.map((weight, index) => {
    if (index === weights.length - 1) return safeTotal - allocated;
    const value = Math.floor((safeTotal * Math.max(0, weight)) / weightTotal);
    allocated += value;
    return value;
  });
}

function splitIntervalByLocalDay(start: Date, end: Date) {
  const pieces: Array<{ start: Date; end: Date }> = [];
  let cursor = new Date(start);
  while (cursor.getTime() < end.getTime()) {
    const boundary = nextLocalStartOfDay(cursor);
    const pieceEnd = new Date(Math.min(end.getTime(), boundary.getTime()));
    if (pieceEnd.getTime() <= cursor.getTime()) break;
    pieces.push({ start: new Date(cursor), end: pieceEnd });
    cursor = pieceEnd;
  }
  return pieces;
}

/**
 * Older BabyNest versions could persist an overnight end clock on the same
 * calendar date as the start (for example 22:00 -> 07:00). Keep those records
 * visible and editable by interpreting only that narrow legacy shape as the
 * following local day. Equal clocks are intentionally not repaired because
 * they represent an invalid/ambiguous 24-hour range.
 */
export function resolveSleepEnd(start: Date, storedEnd: Date) {
  if (storedEnd.getTime() >= start.getTime()) return storedEnd;
  if (localDayKey(storedEnd) !== localDayKey(start)) return storedEnd;

  const repaired = new Date(storedEnd);
  repaired.setDate(repaired.getDate() + 1);
  const duration = repaired.getTime() - start.getTime();
  return duration > 0 && duration < 24 * 60 * 60 * 1000 ? repaired : storedEnd;
}

function rawPeriodSeconds(start: Date, end: Date): SleepPeriodBreakdown {
  let cursor = new Date(start);
  let daySleepSeconds = 0;
  let nightSleepSeconds = 0;
  while (cursor.getTime() < end.getTime()) {
    const dayStart = localStartOfDay(cursor);
    const eight = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), SLEEP_PERIODS.dayStartsAtHour);
    const twenty = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), SLEEP_PERIODS.nightStartsAtHour);
    const nextBoundary = cursor.getTime() < eight.getTime() ? eight : cursor.getTime() < twenty.getTime() ? twenty : nextLocalStartOfDay(cursor);
    const pieceEnd = new Date(Math.min(end.getTime(), nextBoundary.getTime()));
    const seconds = Math.max(0, Math.floor((pieceEnd.getTime() - cursor.getTime()) / 1000));
    if (cursor.getHours() >= SLEEP_PERIODS.dayStartsAtHour && cursor.getHours() < SLEEP_PERIODS.nightStartsAtHour) daySleepSeconds += seconds;
    else nightSleepSeconds += seconds;
    cursor = pieceEnd;
  }
  return { daySleepSeconds, nightSleepSeconds };
}

export function splitActiveDurationIntoPeriods(start: Date, end: Date, activeDurationSeconds: number): SleepPeriodBreakdown {
  const raw = rawPeriodSeconds(start, end);
  const [daySleepSeconds, nightSleepSeconds] = allocateIntegerTotal(
    Math.min(Math.max(0, activeDurationSeconds), raw.daySleepSeconds + raw.nightSleepSeconds),
    [raw.daySleepSeconds, raw.nightSleepSeconds],
  );
  return { daySleepSeconds, nightSleepSeconds };
}

export function splitSleepActivityByLocalDay(
  activity: SleepActivity,
  temporaryEnd?: Date,
): SleepDaySegment[] {
  const start = new Date(activity.startedAt);
  const storedEnd = activity.endedAt ? new Date(activity.endedAt) : temporaryEnd;
  const end = storedEnd && activity.endedAt ? resolveSleepEnd(start, storedEnd) : storedEnd;
  if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) return [];

  const pieces = splitIntervalByLocalDay(start, end);
  const originalRawSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const rawFloors = pieces.map((piece) => Math.floor((piece.end.getTime() - piece.start.getTime()) / 1000));
  const rawDurations = [...rawFloors];
  if (rawDurations.length > 0) rawDurations[rawDurations.length - 1] += originalRawSeconds - rawFloors.reduce((sum, value) => sum + value, 0);

  // Persisted activities contain only a total pause. Without exact pause intervals,
  // pauses are allocated proportionally by raw segment duration; the final segment
  // receives the deterministic integer rounding remainder.
  const totalPause = Math.min(originalRawSeconds, Math.max(0, Math.floor(activity.data.pausedDurationSeconds ?? 0)));
  const pauses = allocateIntegerTotal(totalPause, rawDurations);
  const crossesMidnight = pieces.length > 1;

  return pieces.map((piece, index) => {
    const rawDurationSeconds = rawDurations[index];
    const pausedDurationSeconds = Math.min(rawDurationSeconds, pauses[index]);
    const activeDurationSeconds = Math.max(0, rawDurationSeconds - pausedDurationSeconds);
    const periods = splitActiveDurationIntoPeriods(piece.start, piece.end, activeDurationSeconds);
    const dayKey = localDayKey(piece.start);
    return {
      segmentId: `${activity.id}:${dayKey}`,
      activityId: activity.id,
      babyId: activity.babyId,
      dayKey,
      segmentStartedAt: piece.start.toISOString(),
      segmentEndedAt: piece.end.toISOString(),
      rawDurationSeconds,
      activeDurationSeconds,
      pausedDurationSeconds,
      daySleepSeconds: periods.daySleepSeconds,
      nightSleepSeconds: periods.nightSleepSeconds,
      isFirstSegment: index === 0,
      isLastSegment: index === pieces.length - 1,
      crossesMidnight,
      originalStartedAt: activity.startedAt,
      originalEndedAt: end.toISOString(),
    };
  });
}

export function reportingNightKey(date: Date) {
  const owner = new Date(date);
  if (owner.getHours() < SLEEP_PERIODS.dayStartsAtHour) owner.setDate(owner.getDate() - 1);
  return localDayKey(owner);
}

export function aggregateSleepByCalendarDay(activities: SleepActivity[], temporaryEnd = new Date()) {
  const result = new Map<string, { activeSeconds: number; daySleepSeconds: number; nightSleepSeconds: number }>();
  for (const activity of activities) {
    for (const segment of splitSleepActivityByLocalDay(activity, temporaryEnd)) {
      const current = result.get(segment.dayKey) ?? { activeSeconds: 0, daySleepSeconds: 0, nightSleepSeconds: 0 };
      current.activeSeconds += segment.activeDurationSeconds;
      current.daySleepSeconds += segment.daySleepSeconds;
      current.nightSleepSeconds += segment.nightSleepSeconds;
      result.set(segment.dayKey, current);
    }
  }
  return result;
}

export function aggregateSleepByReportingNight(activities: SleepActivity[], temporaryEnd = new Date()) {
  const result = new Map<string, number>();
  for (const activity of activities) {
    for (const segment of splitSleepActivityByLocalDay(activity, temporaryEnd)) {
      if (segment.nightSleepSeconds <= 0) continue;
      const segmentStart = new Date(segment.segmentStartedAt);
      const segmentEnd = new Date(segment.segmentEndedAt);
      const dayStart = localStartOfDay(segmentStart);
      const morningEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), SLEEP_PERIODS.dayStartsAtHour);
      const eveningStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), SLEEP_PERIODS.nightStartsAtHour);
      const overlapSeconds = (start: Date, end: Date) => Math.max(0, Math.floor((Math.min(segmentEnd.getTime(), end.getTime()) - Math.max(segmentStart.getTime(), start.getTime())) / 1000));
      const morningRaw = overlapSeconds(dayStart, morningEnd);
      const eveningRaw = overlapSeconds(eveningStart, nextLocalStartOfDay(dayStart));
      const [morningActive, eveningActive] = allocateIntegerTotal(segment.nightSleepSeconds, [morningRaw, eveningRaw]);
      if (morningActive > 0) {
        const key = reportingNightKey(dayStart);
        result.set(key, (result.get(key) ?? 0) + morningActive);
      }
      if (eveningActive > 0) {
        const key = localDayKey(dayStart);
        result.set(key, (result.get(key) ?? 0) + eveningActive);
      }
    }
  }
  return result;
}

export function longestContinuousNightSleepSeconds(activity: SleepActivity, temporaryEnd = new Date()) {
  const reportingNights = [...aggregateSleepByReportingNight([activity], temporaryEnd).values()];
  return reportingNights.length ? Math.max(...reportingNights) : 0;
}
