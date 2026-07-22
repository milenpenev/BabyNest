import {
  Bath,
  Check,
  Clock3,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { BathType } from "../../entities/activity/model/activity.types";
import { useActivityStore } from "../../store/activityStore";
import { useBabyStore } from "../../store/babyStore";

const bathTypes: Array<{
  type: BathType;
  translationKey: string;
}> = [
  {
    type: "full-bath",
    translationKey: "activity.fullBath",
  },
  {
    type: "quick-wash",
    translationKey: "activity.quickWash",
  },
  {
    type: "hair-wash",
    translationKey: "activity.hairWash",
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

export default function BathQuickAdd() {
  const { t } = useTranslation();

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

  const [bathType, setBathType] =
    useState<BathType>("full-bath");

  const [bathAtValue, setBathAtValue] = useState(() =>
    toLocalDateTimeInput(new Date()),
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddBath() {
    if (!selectedBaby) {
      return;
    }

    const bathAt = fromLocalDateTimeInput(
      bathAtValue,
    );

    if (
      !bathAt ||
      bathAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidBathTime"));
      return;
    }

    const timestamp = new Date().toISOString();
    const activityTime = bathAt.toISOString();

    addActivity({
      id: crypto.randomUUID(),
      babyId: selectedBaby.id,
      type: "bath",
      startedAt: activityTime,
      endedAt: activityTime,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: {
        bathType,
      },
    });

    setBathType("full-bath");
    setBathAtValue(
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Bath className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("activity.addBath")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.bathType")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {bathTypes.map(
          ({ type, translationKey }) => {
            const isSelected = bathType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setBathType(type);
                  setSaved(false);
                }}
                className={[
                  "flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                  isSelected
                    ? "border-sky-300 bg-sky-50 text-sky-800 ring-4 ring-sky-100"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-sky-50/50",
                ].join(" ")}
              >
                <span>{t(translationKey)}</span>

                {isSelected && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-5">
        <label
          htmlFor="bath-time"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Clock3 className="h-4 w-4" />
          {t("activity.bathTime")}
        </label>

        <input
          id="bath-time"
          type="datetime-local"
          step="60"
          value={bathAtValue}
          max={toLocalDateTimeInput(new Date())}
          onChange={(event) => {
            setBathAtValue(event.target.value);
            setError("");
            setSaved(false);
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t("activity.bathAdded")}
        </div>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddBath}
          disabled={!selectedBaby}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t("activity.addBath")}
        </button>
      </div>
    </section>
  );
}