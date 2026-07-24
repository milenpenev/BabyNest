import type { SleepActivity } from "../../../entities/activity/model/activity.types";

export const SLEEP_PERIODS = {
  earliestNapStartHour: 6,
  dayStartsAtHour: 8,
  nightStartsAtHour: 20,
  nightResumptionGapMinutes: 45,
} as const;

export type SleepKind = "day" | "night";

export interface SleepDaySegment {
  segmentId: string;
  intervalId: string;
  activityId: string;
  babyId: string;
  dayKey: string;
  sleepKind: SleepKind;
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

interface ParsedSleepInterval {
  intervalId: string;
  activityId: string;
  babyId: string;
  startedAt: Date;
  endedAt: Date;
  activeDurationSeconds: number;
}

interface MergedSleepInterval {
  intervalId: string;
  activityId: string;
  babyId: string;
  startedAt: Date;
  endedAt: Date;
  activeDurationSeconds: number;
  sleepKind: SleepKind;
}

export function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function localStartOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function nextLocalStartOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
}

export function intervalsOverlap(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return (
    start.getTime() < rangeEnd.getTime() &&
    end.getTime() > rangeStart.getTime()
  );
}

function allocateIntegerTotal(
  total: number,
  weights: number[],
) {
  const safeTotal = Math.max(0, Math.floor(total));

  const weightTotal = weights.reduce(
    (sum, value) => sum + Math.max(0, value),
    0,
  );

  if (weights.length === 0 || weightTotal <= 0) {
    return weights.map(() => 0);
  }

  let allocated = 0;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) {
      return safeTotal - allocated;
    }

    const value = Math.floor(
      (safeTotal * Math.max(0, weight)) / weightTotal,
    );

    allocated += value;

    return value;
  });
}

function splitIntervalByLocalDay(
  start: Date,
  end: Date,
) {
  const pieces: Array<{
    start: Date;
    end: Date;
  }> = [];

  let cursor = new Date(start);

  while (cursor.getTime() < end.getTime()) {
    const boundary = nextLocalStartOfDay(cursor);

    const pieceEnd = new Date(
      Math.min(end.getTime(), boundary.getTime()),
    );

    if (pieceEnd.getTime() <= cursor.getTime()) {
      break;
    }

    pieces.push({
      start: new Date(cursor),
      end: pieceEnd,
    });

    cursor = pieceEnd;
  }

  return pieces;
}

/**
 * Older BabyNest versions could save an overnight end clock on the same
 * calendar date as the start, for example 22:00 → 07:00.
 */
export function resolveSleepEnd(
  start: Date,
  storedEnd: Date,
) {
  if (storedEnd.getTime() >= start.getTime()) {
    return storedEnd;
  }

  if (localDayKey(storedEnd) !== localDayKey(start)) {
    return storedEnd;
  }

  const repaired = new Date(storedEnd);
  repaired.setDate(repaired.getDate() + 1);

  const duration = repaired.getTime() - start.getTime();

  return duration > 0 && duration < 24 * 60 * 60 * 1000
    ? repaired
    : storedEnd;
}

function parseSleepActivity(
  activity: SleepActivity,
): ParsedSleepInterval | null {
  // Persisted sleep rows without endedAt are unfinished drafts.
  // They must not be treated as sleeping until "now", because the
  // corresponding active timer may already have been cancelled or lost
  // during logout, account switch, or cloud restoration.
  //
  // The real currently running sleep is handled separately through
  // activityStore.activeActivity by DashboardHero.
  if (!activity.endedAt) {
    return null;
  }

  const startedAt = new Date(activity.startedAt);
  const storedEnd = new Date(activity.endedAt);
  const endedAt = resolveSleepEnd(
    startedAt,
    storedEnd,
  );

  if (
    Number.isNaN(startedAt.getTime()) ||
    Number.isNaN(endedAt.getTime()) ||
    endedAt.getTime() <= startedAt.getTime()
  ) {
    return null;
  }

  const rawDurationSeconds = Math.floor(
    (endedAt.getTime() - startedAt.getTime()) / 1000,
  );

  const pausedDurationSeconds = Math.min(
    rawDurationSeconds,
    Math.max(
      0,
      Math.floor(
        activity.data.pausedDurationSeconds ?? 0,
      ),
    ),
  );

  return {
    intervalId: activity.id,
    activityId: activity.id,
    babyId: activity.babyId,
    startedAt,
    endedAt,
    activeDurationSeconds: Math.max(
      0,
      rawDurationSeconds - pausedDurationSeconds,
    ),
  };
}

function localHourWithMinutes(date: Date) {
  return date.getHours() + date.getMinutes() / 60;
}

function classifySleepInterval(
  interval: Omit<MergedSleepInterval, "sleepKind">,
  previous: MergedSleepInterval | null,
): SleepKind {
  const startHour = localHourWithMinutes(
    interval.startedAt,
  );

  // Evening and early-morning sleep is always night sleep.
  if (
    startHour >= SLEEP_PERIODS.nightStartsAtHour ||
    startHour < SLEEP_PERIODS.earliestNapStartHour
  ) {
    return "night";
  }

  // Between 06:00 and 08:00, it remains night sleep only when it is
  // a continuation after a short awakening.
  if (startHour < SLEEP_PERIODS.dayStartsAtHour) {
    if (!previous || previous.sleepKind !== "night") {
      return "day";
    }

    const awakeGapMinutes =
      (interval.startedAt.getTime() -
        previous.endedAt.getTime()) /
      60_000;

    return awakeGapMinutes <
      SLEEP_PERIODS.nightResumptionGapMinutes
      ? "night"
      : "day";
  }

  return "day";
}

function mergeSleepIntervals(
  activities: SleepActivity[],
  _temporaryEnd: Date,
): MergedSleepInterval[] {
  // Cloud/local sync can temporarily expose the same ID more than once.
  // Keep only one record per activity ID.
  const uniqueActivities = [
    ...new Map(
      activities.map((activity) => [
        activity.id,
        activity,
      ]),
    ).values(),
  ];

  const parsed = uniqueActivities
    .map((activity) =>
      parseSleepActivity(activity),
    )
    .filter(
      (
        interval,
      ): interval is ParsedSleepInterval =>
        interval !== null,
    )
    .sort(
      (first, second) =>
        first.startedAt.getTime() -
        second.startedAt.getTime(),
    );

  const merged: Array<
    Omit<MergedSleepInterval, "sleepKind">
  > = [];

  for (const interval of parsed) {
    const previous = merged.at(-1);

    if (
      !previous ||
      interval.startedAt.getTime() >
        previous.endedAt.getTime()
    ) {
      merged.push({
        ...interval,
      });

      continue;
    }

    // Overlapping records describe the same real-world sleep period.
    // Merge their clock range and cap active time to the union duration,
    // preventing totals greater than the actual length of the day.
    previous.endedAt = new Date(
      Math.max(
        previous.endedAt.getTime(),
        interval.endedAt.getTime(),
      ),
    );

    const unionDurationSeconds = Math.floor(
      (previous.endedAt.getTime() -
        previous.startedAt.getTime()) /
        1000,
    );

    previous.activeDurationSeconds = Math.min(
      unionDurationSeconds,
      previous.activeDurationSeconds +
        interval.activeDurationSeconds,
    );

    previous.intervalId =
      `${previous.intervalId}+${interval.intervalId}`;
  }

  const classified: MergedSleepInterval[] = [];

  for (const interval of merged) {
    const previous = classified.at(-1) ?? null;

    classified.push({
      ...interval,
      sleepKind: classifySleepInterval(
        interval,
        previous,
      ),
    });
  }

  return classified;
}

function splitMergedIntervalByLocalDay(
  interval: MergedSleepInterval,
): SleepDaySegment[] {
  const pieces = splitIntervalByLocalDay(
    interval.startedAt,
    interval.endedAt,
  );

  const rawDurations = pieces.map((piece) =>
    Math.floor(
      (piece.end.getTime() -
        piece.start.getTime()) /
        1000,
    ),
  );

  const allocatedActiveDurations =
    allocateIntegerTotal(
      interval.activeDurationSeconds,
      rawDurations,
    );

  const crossesMidnight = pieces.length > 1;

  return pieces.map((piece, index) => {
    const rawDurationSeconds =
      rawDurations[index] ?? 0;

    const activeDurationSeconds =
      allocatedActiveDurations[index] ?? 0;

    const pausedDurationSeconds = Math.max(
      0,
      rawDurationSeconds - activeDurationSeconds,
    );

    const dayKey = localDayKey(piece.start);

    return {
      segmentId: `${interval.intervalId}:${dayKey}:${index}`,
      intervalId: interval.intervalId,
      activityId: interval.activityId,
      babyId: interval.babyId,
      dayKey,
      sleepKind: interval.sleepKind,
      segmentStartedAt: piece.start.toISOString(),
      segmentEndedAt: piece.end.toISOString(),
      rawDurationSeconds,
      activeDurationSeconds,
      pausedDurationSeconds,
      daySleepSeconds:
        interval.sleepKind === "day"
          ? activeDurationSeconds
          : 0,
      nightSleepSeconds:
        interval.sleepKind === "night"
          ? activeDurationSeconds
          : 0,
      isFirstSegment: index === 0,
      isLastSegment: index === pieces.length - 1,
      crossesMidnight,
      originalStartedAt:
        interval.startedAt.toISOString(),
      originalEndedAt:
        interval.endedAt.toISOString(),
    };
  });
}

/**
 * Builds the authoritative sleep timeline used by Dashboard and Statistics.
 * Duplicate and overlapping records are merged before calculating totals.
 */
export function buildSleepTimelineSegments(
  activities: SleepActivity[],
  temporaryEnd = new Date(),
): SleepDaySegment[] {
  return mergeSleepIntervals(
    activities,
    temporaryEnd,
  ).flatMap(splitMergedIntervalByLocalDay);
}

/**
 * Compatibility helper for pages that render one individual activity.
 * Aggregate statistics should use buildSleepTimelineSegments().
 */
export function splitSleepActivityByLocalDay(
  activity: SleepActivity,
  temporaryEnd = new Date(),
): SleepDaySegment[] {
  return buildSleepTimelineSegments(
    [activity],
    temporaryEnd,
  );
}

export function splitActiveDurationIntoPeriods(
  start: Date,
  end: Date,
  activeDurationSeconds: number,
): SleepPeriodBreakdown {
  const kind = classifySleepInterval(
    {
      intervalId: "temporary",
      activityId: "temporary",
      babyId: "temporary",
      startedAt: start,
      endedAt: end,
      activeDurationSeconds,
    },
    null,
  );

  return {
    daySleepSeconds:
      kind === "day"
        ? Math.max(0, activeDurationSeconds)
        : 0,
    nightSleepSeconds:
      kind === "night"
        ? Math.max(0, activeDurationSeconds)
        : 0,
  };
}

export function reportingNightKey(date: Date) {
  const owner = new Date(date);

  if (
    owner.getHours() <
    SLEEP_PERIODS.dayStartsAtHour
  ) {
    owner.setDate(owner.getDate() - 1);
  }

  return localDayKey(owner);
}

export function aggregateSleepByCalendarDay(
  activities: SleepActivity[],
  temporaryEnd = new Date(),
) {
  const result = new Map<
    string,
    {
      activeSeconds: number;
      daySleepSeconds: number;
      nightSleepSeconds: number;
    }
  >();

  for (const segment of buildSleepTimelineSegments(
    activities,
    temporaryEnd,
  )) {
    const current = result.get(segment.dayKey) ?? {
      activeSeconds: 0,
      daySleepSeconds: 0,
      nightSleepSeconds: 0,
    };

    current.activeSeconds +=
      segment.activeDurationSeconds;

    current.daySleepSeconds +=
      segment.daySleepSeconds;

    current.nightSleepSeconds +=
      segment.nightSleepSeconds;

    result.set(segment.dayKey, current);
  }

  return result;
}

export function aggregateSleepByReportingNight(
  activities: SleepActivity[],
  temporaryEnd = new Date(),
) {
  const result = new Map<string, number>();

  const timeline = buildSleepTimelineSegments(
    activities,
    temporaryEnd,
  );

  const intervals = new Map<
    string,
    {
      startedAt: Date;
      nightSeconds: number;
    }
  >();

  for (const segment of timeline) {
    if (segment.sleepKind !== "night") {
      continue;
    }

    const current = intervals.get(
      segment.intervalId,
    ) ?? {
      startedAt: new Date(
        segment.originalStartedAt,
      ),
      nightSeconds: 0,
    };

    current.nightSeconds +=
      segment.nightSleepSeconds;

    intervals.set(segment.intervalId, current);
  }

  for (const interval of intervals.values()) {
    const key = reportingNightKey(
      interval.startedAt,
    );

    result.set(
      key,
      (result.get(key) ?? 0) +
        interval.nightSeconds,
    );
  }

  return result;
}

export function longestContinuousNightSleepSeconds(
  activity: SleepActivity,
  temporaryEnd = new Date(),
) {
  const segments = buildSleepTimelineSegments(
    [activity],
    temporaryEnd,
  );

  return segments.reduce(
    (total, segment) =>
      total + segment.nightSleepSeconds,
    0,
  );
}
