import {
  Check,
  Clock3,
  Pill,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";

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

export default function MedicineQuickAdd() {
  const { t, i18n } = useTranslation();

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

  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("");

  const [givenAtValue, setGivenAtValue] = useState(() =>
    toLocalDateTimeInput(new Date()),
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddMedicine() {
    if (!selectedBaby) {
      return;
    }

    const trimmedMedicineName = medicineName.trim();
    const trimmedDose = dose.trim();

    if (!trimmedMedicineName || !trimmedDose) {
      setError(t("activity.invalidMedicine"));
      return;
    }

    const givenAt = fromLocalDateTimeInput(
      givenAtValue,
    );

    if (
      !givenAt ||
      givenAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidMedicineTime"));
      return;
    }

    const timestamp = new Date().toISOString();
    const activityTime = givenAt.toISOString();

    const added = addActivity({
      id: crypto.randomUUID(),
      babyId: selectedBaby.id,
      type: "medicine",
      startedAt: activityTime,
      endedAt: activityTime,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: {
        medicineName: trimmedMedicineName,
        dose: trimmedDose,
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

    setMedicineName("");
    setDose("");
    setGivenAtValue(
      toLocalDateTimeInput(new Date()),
    );
    setError("");
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <Pill className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("activity.addMedicine")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.medicine")}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <input
          type="text"
          value={medicineName}
          placeholder={t(
            "activity.medicineNamePlaceholder",
          )}
          onChange={(event) => {
            setMedicineName(event.target.value);
            setError("");
            setSaved(false);
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />

        <input
          type="text"
          value={dose}
          placeholder={t("activity.dosePlaceholder")}
          onChange={(event) => {
            setDose(event.target.value);
            setError("");
            setSaved(false);
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
        />

        <div>
          <label
            htmlFor="medicine-time"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <Clock3 className="h-4 w-4" />
            {t("activity.medicineTime")}
          </label>

          <input
            id="medicine-time"
            type="datetime-local"
            step="60"
            value={givenAtValue}
            max={toLocalDateTimeInput(new Date())}
            onChange={(event) => {
              setGivenAtValue(event.target.value);
              setError("");
              setSaved(false);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t("activity.medicineAdded")}
        </div>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddMedicine}
          disabled={!selectedBaby}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t("activity.addMedicine")}
        </button>
      </div>
    </section>
  );
}