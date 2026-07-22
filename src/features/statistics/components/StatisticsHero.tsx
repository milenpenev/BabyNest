import { BarChart3, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatisticsHero() {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-6 text-white shadow-xl shadow-violet-200/60 sm:p-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
            <Crown className="h-4 w-4 text-amber-300" />
            Premium+
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("statistics.heroTitle")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">
            {t("statistics.heroDescription")}
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
          <BarChart3 className="h-8 w-8" />
        </div>
      </div>
    </section>
  );
}
