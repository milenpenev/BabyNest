import {
  AlertTriangle,
  Baby,
  CheckCircle2,
  Info,
  Scale,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { calculateWeightForAgePercentile } from "../who";
import type { BiologicalSex } from "../who";

interface WeightPercentileCardProps {
  weightKg: number | null;
  measuredAt: string | null;
  birthDate: string | null;
  sex: BiologicalSex | null;
  gestationalAgeWeeks?: number | null;
}

type PercentileTone =
  | "typical"
  | "monitor"
  | "outside";

function getPercentileTone(
  percentile: number,
): PercentileTone {
  if (percentile < 3 || percentile > 97) {
    return "outside";
  }

  if (percentile < 15 || percentile > 85) {
    return "monitor";
  }

  return "typical";
}

function formatPercentile(
  percentile: number,
  language: string,
) {
  const rounded =
    percentile < 1 || percentile > 99
      ? percentile.toFixed(1)
      : Math.round(percentile).toString();

  return language === "bg"
    ? `${rounded}-и процентил`
    : `${rounded}${getEnglishOrdinalSuffix(
        Number(rounded),
      )} percentile`;
}

function getEnglishOrdinalSuffix(value: number) {
  const rounded = Math.round(value);
  const lastTwoDigits = rounded % 100;

  if (
    lastTwoDigits >= 11 &&
    lastTwoDigits <= 13
  ) {
    return "th";
  }

  switch (rounded % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export default function WeightPercentileCard({
  weightKg,
  measuredAt,
  birthDate,
  sex,
  gestationalAgeWeeks,
}: WeightPercentileCardProps) {
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith("bg")
    ? "bg"
    : "en";

  const result = useMemo(() => {
    if (
      weightKg === null ||
      !measuredAt ||
      !birthDate ||
      !sex
    ) {
      return null;
    }

    try {
      return calculateWeightForAgePercentile({
        sex,
        weightKg,
        birthDate,
        measuredAt,
        gestationalAgeWeeks,
        useCorrectedAge: true,
      });
    } catch (error) {
      console.error(
        "Failed to calculate WHO weight percentile",
        error,
      );

      return null;
    }
  }, [
    weightKg,
    measuredAt,
    birthDate,
    sex,
    gestationalAgeWeeks,
  ]);

  if (
    weightKg === null ||
    !measuredAt
  ) {
    return null;
  }

  if (!birthDate || !sex) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
            <Info className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              WHO процентил за тегло
            </p>

            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {language === "bg"
                ? "Добави дата на раждане и пол в профила на бебето, за да изчислим процентил."
                : "Add the baby's birth date and sex to calculate the percentile."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {language === "bg"
                ? "Процентилът не може да бъде изчислен"
                : "Percentile could not be calculated"}
            </p>

            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {language === "bg"
                ? "Провери въведените дата, пол и тегло."
                : "Check the entered date, sex, and weight."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const tone = getPercentileTone(
    result.percentile,
  );

  const toneConfig = {
    typical: {
      wrapper:
        "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
      iconWrapper:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
      title:
        "text-emerald-900 dark:text-emerald-100",
      description:
        "text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle2,
      label:
        language === "bg"
          ? "В обичайния WHO диапазон"
          : "Within the usual WHO range",
    },
    monitor: {
      wrapper:
        "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
      iconWrapper:
        "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
      title:
        "text-amber-900 dark:text-amber-100",
      description:
        "text-amber-700 dark:text-amber-300",
      icon: Info,
      label:
        language === "bg"
          ? "По-близо до края на WHO кривата"
          : "Closer to the edge of the WHO curve",
    },
    outside: {
      wrapper:
        "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
      iconWrapper:
        "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
      title:
        "text-rose-900 dark:text-rose-100",
      description:
        "text-rose-700 dark:text-rose-300",
      icon: AlertTriangle,
      label:
        language === "bg"
          ? "Извън централния WHO диапазон"
          : "Outside the central WHO range",
    },
  } satisfies Record<
    PercentileTone,
    {
      wrapper: string;
      iconWrapper: string;
      title: string;
      description: string;
      icon: typeof Info;
      label: string;
    }
  >;

  const config = toneConfig[tone];
  const StatusIcon = config.icon;

  return (
    <section
      className={[
        "rounded-3xl border p-5 shadow-sm",
        config.wrapper,
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              config.iconWrapper,
            ].join(" ")}
          >
            <Scale className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                WHO weight-for-age
              </p>

              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                <Baby className="h-3 w-3" />

                {result.usedCorrectedAge
                  ? language === "bg"
                    ? "Коригирана възраст"
                    : "Corrected age"
                  : language === "bg"
                    ? "Календарна възраст"
                    : "Chronological age"}
              </span>
            </div>

            <p
              className={[
                "mt-2 text-3xl font-bold tracking-tight",
                config.title,
              ].join(" ")}
            >
              {formatPercentile(
                result.percentile,
                language,
              )}
            </p>

            <p
              className={[
                "mt-1 flex items-center gap-1.5 text-sm font-medium",
                config.description,
              ].join(" ")}
            >
              <StatusIcon className="h-4 w-4" />
              {config.label}
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[220px]">
          <div className="rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-slate-900/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Z-score
            </p>

            <p className="mt-1 font-bold text-slate-900 dark:text-white">
              {result.zScore.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 px-3 py-2.5 dark:bg-slate-900/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {language === "bg"
                ? "Възраст"
                : "Age"}
            </p>

            <p className="mt-1 font-bold text-slate-900 dark:text-white">
              {result.correctedAgeDays}{" "}
              {language === "bg" ? "дни" : "days"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-current/10 pt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {language === "bg"
          ? "WHO процентилите са ориентировъчна информация и не заменят оценката на педиатър. По-важна е тенденцията между последователните измервания, а не единичната стойност."
          : "WHO percentiles are informational and do not replace pediatric assessment. The trend across measurements matters more than a single value."}
      </p>
    </section>
  );
}
