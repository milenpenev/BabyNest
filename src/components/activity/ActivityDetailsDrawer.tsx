import {
  BedDouble,
  Check,
  Clock3,
  MapPin,
  Pause,
  Pencil,
  Save,
  StickyNote,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BreastfeedingActivityDetails from "./BreastfeedingActivityDetails";
import DiaperActivityDetails from "./DiaperActivityDetails";
import BathActivityDetails from "./BathActivityDetails";
import MedicineActivityDetails from "./MedicineActivityDetails";
import GrowthActivityDetails from "./GrowthActivityDetails";

import type {
  Activity,
  SleepActivity,
  SleepLocation,
} from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import BottleActivityDetails from "./BottleActivityDetails";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateTimeValue, formatDateValue } from "../../features/settings/utils/formatting";
import type { SleepDaySegment } from "../../features/sleep/utils/sleepSegments";
import { createSleepDateRange } from "../../features/sleep/utils/sleepDateRange";

interface ActivityDetailsDrawerProps {
  activity: Activity | null;
  sleepSegment?: SleepDaySegment | null;
  onClose: () => void;
}

function formatSeconds(seconds: number, language: string) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (language === "bg") {
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${remainingSeconds}с`;
    }

    if (minutes > 0) {
      return `${minutes}м ${remainingSeconds}с`;
    }

    return `${remainingSeconds}с`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function toDateInputValue(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function calculateTotalDurationSeconds(activity: Activity) {
  if (!activity.endedAt) {
    return 0;
  }

  const startedAt = new Date(activity.startedAt).getTime();
  const endedAt = new Date(activity.endedAt).getTime();

  if (
    Number.isNaN(startedAt) ||
    Number.isNaN(endedAt)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((endedAt - startedAt) / 1000),
  );
}

function getPausedDurationSeconds(activity: Activity) {
  if (activity.type !== "sleep") {
    return 0;
  }

  return activity.data.pausedDurationSeconds ?? 0;
}

function getLocationTranslationKey(
  location: SleepLocation,
) {
  const keys: Record<SleepLocation, string> = {
    crib: "activity.crib",
    "parents-bed": "activity.parentsBed",
    stroller: "activity.stroller",
    car: "activity.car",
    other: "activity.other",
  };

  return keys[location];
}

export default function ActivityDetailsDrawer({
  activity,
  sleepSegment,
  onClose,
}: ActivityDetailsDrawerProps) {
  const { t, i18n } = useTranslation();
  const timeFormat = useAppSettingsStore((state) => state.timeFormat);
  const dateFormat = useAppSettingsStore((state) => state.dateFormat);

  const updateActivity = useActivityStore(
    (state) => state.updateActivity,
  );

  const storedActivity = useActivityStore((state) => {
    if (!activity) {
      return undefined;
    }

    return state.activities.find(
      (stored) => stored.id === activity.id,
    );
  });

  const currentActivity = storedActivity ?? activity;

  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [startedTimeValue, setStartedTimeValue] =
    useState("");
  const [endedTimeValue, setEndedTimeValue] =
    useState("");
  const [pausedMinutesValue, setPausedMinutesValue] =
    useState("0");
  const [locationValue, setLocationValue] =
    useState<SleepLocation>("crib");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function fillSleepForm(activityToUse: Activity) {
    setDateValue(
      toDateInputValue(activityToUse.startedAt),
    );

    setStartedTimeValue(
      toTimeInputValue(activityToUse.startedAt),
    );

    setEndedTimeValue(
      activityToUse.endedAt
        ? toTimeInputValue(activityToUse.endedAt)
        : "",
    );

    setPausedMinutesValue(
      String(
        Math.floor(
          getPausedDurationSeconds(activityToUse) / 60,
        ),
      ),
    );

    if (activityToUse.type === "sleep") {
      setLocationValue(
        activityToUse.data.location ?? "crib",
      );
    } else {
      setLocationValue("crib");
    }

    setNoteValue(activityToUse.note ?? "");
    setError("");
  }

  useEffect(() => {
    if (!currentActivity) {
      return;
    }

    fillSleepForm(currentActivity);
    setIsEditing(false);
    setSaved(false);
  }, [currentActivity]);

  if (!currentActivity) {
    return null;
  }

  const isBottle = currentActivity.type === "bottle";
  const isSleep = currentActivity.type === "sleep";
  const isBreastfeeding = currentActivity.type === "breastfeeding";
  const isDiaper = currentActivity.type === "diaper";
  const isMedicine = currentActivity.type === "medicine";
  const isBath = currentActivity.type === "bath";
  const isGrowth = currentActivity.type === "growth";

  const drawerTitle = isBottle
  ? t("activity.bottle")
  : isBreastfeeding
    ? t("activity.breastfeeding")
    : isDiaper
      ? t("activity.diaper")
      : isMedicine
        ? t("activity.medicine")
        : isBath
          ? t("activity.bath")
          : isGrowth
            ? t("activity.growth")
            : t("activity.sleep");
            

  const totalDurationSeconds =
    calculateTotalDurationSeconds(currentActivity);

  const pausedDurationSeconds =
    getPausedDurationSeconds(currentActivity);

  const activeDurationSeconds = Math.max(
    0,
    totalDurationSeconds - pausedDurationSeconds,
  );

  const sleepActivity: SleepActivity | null = isSleep
    ? currentActivity
    : null;
  const editorRange = isSleep ? createSleepDateRange(dateValue, startedTimeValue, endedTimeValue) : null;

  const location = sleepActivity?.data.location;

  function handleSaveSleep() {
    if (!sleepActivity) {
      return;
    }

    const range = createSleepDateRange(dateValue, startedTimeValue, endedTimeValue);

    if (!range || range.durationSeconds <= 0 || range.durationSeconds > 24 * 60 * 60) {
      setError(t("activity.invalidDates"));
      return;
    }

    const { startedAt, endedAt } = range;

    if (endedAt.getTime() > Date.now()) {
      setError(t("activity.invalidDates"));
      return;
    }

    const totalSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000,
    );

    const parsedPausedMinutes = Number(
      pausedMinutesValue,
    );

    const safePausedMinutes = Number.isFinite(
      parsedPausedMinutes,
    )
      ? Math.max(0, parsedPausedMinutes)
      : 0;

    const newPausedDurationSeconds = Math.round(
      safePausedMinutes * 60,
    );

    if (newPausedDurationSeconds > totalSeconds) {
      setError(t("activity.invalidPausedDuration"));
      return;
    }

    const updatedSleepActivity: SleepActivity = {
      ...sleepActivity,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      note: noteValue.trim() || undefined,
      updatedAt: new Date().toISOString(),
      data: {
        ...sleepActivity.data,
        location: locationValue,
        pausedDurationSeconds:
          newPausedDurationSeconds,
      },
    };

    const updated = updateActivity(
      sleepActivity.id,
      updatedSleepActivity,
    );

    if (!updated) {
      return;
    }

    setError("");
    setSaved(true);
    setIsEditing(false);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function handleCancelSleep() {
    if (!currentActivity) {
      return;
    }

    fillSleepForm(currentActivity);
    setIsEditing(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-details-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              {t("activity.details")}
            </p>

            <h2
              id="activity-details-title"
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
            >
              {drawerTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={t("activity.close")}
            title={t("activity.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isBottle ? (
  <>
    <BottleActivityDetails activity={currentActivity} />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : isBreastfeeding ? (
  <>
    <BreastfeedingActivityDetails
      activity={currentActivity}
    />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : isDiaper ? (
  <>
    <DiaperActivityDetails activity={currentActivity} />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : isMedicine ? (
  <>
    <MedicineActivityDetails
      activity={currentActivity}
    />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : isBath ? (
  <>
    <BathActivityDetails activity={currentActivity} />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : isGrowth ? (
  <>
    <GrowthActivityDetails activity={currentActivity} />

    <button
      type="button"
      onClick={onClose}
      className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {t("activity.close")}
    </button>
  </>
) : (
  // Тук остава сегашното Sleep съдържание.
          <>
            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-indigo-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <BedDouble className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {t("activity.sleep")}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatSeconds(
                    activeDurationSeconds,
                    i18n.language,
                  )}
                </p>
              </div>

              {!isEditing && sleepActivity && (
                <button
                  type="button"
                  onClick={() => {
                    setSaved(false);
                    setError("");
                    setIsEditing(true);
                  }}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                >
                  <Pencil className="h-4 w-4" />
                  {t("activity.edit")}
                </button>
              )}
            </div>

            {sleepSegment?.crossesMidnight ? (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                {t("sleepSegments.crossMidnightNotice", {
                  startDate: formatDateValue(sleepSegment.originalStartedAt, dateFormat, i18n.language),
                  endDate: formatDateValue(sleepSegment.originalEndedAt, dateFormat, i18n.language),
                })}
              </div>
            ) : null}

            {saved && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" />
                {t("activity.savedSuccessfully")}
              </div>
            )}

            {isEditing && sleepActivity ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="activity-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {t("activity.date")}
                  </label>

                  <input
                    id="activity-date"
                    type="date"
                    value={dateValue}
                    max={toDateInputValue(
                      new Date().toISOString(),
                    )}
                    onChange={(event) => {
                      setDateValue(event.target.value);
                      setError("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="activity-start-time"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      {t("activity.startedAt")}
                    </label>

                    <input
                      id="activity-start-time"
                      type="time"
                      value={startedTimeValue}
                      onChange={(event) => {
                        setStartedTimeValue(
                          event.target.value,
                        );
                        setError("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="activity-end-time"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      {t("activity.endedAt")}
                    </label>

                    <input
                      id="activity-end-time"
                      type="time"
                      value={endedTimeValue}
                      onChange={(event) => {
                        setEndedTimeValue(
                          event.target.value,
                        );
                        setError("");
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {editorRange?.continuesNextDay ? (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                    <p className="font-medium">{t("activity.sleepContinuesNextDay")}</p>
                    <p className="mt-1">{t("activity.sleepEndsAt", { value: formatDateTimeValue(editorRange.endedAt, timeFormat, dateFormat, i18n.language) })}</p>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="activity-paused-minutes"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {t("activity.pausedMinutes")}
                  </label>

                  <input
                    id="activity-paused-minutes"
                    type="number"
                    min="0"
                    step="1"
                    value={pausedMinutesValue}
                    onChange={(event) => {
                      setPausedMinutesValue(
                        event.target.value,
                      );
                      setError("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity-location"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {t("activity.location")}
                  </label>

                  <select
                    id="activity-location"
                    value={locationValue}
                    onChange={(event) =>
                      setLocationValue(
                        event.target.value as SleepLocation,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="crib">
                      {t("activity.crib")}
                    </option>

                    <option value="parents-bed">
                      {t("activity.parentsBed")}
                    </option>

                    <option value="stroller">
                      {t("activity.stroller")}
                    </option>

                    <option value="car">
                      {t("activity.car")}
                    </option>

                    <option value="other">
                      {t("activity.other")}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="activity-note"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {t("activity.note")}
                  </label>

                  <textarea
                    id="activity-note"
                    rows={4}
                    value={noteValue}
                    placeholder={t(
                      "activity.notePlaceholder",
                    )}
                    onChange={(event) =>
                      setNoteValue(event.target.value)
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-rose-600">
                    {error}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCancelSleep}
                    className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("activity.cancel")}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSleep}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Save className="h-5 w-5" />
                    {t("activity.save")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <dl className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {t("activity.startedAt")}
                    </dt>

                    <dd className="mt-2 font-semibold text-slate-900">
                      {formatDateTimeValue(
                        currentActivity.startedAt,
                        timeFormat,
                        dateFormat,
                        i18n.language,
                      )}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {t("activity.endedAt")}
                    </dt>

                    <dd className="mt-2 font-semibold text-slate-900">
                      {currentActivity.endedAt
                        ? formatDateTimeValue(
                            currentActivity.endedAt,
                            timeFormat,
                            dateFormat,
                            i18n.language,
                          )
                        : t("activity.active")}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {t("activity.duration")}
                    </dt>

                    <dd className="mt-2 font-semibold text-slate-900">
                      {formatSeconds(
                        activeDurationSeconds,
                        i18n.language,
                      )}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Pause className="h-4 w-4" />
                      {t("activity.pausedDuration")}
                    </dt>

                    <dd className="mt-2 font-semibold text-slate-900">
                      {formatSeconds(
                        pausedDurationSeconds,
                        i18n.language,
                      )}
                    </dd>
                  </div>

                  {location && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {t("activity.location")}
                      </dt>

                      <dd className="mt-2 font-semibold text-slate-900">
                        {t(
                          getLocationTranslationKey(
                            location,
                          ),
                        )}
                      </dd>
                    </div>
                  )}

                  {currentActivity.note && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <StickyNote className="h-4 w-4" />
                        {t("activity.note")}
                      </dt>

                      <dd className="mt-2 whitespace-pre-wrap text-slate-900">
                        {currentActivity.note}
                      </dd>
                    </div>
                  )}
                </dl>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("activity.close")}
                </button>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
