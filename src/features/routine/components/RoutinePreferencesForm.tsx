import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BabyRoutinePreferences } from "../../../entities/baby/model/baby.types";
import { useBabyStore } from "../../../store/babyStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import {
  defaultRoutineFormValues,
  type RoutineFormValues,
} from "../model/routineForm";
import {
  getRoutinePreferences,
  isValidRoutineInterval,
} from "../utils/routineIntervals";

const quickOptions = [120, 150, 180, 210, 240];

export function RoutineQuestionnaireFields({
  values,
  onChange,
  errors = {},
}: {
  values: RoutineFormValues;
  onChange: (values: RoutineFormValues) => void;
  errors?: Record<string, string>;
}) {
  const { t } = useTranslation();
  const isPremium = useSubscriptionStore(
    (state) => state.effectivePlan === "premium",
  );
  const field = (
    key: "feedingIntervalMinutes" | "diaperIntervalMinutes",
    question: string,
    adaptive: "useAdaptiveFeedingInterval" | "useAdaptiveDiaperInterval",
  ) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {question}
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange({ ...values, [key]: String(option) })}
            className={[
              "rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
              values[key] === String(option)
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
            ].join(" ")}
          >
            {Math.floor(option / 60)}
            {t("routine.hoursShort")}
            {option % 60 ? ` ${option % 60}${t("routine.minutesShort")}` : ""}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs text-slate-500 dark:text-slate-400">
        {t("routine.customMinutes")}
        <input
          type="number"
          min="15"
          max="1440"
          value={values[key]}
          onChange={(event) =>
            onChange({ ...values, [key]: event.target.value })
          }
          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </label>
      {errors[key] ? (
        <p className="mt-1 text-xs text-rose-600">{errors[key]}</p>
      ) : null}
      <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          disabled={!isPremium}
          checked={isPremium && values[adaptive]}
          onChange={(event) =>
            onChange({ ...values, [adaptive]: event.target.checked })
          }
        />
        {t(`routine.${adaptive}`)}
        {!isPremium ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {t("routine.premiumOnly")}
          </span>
        ) : null}
      </label>
    </div>
  );
  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-white">
        {t("routine.dailyRoutine")}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("routine.changeLater")}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {field(
          "feedingIntervalMinutes",
          t("routine.feedingQuestion"),
          "useAdaptiveFeedingInterval",
        )}
        {field(
          "diaperIntervalMinutes",
          t("routine.diaperQuestion"),
          "useAdaptiveDiaperInterval",
        )}
      </div>
    </div>
  );
}

export default function RoutinePreferencesForm() {
  const isPremium = useSubscriptionStore(
    (state) => state.effectivePlan === "premium",
  );
  const { t } = useTranslation();
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const updateBaby = useBabyStore((state) => state.updateBaby);
  const baby = babies.find((item) => item.id === selectedBabyId);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(defaultRoutineFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const routine = getRoutinePreferences(baby?.routinePreferences);
    setValues({
      feedingIntervalMinutes: String(routine.feedingIntervalMinutes),
      diaperIntervalMinutes: String(routine.diaperIntervalMinutes),
      useAdaptiveFeedingInterval: routine.useAdaptiveFeedingInterval,
      useAdaptiveDiaperInterval: routine.useAdaptiveDiaperInterval,
    });
    setEditing(!baby?.routinePreferences);
  }, [baby]);
  if (!baby) return null;
  const babyId = baby.id;
  function save() {
    const feeding = Number(values.feedingIntervalMinutes),
      diaper = Number(values.diaperIntervalMinutes);
    const next: Record<string, string> = {};
    if (!isValidRoutineInterval(feeding))
      next.feedingIntervalMinutes = t("routine.validationInterval");
    if (!isValidRoutineInterval(diaper))
      next.diaperIntervalMinutes = t("routine.validationInterval");
    setErrors(next);
    if (Object.keys(next).length) return;
    const routinePreferences: BabyRoutinePreferences = {
      feedingIntervalMinutes: feeding,
      diaperIntervalMinutes: diaper,
      useAdaptiveFeedingInterval:
        isPremium && values.useAdaptiveFeedingInterval,
      useAdaptiveDiaperInterval: isPremium && values.useAdaptiveDiaperInterval,
    };
    updateBaby(babyId, { routinePreferences });
    setEditing(false);
  }
  return (
    <section
      id="daily-routine"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            {baby.routinePreferences
              ? t("routine.dailyRoutine")
              : t("routine.setupIntervals")}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("routine.notMedicalAdvice")}
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-600"
          >
            {t("babyProfile.edit")}
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-5">
          <RoutineQuestionnaireFields
            values={values}
            onChange={setValues}
            errors={errors}
          />
          <div className="mt-4 flex justify-end gap-2">
            {baby.routinePreferences ? (
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                {t("babyProfile.cancel")}
              </button>
            ) : null}
            <button
              onClick={save}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t("babyProfile.save")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
            {t("routine.feedingInterval")}:{" "}
            <strong>
              {values.feedingIntervalMinutes} {t("routine.minutesShort")}
            </strong>
          </p>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
            {t("routine.diaperInterval")}:{" "}
            <strong>
              {values.diaperIntervalMinutes} {t("routine.minutesShort")}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
}
