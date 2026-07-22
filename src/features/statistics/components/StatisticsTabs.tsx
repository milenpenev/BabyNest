import { useTranslation } from "react-i18next";

import type { StatisticsPeriod } from "../../utils/statistics";

interface StatisticsTabsProps {
  period: StatisticsPeriod;
  onChange: (period: StatisticsPeriod) => void;
}

const periodOptions: Array<{
  value: StatisticsPeriod;
  labelKey: string;
}> = [
  { value: "today", labelKey: "statistics.today" },
  { value: "7d", labelKey: "statistics.lastSevenDays" },
  { value: "30d", labelKey: "statistics.lastThirtyDays" },
];

export default function StatisticsTabs({
  period,
  onChange,
}: StatisticsTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {periodOptions.map((option) => {
        const isActive = period === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700",
            ].join(" ")}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
