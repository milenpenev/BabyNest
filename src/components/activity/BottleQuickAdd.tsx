import {
  Check,
  Clock3,
  Milk,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { MilkType } from "../../entities/activity/model/activity.types";
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

export default function BottleQuickAdd() {
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

  const [amountValue, setAmountValue] = useState("");

  const [milkType, setMilkType] =
    useState<MilkType>("breast-milk");

  const [feedingAtValue, setFeedingAtValue] = useState(
    () => toLocalDateTimeInput(new Date()),
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleAddBottle() {
    if (!selectedBaby) {
      return;
    }

    const amountMl = Number(amountValue);

    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setError(t("activity.invalidBottleAmount"));
      return;
    }

    const feedingAt = fromLocalDateTimeInput(
      feedingAtValue,
    );

    if (
      !feedingAt ||
      feedingAt.getTime() > Date.now()
    ) {
      setError(t("activity.invalidBottleTime"));
      return;
    }

    const createdAt = new Date().toISOString();
    const activityTime = feedingAt.toISOString();

    addActivity({
      id: crypto.randomUUID(),
      babyId: selectedBaby.id,
      type: "bottle",
      startedAt: activityTime,
      endedAt: activityTime,
      createdAt,
      updatedAt: createdAt,
      data: {
        amountMl,
        milkType,
      },
    });

    setAmountValue("");
    setMilkType("breast-milk");
    setFeedingAtValue(
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Milk className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("activity.addBottle")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("activity.bottle")}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="bottle-feeding-time"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <Clock3 className="h-4 w-4" />
            {t("activity.bottleTime")}
          </label>

          <input
            id="bottle-feeding-time"
            type="datetime-local"
            step="60"
            value={feedingAtValue}
            max={toLocalDateTimeInput(new Date())}
            onChange={(event) => {
              setFeedingAtValue(event.target.value);
              setError("");
              setSaved(false);
            }}
            className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
            placeholder={t(
              "activity.bottleAmountPlaceholder",
            )}
            onChange={(event) => {
              setAmountValue(event.target.value);
              setError("");
              setSaved(false);
            }}
            className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
            value={milkType}
            onChange={(event) => {
              setMilkType(
                event.target.value as MilkType,
              );
              setError("");
              setSaved(false);
            }}
            className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          >
            <option value="breast-milk">
              {t("activity.breastMilk")}
            </option>

            <option value="formula">
              {t("activity.formula")}
            </option>
          </select>
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
          {t("activity.bottleAdded", {
            defaultValue: t("activity.addBottle"),
          })}
        </div>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleAddBottle}
          disabled={!selectedBaby}
          className="flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>{t("activity.addBottle")}</span>
        </button>
      </div>
    </section>
  );
}