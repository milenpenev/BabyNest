import { Check, Crown, LayoutDashboard, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSubscriptionStore } from "../../store/subscriptionStore";

type BillingPeriod = "monthly" | "yearly";

const freeFeatureKeys = [
  "tracking",
  "timeline",
  "quickAdd",
  "basicDashboard",
] as const;

const premiumFeatureKeys = [
  "tracking",
  "timeline",
  "quickAdd",
  "basicDashboard",
  "advancedStatistics",
  "smartInsights",
  "sleepPrediction",
  "growthCharts",
] as const;

export default function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plan = useSubscriptionStore((state) => state.plan);

  const setPlan = useSubscriptionStore((state) => state.setPlan);

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const [message, setMessage] = useState("");

  function activatePlan(selectedPlan: "free" | "premium") {
    if (selectedPlan === "premium") {
      setMessage(t("premium.demoUpgradeNote"));
      return;
    }

    setPlan("free");

    setMessage(t("plans.freeActivated"));

    window.setTimeout(() => {
      navigate("/");
    }, 900);
  }

  const premiumPrice =
    billingPeriod === "monthly"
      ? t("plans.premiumMonthlyPrice")
      : t("plans.premiumYearlyPrice");

  const premiumPeriod =
    billingPeriod === "monthly" ? t("plans.perMonth") : t("plans.perYear");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <LayoutDashboard className="h-4 w-4" />
          {t("plans.backToDashboard")}
        </button>

        <section className="mt-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-200">
            <Crown className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("plans.title")}
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {t("plans.subtitle")}
          </p>

          <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={[
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                billingPeriod === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100",
              ].join(" ")}
            >
              {t("plans.monthly")}
            </button>

            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={[
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                billingPeriod === "yearly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100",
              ].join(" ")}
            >
              {t("plans.yearly")}

              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {t("plans.save")}
              </span>
            </button>
          </div>
        </section>

        {message && (
          <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" />
            {message}
          </div>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t("plans.free")}
              </p>

              <div className="mt-4 flex items-end gap-2">
                <p className="text-4xl font-bold">{t("plans.freePrice")}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t("plans.freeDescription")}
              </p>
            </div>

            <div className="mt-7 space-y-3">
              {freeFeatureKeys.map((featureKey) => (
                <div key={featureKey} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <Check className="h-3.5 w-3.5" />
                  </div>

                  <span className="text-sm text-slate-600">
                    {t(`plans.features.${featureKey}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => activatePlan("free")}
                disabled={plan === "free"}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400"
              >
                {plan === "free"
                  ? t("plans.currentPlan")
                  : t("plans.chooseFree")}
              </button>
            </div>
          </article>

          <article className="relative flex flex-col overflow-hidden rounded-[2rem] border-2 border-violet-400 bg-white p-6 shadow-xl shadow-violet-100 sm:p-8">
            <div className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1.5 text-xs font-bold text-white">
              {t("plans.mostPopular")}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-600">
                <Crown className="h-4 w-4" />
                {t("plans.premium")}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
                <p className="text-4xl font-bold">{premiumPrice}</p>

                <p className="pb-1 text-sm text-slate-500">{premiumPeriod}</p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t("plans.premiumDescription")}
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {premiumFeatureKeys.map((featureKey) => (
                <div key={featureKey} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <Check className="h-3.5 w-3.5" />
                  </div>

                  <span className="text-sm text-slate-600">
                    {t(`plans.features.${featureKey}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={() => activatePlan("premium")}
                disabled={plan === "premium"}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Sparkles className="h-5 w-5" />

                {plan === "premium"
                  ? t("plans.currentPlan")
                  : t("plans.choosePremium")}
              </button>
            </div>
          </article>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Това е тестова версия. Реално плащане все още не се извършва.
        </p>
      </div>
    </main>
  );
}
