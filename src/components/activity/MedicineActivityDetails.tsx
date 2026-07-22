import {
  Check,
  Clock3,
  Pencil,
  Pill,
  Save,
  StickyNote,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MedicineActivity } from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useAppSettingsStore } from "../../store/appSettingsStore";
import { formatDateTimeValue } from "../../features/settings/utils/formatting";

interface MedicineActivityDetailsProps {
  activity: MedicineActivity;
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

export default function MedicineActivityDetails({
  activity,
}: MedicineActivityDetailsProps) {
  const { t, i18n } = useTranslation();
  const settings = useAppSettingsStore((state) => state);

  const updateActivity = useActivityStore(
    (state) => state.updateActivity,
  );

  const storedActivity = useActivityStore((state) => {
    const found = state.activities.find(
      (item) => item.id === activity.id,
    );

    return found?.type === "medicine"
      ? found
      : undefined;
  });

  const currentActivity = storedActivity ?? activity;

  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [medicineNameValue, setMedicineNameValue] =
    useState("");
  const [doseValue, setDoseValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function fillForm(
    medicineActivity: MedicineActivity,
  ) {
    setDateValue(
      toDateInputValue(medicineActivity.startedAt),
    );

    setTimeValue(
      toTimeInputValue(medicineActivity.startedAt),
    );

    setMedicineNameValue(
      medicineActivity.data.medicineName,
    );

    setDoseValue(medicineActivity.data.dose);
    setNoteValue(medicineActivity.note ?? "");
    setError("");
  }

  useEffect(() => {
    fillForm(currentActivity);
    setIsEditing(false);
    setSaved(false);
  }, [currentActivity]);

  function handleSave() {
    const givenAt = createLocalDate(
      dateValue,
      timeValue,
    );

    if (
      !givenAt ||
      givenAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidMedicineDate"));
      return;
    }

    const medicineName = medicineNameValue.trim();
    const dose = doseValue.trim();

    if (!medicineName || !dose) {
      setError(t("activity.invalidMedicine"));
      return;
    }

    const activityTime = givenAt.toISOString();

    const updatedActivity: MedicineActivity = {
      ...currentActivity,
      startedAt: activityTime,
      endedAt: activityTime,
      note: noteValue.trim() || undefined,
      updatedAt: new Date().toISOString(),
      data: {
        medicineName,
        dose,
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
      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-rose-50 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white">
          <Pill className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {currentActivity.data.medicineName}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.dose")}:{" "}
            {currentActivity.data.dose}
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
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
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
              htmlFor="medicine-activity-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.date")}
            </label>

            <input
              id="medicine-activity-date"
              type="date"
              value={dateValue}
              max={toDateInputValue(
                new Date().toISOString(),
              )}
              onChange={(event) => {
                setDateValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="medicine-activity-time"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.medicineTime")}
            </label>

            <input
              id="medicine-activity-time"
              type="time"
              value={timeValue}
              onChange={(event) => {
                setTimeValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="medicine-activity-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.medicineName")}
            </label>

            <input
              id="medicine-activity-name"
              type="text"
              value={medicineNameValue}
              onChange={(event) => {
                setMedicineNameValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="medicine-activity-dose"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.dose")}
            </label>

            <input
              id="medicine-activity-dose"
              type="text"
              value={doseValue}
              onChange={(event) => {
                setDoseValue(event.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="medicine-activity-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t("activity.note")}
            </label>

            <textarea
              id="medicine-activity-note"
              rows={4}
              value={noteValue}
              placeholder={t("activity.notePlaceholder")}
              onChange={(event) =>
                setNoteValue(event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
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
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700"
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
              {t("activity.medicineTime")}
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
              {t("activity.medicineName")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {currentActivity.data.medicineName}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <dt className="text-sm font-medium text-slate-500">
              {t("activity.dose")}
            </dt>

            <dd className="mt-2 font-semibold text-slate-900">
              {currentActivity.data.dose}
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
