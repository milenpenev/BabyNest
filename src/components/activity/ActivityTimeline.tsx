import { diaper } from "@lucide/lab";
import {
  Baby,
  Bath,
  BedDouble,
  Clock3,
  Icon,
  Milk,
  Pause,
  Pill,
  Ruler,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  Activity,
  BathType,
  DiaperType,
} from "../../entities/activity/model/activity.types";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateValue, formatLength, formatTimeValue, formatWeight } from "../../features/settings/utils/formatting";
import { localDayKey } from "../../features/sleep/utils/sleepSegments";
import { useFamilyStore } from "../../store/familyStore";
import { getCurrentFamilyMember } from "../../store/familyStore";
import { hasFamilyPermission } from "../../features/family/permissions/familyPermissions";

interface ActivityTimelineProps {
  entries: TimelineEntry[];
  onSelect: (activity: Activity, sleepSegment?: SleepDaySegment) => void;
  onDelete: (activity: Activity) => void;
}

export interface TimelineEntry {
  key: string;
  activity: Activity;
  sleepSegment?: SleepDaySegment;
  isActive?: boolean;
}

function formatDuration(seconds: number, language: string) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (language === "bg") {
    return hours > 0
      ? `${hours}ч ${minutes}м`
      : `${minutes}м`;
  }

  return hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;
}

function calculateSleepDurationSeconds(activity: Activity) {
  if (
    activity.type !== "sleep" ||
    !activity.endedAt
  ) {
    return 0;
  }

  const startedAt = new Date(
    activity.startedAt,
  ).getTime();

  const endedAt = new Date(
    activity.endedAt,
  ).getTime();

  if (
    Number.isNaN(startedAt) ||
    Number.isNaN(endedAt)
  ) {
    return 0;
  }

  const fullDurationSeconds = Math.max(
    0,
    Math.floor((endedAt - startedAt) / 1000),
  );

  return Math.max(
    0,
    fullDurationSeconds -
      (activity.data.pausedDurationSeconds ?? 0),
  );
}

function getDiaperTypeTranslationKey(
  diaperType: DiaperType,
) {
  const keys: Record<DiaperType, string> = {
    wet: "activity.wetDiaper",
    dirty: "activity.dirtyDiaper",
    mixed: "activity.mixedDiaper",
  };

  return keys[diaperType];
}

function getBathTypeTranslationKey(
  bathType: BathType,
) {
  const keys: Record<BathType, string> = {
    "full-bath": "activity.fullBath",
    "quick-wash": "activity.quickWash",
    "hair-wash": "activity.hairWash",
  };

  return keys[bathType];
}

export default function ActivityTimeline({
  entries,
  onSelect,
  onDelete,
}: ActivityTimelineProps) {
  const { t, i18n } = useTranslation();

  const timeFormat = useAppSettingsStore((state) => state.timeFormat);
  const dateFormat = useAppSettingsStore((state) => state.dateFormat);
  const weightUnit = useAppSettingsStore((state) => state.weightUnit);
  const lengthUnit = useAppSettingsStore((state) => state.lengthUnit);
  const members = useFamilyStore((state) => state.members);
  const canDelete = hasFamilyPermission(getCurrentFamilyMember(), "canDeleteActivities");

  return (
    <div className="relative mt-6 space-y-0">
      <div className="absolute bottom-5 left-[21px] top-5 w-px bg-slate-200 dark:bg-slate-700" />

      {entries.map(({ key, activity, sleepSegment, isActive: isActiveEntry }) => {
        const creator = members.find((member) => member.id === activity.createdBy);
        const editor = members.find((member) => member.id === activity.updatedBy);
        const isSleep = activity.type === "sleep";
        const isBottle = activity.type === "bottle";
        const isBreastfeeding =
          activity.type === "breastfeeding";
        const isDiaper = activity.type === "diaper";
        const isMedicine =
          activity.type === "medicine";
        const isBath = activity.type === "bath";
        const isGrowth = activity.type === "growth";

        const sleepDurationSeconds = sleepSegment?.activeDurationSeconds ?? calculateSleepDurationSeconds(activity);

        const pausedDurationSeconds = isSleep
          ? (sleepSegment?.pausedDurationSeconds ?? activity.data.pausedDurationSeconds ?? 0)
          : 0;

        const breastfeedingDurationSeconds =
          isBreastfeeding
            ? activity.data.leftDurationSeconds +
              activity.data.rightDurationSeconds
            : 0;

        let title = sleepSegment && !sleepSegment.isFirstSegment ? t("sleepSegments.sleepContinued") : sleepSegment?.crossesMidnight ? t("sleepSegments.overnightSleep") : t("activity.sleep");

        let badge = formatDuration(
          sleepDurationSeconds,
          i18n.language,
        );

        let iconVariant:
          | "sleep"
          | "bottle"
          | "breastfeeding"
          | "diaper"
          | "medicine"
          | "bath"
          | "growth" = "sleep";

        let iconClass =
          "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white";

        let badgeClass =
          "bg-indigo-50 text-indigo-700";

        if (isBottle) {
          title = t("activity.bottle");
          badge = `${activity.data.amountMl} ml`;
          iconVariant = "bottle";

          iconClass =
            "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white";

          badgeClass =
            "bg-emerald-50 text-emerald-700";
        }

        if (isBreastfeeding) {
          title = t("activity.breastfeeding");

          badge = formatDuration(
            breastfeedingDurationSeconds,
            i18n.language,
          );

          iconVariant = "breastfeeding";

          iconClass =
            "bg-pink-100 text-pink-700 group-hover:bg-pink-600 group-hover:text-white";

          badgeClass = "bg-pink-50 text-pink-700";
        }

        if (isDiaper) {
          title = t("activity.diaper");

          badge = t(
            getDiaperTypeTranslationKey(
              activity.data.diaperType,
            ),
          );

          iconVariant = "diaper";

          iconClass =
            "bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white";

          badgeClass =
            "bg-amber-50 text-amber-700";
        }

        if (isMedicine) {
          title = t("activity.medicine");
          badge = activity.data.dose;
          iconVariant = "medicine";

          iconClass =
            "bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white";

          badgeClass =
            "bg-rose-50 text-rose-700";
        }

        if (isBath) {
          title = t("activity.bath");

          badge = t(
            getBathTypeTranslationKey(
              activity.data.bathType,
            ),
          );

          iconVariant = "bath";

          iconClass =
            "bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white";

          badgeClass =
            "bg-sky-50 text-sky-700";
        }

        if (isGrowth) {
          title = t("activity.growth");
          iconVariant = "growth";

          const measurements: string[] = [];

          if (
            activity.data.weightKg !== undefined
          ) {
            measurements.push(formatWeight(activity.data.weightKg,weightUnit,i18n.language));
          }

          if (
            activity.data.heightCm !== undefined
          ) {
            measurements.push(formatLength(activity.data.heightCm,lengthUnit,i18n.language));
          }

          if (activity.data.headCircumferenceCm !== undefined) measurements.push(formatLength(activity.data.headCircumferenceCm,lengthUnit,i18n.language));

          badge = measurements.join(" · ") || "—";

          iconClass =
            "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white";

          badgeClass =
            "bg-violet-50 text-violet-700";
        }

        return (
          <article
            key={key}
            className="group relative flex gap-4 rounded-2xl px-1 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-900/70"
          >
            <div
              className={[
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-4 border-white shadow-sm transition dark:border-slate-800",
                iconClass,
              ].join(" ")}
            >
              {iconVariant === "sleep" && (
                <BedDouble className="h-5 w-5" />
              )}

              {iconVariant === "bottle" && (
                <Milk className="h-5 w-5" />
              )}

              {iconVariant === "breastfeeding" && (
                <Baby className="h-5 w-5" />
              )}

              {iconVariant === "diaper" && (
                <Icon
                  iconNode={diaper}
                  className="h-5 w-5"
                />
              )}

              {iconVariant === "medicine" && (
                <Pill className="h-5 w-5" />
              )}

              {iconVariant === "bath" && (
                <Bath className="h-5 w-5" />
              )}

              {iconVariant === "growth" && (
                <Ruler className="h-5 w-5" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition group-hover:border-indigo-200 group-hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:group-hover:border-indigo-800">
              <button
                type="button"
                onClick={() => { if (!isActiveEntry) onSelect(activity, sleepSegment); }}
                className="min-w-0 flex-1 text-left"
                aria-label={t("activity.openDetails")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeValue(
                        sleepSegment?.segmentStartedAt ?? activity.startedAt,
                        timeFormat,
                        i18n.language,
                      )}

                      {isSleep && (sleepSegment || activity.endedAt)
                        ? ` – ${formatTimeValue(
                            sleepSegment?.segmentEndedAt ?? activity.endedAt!,
                            timeFormat,
                            i18n.language,
                          )}`
                        : ""}
                    </p>
                  </div>

                  <div
                    className={[
                      "max-w-full rounded-full px-3 py-1 text-sm font-semibold",
                      badgeClass,
                    ].join(" ")}
                  >
                    {badge}
                  </div>
                </div>

                {isSleep && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5">
                      <Clock3 className="h-3.5 w-3.5" />

                      {t("activity.duration")}:{" "}
                      {formatDuration(
                        sleepDurationSeconds,
                        i18n.language,
                      )}
                    </span>

                    {pausedDurationSeconds > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700">
                        <Pause className="h-3.5 w-3.5" />

                        {t("activity.pausedDuration")}:{" "}
                        {formatDuration(
                          pausedDurationSeconds,
                          i18n.language,
                        )}
                      </span>
                    )}
                    {sleepSegment?.crossesMidnight ? (
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-700">
                        {sleepSegment.isFirstSegment && !sleepSegment.isLastSegment
                          ? t("sleepSegments.continuesTomorrow")
                          : t("sleepSegments.continuedFromPreviousDay")}
                      </span>
                    ) : null}
                    {sleepSegment && !sleepSegment.isFirstSegment ? (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1.5">
                        {(() => {
                          const segmentDay = new Date(`${sleepSegment.dayKey}T12:00:00`);
                          const previousDay = new Date(segmentDay);
                          previousDay.setDate(previousDay.getDate() - 1);
                          return localDayKey(new Date(sleepSegment.originalStartedAt)) === localDayKey(previousDay)
                            ? t("sleepSegments.startedYesterday")
                            : t("sleepSegments.startedOn", { date: formatDateValue(sleepSegment.originalStartedAt, dateFormat, i18n.language) });
                        })()}
                      </span>
                    ) : null}
                  </div>
                )}

                {isBottle && (
                  <div className="mt-3 text-xs font-medium text-emerald-700">
                    {activity.data.milkType ===
                    "breast-milk"
                      ? t("activity.breastMilk")
                      : t("activity.formula")}
                  </div>
                )}

                {isBreastfeeding && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-lg bg-pink-50 px-2.5 py-1.5 text-pink-700">
                      {t("activity.leftBreast")}:{" "}
                      {formatDuration(
                        activity.data
                          .leftDurationSeconds,
                        i18n.language,
                      )}
                    </span>

                    <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">
                      {t("activity.rightBreast")}:{" "}
                      {formatDuration(
                        activity.data
                          .rightDurationSeconds,
                        i18n.language,
                      )}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
                      {t("activity.firstBreast")}:{" "}
                      {activity.data.firstSide ===
                      "left"
                        ? t("activity.leftBreast")
                        : t("activity.rightBreast")}
                    </span>
                  </div>
                )}

                {isDiaper && (
                  <div className="mt-3 text-xs font-medium text-amber-700">
                    {t("activity.changeTime")}:{" "}
                    {formatTimeValue(
                      activity.startedAt,
                      timeFormat,
                      i18n.language,
                    )}
                  </div>
                )}

                {isMedicine && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-700">
                      {activity.data.medicineName}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
                      {t("activity.dose")}:{" "}
                      {activity.data.dose}
                    </span>
                  </div>
                )}

                {isBath && (
                  <div className="mt-3 text-xs font-medium text-sky-700">
                    {t("activity.bathType")}:{" "}
                    {t(
                      getBathTypeTranslationKey(
                        activity.data.bathType,
                      ),
                    )}
                  </div>
                )}

                {isGrowth && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-violet-700">
                    {activity.data.weightKg !==
                      undefined && (
                      <span className="rounded-lg bg-violet-50 px-2.5 py-1.5">
                        {activity.data.weightKg} kg
                      </span>
                    )}

                    {activity.data.heightCm !==
                      undefined && (
                      <span className="rounded-lg bg-violet-50 px-2.5 py-1.5">
                        {activity.data.heightCm} cm
                      </span>
                    )}

                    {activity.data
                      .headCircumferenceCm !==
                      undefined && (
                      <span className="rounded-lg bg-violet-50 px-2.5 py-1.5">
                        {
                          activity.data
                            .headCircumferenceCm
                        }{" "}
                        cm
                      </span>
                    )}
                  </div>
                )}

                {activity.createdBy ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{creator?.displayName.slice(0, 1).toUpperCase() ?? "?"}</span><span>{t("family.timeline.recordedBy", { name: creator?.displayName ?? t("family.timeline.unknown") })}</span>{editor && editor.id !== creator?.id ? <span>· {t("family.timeline.editedBy", { name: editor.displayName })}</span> : null}</div> : null}
              </button>

              {!isActiveEntry && canDelete ? <button
                type="button"
                onClick={() => onDelete(activity)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={t("activity.deleteActivity")}
                title={t("activity.delete")}
              >
                <Trash2 className="h-5 w-5" />
              </button> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
