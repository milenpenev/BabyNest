import {
  Check,
  Clock3,
  Pencil,
  Ruler,
  Save,
  Scale,
  StickyNote,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GrowthActivity } from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { cmToIn, formatDateTimeValue, formatLength, formatWeight, inToCm, kgToLb, lbToKg } from "../../features/settings/utils/formatting";

interface GrowthActivityDetailsProps {
  activity: GrowthActivity;
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

function parseOptionalPositiveNumber(value: string, maximum: number) {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0 || parsedValue >= maximum) {
    return null;
  }

  return parsedValue;
}

export default function GrowthActivityDetails({
  activity,
}: GrowthActivityDetailsProps) {
  const { t, i18n } = useTranslation();
  const settings = useAppSettingsStore((state) => state);

  const updateActivity = useActivityStore(
    (state) => state.updateActivity,
  );

  const storedActivity = useActivityStore((state) => {
    const found = state.activities.find(
      (item) => item.id === activity.id,
    );

    return found?.type === "growth"
      ? found
      : undefined;
  });

  const currentActivity = storedActivity ?? activity;

  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [heightValue, setHeightValue] = useState("");
  const [
    headCircumferenceValue,
    setHeadCircumferenceValue,
  ] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fillForm = useCallback((growthActivity: GrowthActivity) => {
    setDateValue(
      toDateInputValue(growthActivity.startedAt),
    );

    setTimeValue(
      toTimeInputValue(growthActivity.startedAt),
    );

    setWeightValue(
      growthActivity.data.weightKg !== undefined
        ? String(settings.weightUnit === "lb" ? Number(kgToLb(growthActivity.data.weightKg).toFixed(2)) : Number(growthActivity.data.weightKg.toFixed(3)))
        : "",
    );

    setHeightValue(
      growthActivity.data.heightCm !== undefined
        ? String(settings.lengthUnit === "in" ? Number(cmToIn(growthActivity.data.heightCm).toFixed(2)) : Number(growthActivity.data.heightCm.toFixed(1)))
        : "",
    );

    setHeadCircumferenceValue(
      growthActivity.data.headCircumferenceCm !==
        undefined
        ? String(settings.lengthUnit === "in" ? Number(cmToIn(growthActivity.data.headCircumferenceCm).toFixed(2)) : Number(growthActivity.data.headCircumferenceCm.toFixed(1)))
        : "",
    );

    setNoteValue(growthActivity.note ?? "");
    setError("");
  }, [settings.weightUnit, settings.lengthUnit]);

  useEffect(() => {
    fillForm(currentActivity);
    setIsEditing(false);
    setSaved(false);
  }, [currentActivity, fillForm]);

  function handleSave() {
    const measuredAt = createLocalDate(
      dateValue,
      timeValue,
    );

    if (
      !measuredAt ||
      measuredAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidGrowthDate"));
      return;
    }

    const parsedWeight =
      parseOptionalPositiveNumber(weightValue, settings.weightUnit === "lb" ? 1100 : 500);

    const parsedHeight =
      parseOptionalPositiveNumber(heightValue, settings.lengthUnit === "in" ? 120 : 300);

    const parsedHead =
      parseOptionalPositiveNumber(headCircumferenceValue, settings.lengthUnit === "in" ? 80 : 200);

    const hasInvalidValue =
      parsedWeight === null || parsedHeight === null || parsedHead === null;

    const hasMeasurement =
      parsedWeight !== undefined || parsedHeight !== undefined || parsedHead !== undefined;

    if (hasInvalidValue || !hasMeasurement) {
      setError(
        t("activity.invalidGrowthMeasurement"),
      );
      return;
    }

    const weightKg = parsedWeight === undefined ? undefined : settings.weightUnit === "lb" ? lbToKg(parsedWeight as number) : parsedWeight as number;
    const heightCm = parsedHeight === undefined ? undefined : settings.lengthUnit === "in" ? inToCm(parsedHeight as number) : parsedHeight as number;
    const headCircumferenceCm = parsedHead === undefined ? undefined : settings.lengthUnit === "in" ? inToCm(parsedHead as number) : parsedHead as number;

    const activityTime = measuredAt.toISOString();

    const updatedActivity: GrowthActivity = {
      ...currentActivity,
      startedAt: activityTime,
      endedAt: activityTime,
      note: noteValue.trim() || undefined,
      updatedAt: new Date().toISOString(),
      data: {
        weightKg,
        heightCm,
        headCircumferenceCm,
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

  const measurementSummary = [
    currentActivity.data.weightKg !== undefined
      ? formatWeight(currentActivity.data.weightKg, settings.weightUnit, i18n.language)
      : null,
    currentActivity.data.heightCm !== undefined
      ? formatLength(currentActivity.data.heightCm, settings.lengthUnit, i18n.language)
      : null,
    currentActivity.data.headCircumferenceCm !== undefined
      ? formatLength(currentActivity.data.headCircumferenceCm, settings.lengthUnit, i18n.language)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-violet-50 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Ruler className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {t("activity.growth")}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {measurementSummary}
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
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
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
              htmlFor="growth-activity-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.date")}
            </label>

            <input
              id="growth-activity-date"
              type="date"
              value={dateValue}
              max={toDateInputValue(
                new Date().toISOString(),
              )}
              onChange={(event) => {
                setDateValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="growth-activity-time"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.measurementTime")}
            </label>

            <input
              id="growth-activity-time"
              type="time"
              value={timeValue}
              onChange={(event) => {
                setTimeValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="growth-activity-weight"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <Scale className="h-4 w-4" />
              {t("activity.weightKg")} ({settings.weightUnit})
            </label>

            <input
              id="growth-activity-weight"
              type="number"
              min="0"
              step="0.01"
              value={weightValue}
              onChange={(event) => {
                setWeightValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="growth-activity-height"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.heightCm")} ({settings.lengthUnit})
            </label>

            <input
              id="growth-activity-height"
              type="number"
              min="0"
              step="0.1"
              value={heightValue}
              onChange={(event) => {
                setHeightValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="growth-activity-head"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.headCircumferenceCm")} ({settings.lengthUnit})
            </label>

            <input
              id="growth-activity-head"
              type="number"
              min="0"
              step="0.1"
              value={headCircumferenceValue}
              onChange={(event) => {
                setHeadCircumferenceValue(
                  event.target.value,
                );
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="growth-activity-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.note")}
            </label>

            <textarea
              id="growth-activity-note"
              rows={4}
              value={noteValue}
              placeholder={t("activity.notePlaceholder")}
              onChange={(event) =>
                setNoteValue(event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
              className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
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
              {t("activity.measurementTime")}
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

          {currentActivity.data.weightKg !== undefined && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Scale className="h-4 w-4" />
                {t("activity.weightKg")}
              </dt>

              <dd className="mt-2 font-semibold text-slate-900">
                {formatWeight(currentActivity.data.weightKg, settings.weightUnit, i18n.language)}
              </dd>
            </div>
          )}

          {currentActivity.data.heightCm !== undefined && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <dt className="text-sm font-medium text-slate-500">
                {t("activity.heightCm")}
              </dt>

              <dd className="mt-2 font-semibold text-slate-900">
                {formatLength(currentActivity.data.heightCm, settings.lengthUnit, i18n.language)}
              </dd>
            </div>
          )}

          {currentActivity.data.headCircumferenceCm !==
            undefined && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <dt className="text-sm font-medium text-slate-500">
                {t("activity.headCircumferenceCm")}
              </dt>

              <dd className="mt-2 font-semibold text-slate-900">
                {formatLength(currentActivity.data.headCircumferenceCm, settings.lengthUnit, i18n.language)}
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
      )}
    </>
  );
}
