import {
  Baby,
  Check,
  Clock3,
  Pencil,
  Save,
  StickyNote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  BreastfeedingActivity,
  BreastSide,
} from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateTimeValue } from "../../features/settings/utils/formatting";

interface BreastfeedingActivityDetailsProps {
  activity: BreastfeedingActivity;
}

function formatDuration(seconds: number, language: string) {
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

function createLocalDate(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function BreastfeedingActivityDetails({
  activity,
}: BreastfeedingActivityDetailsProps) {
  const { t, i18n } = useTranslation();
  const settings = useAppSettingsStore((state) => state);

  const updateActivity = useActivityStore(
    (state) => state.updateActivity,
  );

  const storedActivity = useActivityStore((state) => {
    const found = state.activities.find(
      (item) => item.id === activity.id,
    );

    return found?.type === "breastfeeding"
      ? found
      : undefined;
  });

  const currentActivity = storedActivity ?? activity;

  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [firstSideValue, setFirstSideValue] =
    useState<BreastSide>("left");
  const [leftMinutesValue, setLeftMinutesValue] =
    useState("0");
  const [rightMinutesValue, setRightMinutesValue] =
    useState("0");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const totalDurationSeconds =
    currentActivity.data.leftDurationSeconds +
    currentActivity.data.rightDurationSeconds;

  function fillForm(
    breastfeedingActivity: BreastfeedingActivity,
  ) {
    setDateValue(
      toDateInputValue(breastfeedingActivity.startedAt),
    );

    setTimeValue(
      toTimeInputValue(breastfeedingActivity.startedAt),
    );

    setFirstSideValue(
      breastfeedingActivity.data.firstSide,
    );

    setLeftMinutesValue(
      String(
        Math.floor(
          breastfeedingActivity.data.leftDurationSeconds /
            60,
        ),
      ),
    );

    setRightMinutesValue(
      String(
        Math.floor(
          breastfeedingActivity.data.rightDurationSeconds /
            60,
        ),
      ),
    );

    setNoteValue(breastfeedingActivity.note ?? "");
    setError("");
  }

  useEffect(() => {
    fillForm(currentActivity);
    setIsEditing(false);
    setSaved(false);
  }, [currentActivity]);

  function handleSave() {
    const startedAt = createLocalDate(
      dateValue,
      timeValue,
    );

    if (
      !startedAt ||
      startedAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidBreastfeedingDate"));
      return;
    }

    const parsedLeftMinutes = Number(
      leftMinutesValue,
    );

    const parsedRightMinutes = Number(
      rightMinutesValue,
    );

    const leftMinutes = Number.isFinite(
      parsedLeftMinutes,
    )
      ? Math.max(0, parsedLeftMinutes)
      : 0;

    const rightMinutes = Number.isFinite(
      parsedRightMinutes,
    )
      ? Math.max(0, parsedRightMinutes)
      : 0;

    const leftDurationSeconds = Math.round(
      leftMinutes * 60,
    );

    const rightDurationSeconds = Math.round(
      rightMinutes * 60,
    );

    if (
      leftDurationSeconds === 0 &&
      rightDurationSeconds === 0
    ) {
      setError(
        t("activity.invalidBreastfeedingDuration"),
      );
      return;
    }

    const totalSeconds =
      leftDurationSeconds + rightDurationSeconds;

    const endedAt = new Date(
      startedAt.getTime() + totalSeconds * 1000,
    );

    const updatedActivity: BreastfeedingActivity = {
      ...currentActivity,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      note: noteValue.trim() || undefined,
      updatedAt: new Date().toISOString(),
      data: {
        firstSide: firstSideValue,
        leftDurationSeconds,
        rightDurationSeconds,
      },
    };

    const updated = updateActivity(
      currentActivity.id,
      updatedActivity,
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

  function handleCancel() {
    fillForm(currentActivity);
    setIsEditing(false);
  }

  return (
    <>
      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-pink-50 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-600 text-white">
          <Baby className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {t("activity.breastfeeding")}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.breastfeedingTotal")}:{" "}
            {formatDuration(
              totalDurationSeconds,
              i18n.language,
            )}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setError("");
              setIsEditing(true);
            }}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-pink-700 shadow-sm transition hover:bg-pink-100"
          >
            <Pencil className="h-4 w-4" />
            {t("activity.edit")}
          </button>
        )}
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t("activity.savedSuccessfully")}
        </div>
      )}

      {isEditing ? (
        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="breastfeeding-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.date")}
            </label>

            <input
              id="breastfeeding-date"
              type="date"
              value={dateValue}
              max={toDateInputValue(
                new Date().toISOString(),
              )}
              onChange={(event) => {
                setDateValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
            />
          </div>

          <div>
            <label
              htmlFor="breastfeeding-time"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.activityTime")}
            </label>

            <input
              id="breastfeeding-time"
              type="time"
              value={timeValue}
              onChange={(event) => {
                setTimeValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
            />
          </div>

          <div>
            <label
              htmlFor="breastfeeding-first-side"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.firstBreast")}
            </label>

            <select
              id="breastfeeding-first-side"
              value={firstSideValue}
              onChange={(event) =>
                setFirstSideValue(
                  event.target.value as BreastSide,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
            >
              <option value="left">
                {t("activity.leftBreast")}
              </option>

              <option value="right">
                {t("activity.rightBreast")}
              </option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="breastfeeding-left-minutes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {t("activity.leftDurationMinutes")}
              </label>

              <input
                id="breastfeeding-left-minutes"
                type="number"
                min="0"
                step="1"
                value={leftMinutesValue}
                onChange={(event) => {
                  setLeftMinutesValue(event.target.value);
                  setError("");
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
              />
            </div>

            <div>
              <label
                htmlFor="breastfeeding-right-minutes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {t("activity.rightDurationMinutes")}
              </label>

              <input
                id="breastfeeding-right-minutes"
                type="number"
                min="0"
                step="1"
                value={rightMinutesValue}
                onChange={(event) => {
                  setRightMinutesValue(event.target.value);
                  setError("");
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="breastfeeding-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.note")}
            </label>

            <textarea
              id="breastfeeding-note"
              rows={4}
              value={noteValue}
              placeholder={t("activity.notePlaceholder")}
              onChange={(event) =>
                setNoteValue(event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
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
              onClick={handleCancel}
              className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("activity.cancel")}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-2 rounded-2xl bg-pink-600 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              <Save className="h-5 w-5" />
              {t("activity.save")}
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-6 space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Clock3 className="h-4 w-4" />
              {t("activity.activityTime")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {formatDateTimeValue(
                currentActivity.startedAt,
                settings.timeFormat,
                settings.dateFormat,
                i18n.language,
              )}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <dt className="text-sm font-medium text-slate-500">
              {t("activity.firstBreast")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {currentActivity.data.firstSide === "left"
                ? t("activity.leftBreast")
                : t("activity.rightBreast")}
            </dd>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <dt className="text-sm font-medium text-slate-500">
                {t("activity.leftBreast")}
              </dt>

              <dd className="mt-2 font-semibold text-slate-900">
                {formatDuration(
                  currentActivity.data
                    .leftDurationSeconds,
                  i18n.language,
                )}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <dt className="text-sm font-medium text-slate-500">
                {t("activity.rightBreast")}
              </dt>

              <dd className="mt-2 font-semibold text-slate-900">
                {formatDuration(
                  currentActivity.data
                    .rightDurationSeconds,
                  i18n.language,
                )}
              </dd>
            </div>
          </div>

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
      )}
    </>
  );
}
