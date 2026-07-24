import {
  Crown,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSubscriptionStore } from "../../store/subscriptionStore";

interface PremiumGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
  preview?: ReactNode;
}

export default function PremiumGate({
  children,
  title,
  description,
  preview,
}: PremiumGateProps) {
  const { t } = useTranslation();

  const effectivePlan =
    useSubscriptionStore(
      (state) =>
        state.effectivePlan,
    );

  const navigate = useNavigate();

  if (effectivePlan === "premium") {
    return <>{children}</>;
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-200 bg-white shadow-sm dark:border-violet-900 dark:bg-slate-900">
      {preview && (
        <div
          className="pointer-events-none max-h-[650px] select-none overflow-hidden opacity-25 blur-[3px]"
          aria-hidden="true"
        >
          {preview}
        </div>
      )}

      <div
        className={[
          "flex items-center justify-center p-5 sm:p-8",
          preview
            ? "absolute inset-0 overflow-y-auto bg-white/75 backdrop-blur-sm dark:bg-slate-950/80"
            : "min-h-[440px]",
        ].join(" ")}
      >
        <div className="my-auto w-full max-w-2xl rounded-3xl bg-white/90 p-5 text-center shadow-xl ring-1 ring-violet-100 backdrop-blur dark:bg-slate-900/95 dark:ring-violet-900 sm:p-7">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
            <Crown className="h-4 w-4" />
            Premium+
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {title ?? t("premium.statisticsTitle")}
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
            {description ??
              t("premium.statisticsDescription")}
          </p>

          <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl bg-violet-50 p-4 text-left dark:bg-violet-950/50">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />

              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {t("premium.advancedCharts")}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {t(
                    "premium.advancedChartsDescription",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-indigo-50 p-4 text-left dark:bg-indigo-950/50">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {t("premium.smartInsights")}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {t(
                    "premium.smartInsightsDescription",
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/plans")}
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Crown className="h-5 w-5" />
            {t("premium.upgrade")}
          </button>

          <p className="mt-2 text-xs text-slate-400">
            {t("premium.demoUpgradeNote")}
          </p>
        </div>
      </div>
    </section>
  );
}
