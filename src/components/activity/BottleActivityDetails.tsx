import {
  Check,
  Clock3,
  Milk,
  Pencil,
  Save,
  StickyNote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  BottleActivity,
  MilkType,
} from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateTimeValue } from "../../features/settings/utils/formatting";

interface BottleActivityDetailsProps {
  activity: BottleActivity;
}

function toDateInputValue(dateString: string) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(dateString: string) {
  const date = new Date(dateString);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function createLocalDate(dateValue: string, timeValue: string) {
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

export default function BottleActivityDetails({
  activity,
}: BottleActivityDetailsProps) {
  const { t, i18n } = useTranslation();
  const settings = useAppSettingsStore((state) => state);

  const updateActivity = useActivityStore(
    (state) => state.updateActivity,
  );

  const storedActivity = useActivityStore((state) => {
    const found = state.activities.find(
      (item) => item.id === activity.id,
    );

    return found?.type === "bottle" ? found : undefined;
  });

  const currentActivity = storedActivity ?? activity;

  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [milkTypeValue, setMilkTypeValue] =
    useState<MilkType>("breast-milk");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function fillForm(bottleActivity: BottleActivity) {
    setDateValue(toDateInputValue(bottleActivity.startedAt));
    setTimeValue(toTimeInputValue(bottleActivity.startedAt));
    setAmountValue(String(bottleActivity.data.amountMl));
    setMilkTypeValue(bottleActivity.data.milkType);
    setNoteValue(bottleActivity.note ?? "");
    setError("");
  }

  useEffect(() => {
    fillForm(currentActivity);
    setIsEditing(false);
    setSaved(false);
  }, [currentActivity]);

  function handleSave() {
    const activityDate = createLocalDate(
      dateValue,
      timeValue,
    );

    const amountMl = Number(amountValue);

    if (
      !activityDate ||
      activityDate.getTime() > Date.now()
    ) {
      setError(t("activity.invalidBottleDate"));
      return;
    }

    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setError(t("activity.invalidBottleAmount"));
      return;
    }

    const timestamp = activityDate.toISOString();

    const updatedActivity: BottleActivity = {
      ...currentActivity,
      startedAt: timestamp,
      endedAt: timestamp,
      note: noteValue.trim() || undefined,
      updatedAt: new Date().toISOString(),
      data: {
        amountMl,
        milkType: milkTypeValue,
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
      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Milk className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            {t("activity.bottle")}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {currentActivity.data.amountMl} ml ·{" "}
            {currentActivity.data.milkType === "breast-milk"
              ? t("activity.breastMilk")
              : t("activity.formula")}
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
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
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
              htmlFor="bottle-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.date")}
            </label>

            <input
              id="bottle-date"
              type="date"
              value={dateValue}
              max={toDateInputValue(new Date().toISOString())}
              onChange={(event) => {
                setDateValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="bottle-time"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.activityTime")}
            </label>

            <input
              id="bottle-time"
              type="time"
              value={timeValue}
              onChange={(event) => {
                setTimeValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="bottle-amount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.amountMl")}
            </label>

            <input
              id="bottle-amount"
              type="number"
              min="1"
              step="1"
              value={amountValue}
              onChange={(event) => {
                setAmountValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="bottle-milk-type"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.milkType")}
            </label>

            <select
              id="bottle-milk-type"
              value={milkTypeValue}
              onChange={(event) =>
                setMilkTypeValue(
                  event.target.value as MilkType,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="breast-milk">
                {t("activity.breastMilk")}
              </option>

              <option value="formula">
                {t("activity.formula")}
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="bottle-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.note")}
            </label>

            <textarea
              id="bottle-note"
              rows={4}
              value={noteValue}
              placeholder={t("activity.notePlaceholder")}
              onChange={(event) =>
                setNoteValue(event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700"
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
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Milk className="h-4 w-4" />
              {t("activity.amount")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {currentActivity.data.amountMl} ml
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Milk className="h-4 w-4" />
              {t("activity.milkType")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {currentActivity.data.milkType === "breast-milk"
                ? t("activity.breastMilk")
                : t("activity.formula")}
            </dd>
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
