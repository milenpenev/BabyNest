import {
  Check,
  Clock3,
  Droplets,
  Icon,
  Plus,
} from "lucide-react";

import { diaper } from "@lucide/lab";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { DiaperType } from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";

const diaperTypes: Array<{
  type: DiaperType;
  translationKey: string;
}> = [
  {
    type: "wet",
    translationKey: "activity.wetDiaper",
  },
  {
    type: "dirty",
    translationKey: "activity.dirtyDiaper",
  },
  {
    type: "mixed",
    translationKey: "activity.mixedDiaper",
  },
];

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

export default function DiaperQuickAdd() {
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

  const [selectedType, setSelectedType] =
    useState<DiaperType>("wet");

  const [changedAtValue, setChangedAtValue] = useState(() =>
    toLocalDateTimeInput(new Date()),
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddDiaper() {
    if (!selectedBaby) {
      return;
    }

    const changedAt =
      fromLocalDateTimeInput(changedAtValue);

    if (
      !changedAt ||
      changedAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidDiaperTime"));
      return;
    }

    const timestamp = new Date().toISOString();
    const activityTime = changedAt.toISOString();

    const added = addActivity({
      id: crypto.randomUUID(),
      babyId: selectedBaby.id,
      type: "diaper",
      startedAt: activityTime,
      endedAt: activityTime,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: {
        diaperType: selectedType,
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

    setChangedAtValue(
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Icon iconNode={diaper} className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("activity.addDiaper")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.diaperType")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {diaperTypes.map(
          ({ type, translationKey }) => {
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type);
                  setSaved(false);
                }}
                className={[
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                  isSelected
                    ? "border-amber-300 bg-amber-50 text-amber-800 ring-4 ring-amber-100"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50",
                ].join(" ")}
              >
                <Droplets className="h-5 w-5" />
                {t(translationKey)}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-5">
        <label
          htmlFor="diaper-change-time"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Clock3 className="h-4 w-4" />
          {t("activity.diaperTime")}
        </label>

        <input
          id="diaper-change-time"
          type="datetime-local"
          step="60"
          value={changedAtValue}
          max={toLocalDateTimeInput(new Date())}
          onChange={(event) => {
            setChangedAtValue(event.target.value);
            setError("");
            setSaved(false);
          }}
          className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t("activity.diaperAdded")}
        </div>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddDiaper}
          disabled={!selectedBaby}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t("activity.addDiaper")}
        </button>
      </div>
    </section>
  );
}