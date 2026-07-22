import { Milk, Moon, Icon } from "lucide-react";
import { diaper } from "@lucide/lab";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  calculateTodaySleep,
  countTodayActivities,
  formatDuration,
  getLatestDiaperActivity,
} from "../../features/dashboard/utils/dashboardStats";
import { useActivityStore } from "../../store/activityStore";

function formatElapsedTime(
  startedAt: string | undefined,
  now: Date,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!startedAt) {
    return t("dashboard.noDiaperRecorded");
  }

  const startedAtMilliseconds =
    new Date(startedAt).getTime();

  if (Number.isNaN(startedAtMilliseconds)) {
    return t("dashboard.noDiaperRecorded");
  }

  const elapsedMilliseconds = Math.max(
    0,
    now.getTime() - startedAtMilliseconds,
  );

  const totalMinutes = Math.floor(
    elapsedMilliseconds / 60_000,
  );

  if (totalMinutes < 1) {
    return t("dashboard.lessThanMinute");
  }

  if (totalMinutes < 60) {
    return t("dashboard.minutesAgo", {
      count: totalMinutes,
    });
  }

  const totalHours = Math.floor(totalMinutes / 60);

  if (totalHours < 24) {
    return t("dashboard.hoursAgo", {
      hours: totalHours,
      minutes: totalMinutes % 60,
    });
  }

  return t("dashboard.daysAgo", {
    count: Math.floor(totalHours / 24),
  });
}

export default function SummaryCards() {
  const { t, i18n } = useTranslation();

  const activities = useActivityStore(
    (state) => state.activities,
  );

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const latestDiaper =
    getLatestDiaperActivity(activities);

  const cards = [
    {
      label: t("dashboard.todaySleep"),
      value: formatDuration(
        calculateTodaySleep(activities),
        i18n.language,
      ),
      icon: Moon,
      accent: "bg-indigo-100 text-indigo-700",
    },
    {
      label: t("dashboard.feedings"),
      value: String(
        countTodayActivities(activities, [
          "breastfeeding",
          "bottle",
        ]),
      ),
      icon: Milk,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: t("dashboard.sinceLastDiaper"),
      value: formatElapsedTime(
        latestDiaper?.startedAt,
        now,
        t,
      ),
      icon: () => <Icon iconNode={diaper} className="h-6 w-6" />,
      accent: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(
        ({ label, value, icon: Icon, accent }) => (
          <article
            key={label}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </article>
        ),
      )}
    </section>
  );
}