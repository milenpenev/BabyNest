import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Baby,
  BrainCircuit,
  Clock3,
  Crown,
  MoonStar,
  Sparkles,
} from "lucide-react";

import {
  calculateBabyAge,
  formatBabyAge,
} from "../../features/baby/utils/babyAge";
import { useBabyStore } from "../../store/babyStore";

function formatClock(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatMinutesDuration(
  totalMinutes: number,
  language: string,
) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "bg") {
    return `${hours}ч ${minutes}м`;
  }

  return `${hours}h ${minutes}m`;
}

export default function DashboardHero() {
  const { t, i18n } = useTranslation();

  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore(
    (state) => state.selectedBabyId,
  );

  const selectedBaby =
    babies.find((baby) => baby.id === selectedBabyId) ?? babies[0];

  const [now, setNow] = useState(() => new Date());

  const wakeWindowMinutes = 88;

  const nextNapAt = useMemo(() => {
    const target = new Date();
    target.setHours(target.getHours() + 1);
    target.setMinutes(target.getMinutes() + 18);
    target.setSeconds(0);
    target.setMilliseconds(0);

    return target;
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!selectedBaby) {
    return null;
  }

  const age = calculateBabyAge(selectedBaby.birthday);

  const locale =
    i18n.language === "bg" ? "bg-BG" : "en-GB";

  const countdownSeconds = Math.floor(
    (nextNapAt.getTime() - now.getTime()) / 1000,
  );

  return (
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" />
              BabyNest
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-950">
              <Crown className="h-4 w-4" />
              Premium+
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-indigo-100">
            {t("dashboard.hero.greeting", {
              name: "Милен",
            })}
          </p>

          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t("dashboard.hero.title", {
              babyName: selectedBaby.name,
            })}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
            {t("dashboard.hero.subtitle")}
          </p>

          <p className="mt-2 text-sm font-medium text-indigo-200">
            {formatBabyAge(age, i18n.language)}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <Clock3 className="h-5 w-5 text-indigo-100" />

              <div>
                <p className="text-xs text-indigo-100">
                  {t("dashboard.hero.currentTime")}
                </p>

                <p className="font-mono text-lg font-semibold">
                  {formatClock(now, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <Baby className="h-5 w-5 text-indigo-100" />

              <div>
                <p className="text-xs text-indigo-100">
                  {t("dashboard.hero.babyAwake")}
                </p>

                <p className="text-lg font-semibold">
                  {formatMinutesDuration(
                    wakeWindowMinutes,
                    i18n.language,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:w-[520px]">
          <article className="rounded-3xl bg-white p-5 text-slate-900 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {t("dashboard.hero.nextSleep")}
                </p>

                <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-indigo-700">
                  {formatCountdown(countdownSeconds)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <MoonStar className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-5 text-slate-500">
              {t("dashboard.hero.recommendedStart")}{" "}
              <span className="font-semibold text-slate-800">
                {new Intl.DateTimeFormat(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(nextNapAt)}
              </span>
            </p>
          </article>

          <article className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  {t("dashboard.hero.aiConfidence")}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight">
                  89%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
                <BrainCircuit className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-5 text-slate-400">
              {t("dashboard.hero.aiDescription")}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}