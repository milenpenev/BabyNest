import {
  Check,
  Clock3,
  Plus,
  Ruler,
  Scale,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { inToCm, lbToKg } from "../../features/settings/utils/formatting";

function toLocalDateTimeInput(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

function fromLocalDateTimeInput(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

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

export default function GrowthQuickAdd() {
  const { t, i18n } = useTranslation();
  const weightUnit = useAppSettingsStore((state) => state.weightUnit);
  const lengthUnit = useAppSettingsStore((state) => state.lengthUnit);

  const babies = useBabyStore((state) => state.babies);

  const selectedBabyId = useBabyStore(
    (state) => state.selectedBabyId,
  );

  const addActivity = useActivityStore(
    (state) => state.addActivity,
  );

  const selectedBaby =
    babies.find((baby) => baby.id === selectedBabyId) ??
    babies[0];

  const [weightValue, setWeightValue] = useState("");
  const [heightValue, setHeightValue] = useState("");
  const [
    headCircumferenceValue,
    setHeadCircumferenceValue,
  ] = useState("");

  const [measuredAtValue, setMeasuredAtValue] =
    useState(() => toLocalDateTimeInput(new Date()));

  const [error, setError] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddGrowth() {
    if (!selectedBaby) {
      return;
    }

    const parsedWeight =
      parseOptionalPositiveNumber(weightValue, weightUnit === "lb" ? 1100 : 500);

    const parsedHeight =
      parseOptionalPositiveNumber(heightValue, lengthUnit === "in" ? 120 : 300);

    const parsedHeadCircumference =
      parseOptionalPositiveNumber(headCircumferenceValue, lengthUnit === "in" ? 80 : 200);

    const hasInvalidValue =
      parsedWeight === null || parsedHeight === null || parsedHeadCircumference === null;

    const hasMeasurement = parsedWeight !== undefined || parsedHeight !== undefined || parsedHeadCircumference !== undefined;

    if (hasInvalidValue || !hasMeasurement) {
      setError(
        t("activity.invalidGrowthMeasurement"),
      );
      return;
    }

    const weightKg = parsedWeight === undefined ? undefined : weightUnit === "lb" ? lbToKg(parsedWeight as number) : parsedWeight as number;
    const heightCm = parsedHeight === undefined ? undefined : lengthUnit === "in" ? inToCm(parsedHeight as number) : parsedHeight as number;
    const headCircumferenceCm = parsedHeadCircumference === undefined ? undefined : lengthUnit === "in" ? inToCm(parsedHeadCircumference as number) : parsedHeadCircumference as number;

    const measuredAt =
      fromLocalDateTimeInput(measuredAtValue);

    if (
      !measuredAt ||
      measuredAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidGrowthTime"));
      return;
    }

    const createdAt = new Date().toISOString();
    const activityTime = measuredAt.toISOString();

    const added = addActivity({
      id: crypto.randomUUID(),
      babyId: selectedBaby.id,
      type: "growth",
      startedAt: activityTime,
      endedAt: activityTime,
      createdAt,
      updatedAt: createdAt,
      note: noteValue.trim() || undefined,
      data: {
        weightKg,
        heightCm,
        headCircumferenceCm,
      },
    });

    if (!added) {
      setSaved(false);

      setError(
        i18n.language.startsWith("bg")
          ? "Нямате права да добавяте активности в това семейство."
          : "You do not have permission to add activities in this family.",
      );

      return;
    }

    setWeightValue("");
    setHeightValue("");
    setHeadCircumferenceValue("");
    setNoteValue("");
    setMeasuredAtValue(
      toLocalDateTimeInput(new Date()),
    );
    setError("");
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Ruler className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("activity.addGrowth")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.growth")}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="growth-time"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <Clock3 className="h-4 w-4" />
            {t("activity.measurementTime")}
          </label>

          <input
            id="growth-time"
            type="datetime-local"
            step="60"
            value={measuredAtValue}
            max={toLocalDateTimeInput(new Date())}
            onChange={(event) => {
              setMeasuredAtValue(event.target.value);
              setError("");
              setSaved(false);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="growth-weight"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <Scale className="h-4 w-4" />
            {t("activity.weightKg")} ({weightUnit})
          </label>

          <input
            id="growth-weight"
            type="number"
            min="0"
            step="0.01"
            value={weightValue}
            onChange={(event) => {
              setWeightValue(event.target.value);
              setError("");
              setSaved(false);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="growth-height"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              {t("activity.heightCm")} ({lengthUnit})
            </label>

            <input
              id="growth-height"
              type="number"
              min="0"
              step="0.1"
              value={heightValue}
              onChange={(event) => {
                setHeightValue(event.target.value);
                setError("");
                setSaved(false);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="growth-head"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              {t("activity.headCircumferenceCm")} ({lengthUnit})
            </label>

            <input
              id="growth-head"
              type="number"
              min="0"
              step="0.1"
              value={headCircumferenceValue}
              onChange={(event) => {
                setHeadCircumferenceValue(
                  event.target.value,
                );
                setError("");
                setSaved(false);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>
        </div>
        <div><label htmlFor="growth-note" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{t("activity.note")}</label><textarea id="growth-note" value={noteValue} onChange={event=>setNoteValue(event.target.value)} className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-600 dark:bg-slate-900"/></div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t("activity.growthAdded")}
        </div>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddGrowth}
          disabled={!selectedBaby}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t("activity.addGrowth")}
        </button>
      </div>
    </section>
  );
}
