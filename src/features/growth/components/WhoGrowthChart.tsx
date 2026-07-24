import {
  Baby,
  CircleGauge,
  Info,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  calculateHeadCircumferenceForAgePercentile,
  calculateLengthForAgePercentile,
  calculateWeightForAgePercentile,
} from "../who";
import { headCircumferenceForAgeBoys } from "../who/data/headCircumferenceForAgeBoys";
import { headCircumferenceForAgeGirls } from "../who/data/headCircumferenceForAgeGirls";
import { lengthForAgeBoys } from "../who/data/lengthForAgeBoys";
import { lengthForAgeGirls } from "../who/data/lengthForAgeGirls";
import { weightForAgeBoys } from "../who/data/weightForAgeBoys";
import { weightForAgeGirls } from "../who/data/weightForAgeGirls";
import type {
  BiologicalSex,
  WhoLmsRow,
} from "../who/types/whoGrowth.types";
import { interpolateLmsRow } from "../who/utils/interpolateLms";
import { calculateLmsValueFromZScore } from "../who/utils/lmsValue";

export interface WhoGrowthMeasurement {
  id: string;
  startedAt: string;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
}

interface WhoGrowthChartProps {
  birthDate: string | null;
  sex: BiologicalSex | null;
  gestationalAgeWeeks?: number | null;
  measurements: WhoGrowthMeasurement[];
}

type Metric = "weight" | "length" | "head";
type ChartRange = 6 | 12 | 24 | 60;

interface CurvePoint {
  ageMonths: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

interface BabyPoint {
  id: string;
  ageMonths: number;
  value: number;
  percentile: number;
  measuredAt: string;
  usedCorrectedAge: boolean;
}

interface MetricConfig {
  labelKey: string;
  unit: "kg" | "cm";
  valueKey:
    | "weightKg"
    | "heightCm"
    | "headCircumferenceCm";
  icon: typeof Scale;
  datasets: {
    male: WhoLmsRow[];
    female: WhoLmsRow[];
  };
}

const DAYS_PER_MONTH = 30.4375;

const WHO_Z_SCORES = {
  p3: -1.880794,
  p15: -1.036433,
  p50: 0,
  p85: 1.036433,
  p97: 1.880794,
};

const METRIC_CONFIG: Record<Metric, MetricConfig> = {
  weight: {
    labelKey: "activity.weightKg",
    unit: "kg",
    valueKey: "weightKg",
    icon: Scale,
    datasets: {
      male: weightForAgeBoys,
      female: weightForAgeGirls,
    },
  },
  length: {
    labelKey: "activity.heightCm",
    unit: "cm",
    valueKey: "heightCm",
    icon: Ruler,
    datasets: {
      male: lengthForAgeBoys,
      female: lengthForAgeGirls,
    },
  },
  head: {
    labelKey: "activity.headCircumferenceCm",
    unit: "cm",
    valueKey: "headCircumferenceCm",
    icon: Sparkles,
    datasets: {
      male: headCircumferenceForAgeBoys,
      female: headCircumferenceForAgeGirls,
    },
  },
};

function calculateCurveValue(
  row: WhoLmsRow,
  zScore: number,
) {
  return Number(
    calculateLmsValueFromZScore(
      row,
      zScore,
    ).toFixed(2),
  );
}

function createCurvePoint(
  row: WhoLmsRow,
  ageMonths: number,
): CurvePoint {
  return {
    ageMonths,
    p3: calculateCurveValue(
      row,
      WHO_Z_SCORES.p3,
    ),
    p15: calculateCurveValue(
      row,
      WHO_Z_SCORES.p15,
    ),
    p50: calculateCurveValue(
      row,
      WHO_Z_SCORES.p50,
    ),
    p85: calculateCurveValue(
      row,
      WHO_Z_SCORES.p85,
    ),
    p97: calculateCurveValue(
      row,
      WHO_Z_SCORES.p97,
    ),
  };
}

function calculateMeasurementPercentile({
  metric,
  sex,
  value,
  birthDate,
  measuredAt,
  gestationalAgeWeeks,
}: {
  metric: Metric;
  sex: BiologicalSex;
  value: number;
  birthDate: string;
  measuredAt: string;
  gestationalAgeWeeks?: number | null;
}) {
  const sharedInput = {
    sex,
    birthDate,
    measuredAt,
    gestationalAgeWeeks,
    useCorrectedAge: true,
  };

  if (metric === "weight") {
    return calculateWeightForAgePercentile({
      ...sharedInput,
      weightKg: value,
    });
  }

  if (metric === "length") {
    return calculateLengthForAgePercentile({
      ...sharedInput,
      lengthCm: value,
    });
  }

  return calculateHeadCircumferenceForAgePercentile({
    ...sharedInput,
    headCircumferenceCm: value,
  });
}

function formatPercentile(
  percentile: number,
  language: string,
) {
  const rounded = Math.round(percentile);

  if (language.startsWith("bg")) {
    return `${rounded}-и`;
  }

  const lastTwoDigits = rounded % 100;

  if (
    lastTwoDigits >= 11 &&
    lastTwoDigits <= 13
  ) {
    return `${rounded}th`;
  }

  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

function ChartTooltip({
  active,
  payload,
  unit,
  language,
  t,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: Record<string, unknown>;
  }>;
  unit: string;
  language: string;
  t: (
    key: string,
    options?: Record<string, unknown>,
  ) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const babyPayload = payload.find(
    (item) =>
      typeof item.payload?.percentile === "number",
  );

  if (babyPayload?.payload) {
    const point =
      babyPayload.payload as unknown as BabyPoint;

    return (
      <div className="min-w-[190px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="font-semibold text-slate-900 dark:text-white">
          {t("growth.whoChart.measurement")}
        </p>

        <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p>
            {t("growth.whoChart.age")}:{" "}
            <strong>
              {point.ageMonths.toFixed(1)}{" "}
              {t("growth.whoChart.monthsShort")}
            </strong>
          </p>

          <p>
            {t("growth.whoChart.percentile")}:{" "}
            <strong>
              {formatPercentile(
                point.percentile,
                language,
              )}
            </strong>
          </p>

          <p>
            {t("growth.whoChart.measurement")}:{" "}
            <strong>
              {point.value.toFixed(2)} {unit}
            </strong>
          </p>
        </div>
      </div>
    );
  }

  const curvePoint = payload[0]
    ?.payload as CurvePoint | undefined;

  if (!curvePoint) {
    return null;
  }

  return (
    <div className="min-w-[170px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-white">
        {curvePoint.ageMonths === 0
          ? t("growth.whoChart.birth")
          : `${curvePoint.ageMonths} ${t(
              "growth.whoChart.monthsShort",
            )}`}
      </p>

      <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        {payload
          .filter(
            (item) =>
              typeof item.value === "number" &&
              item.name,
          )
          .map((item) => (
            <p key={item.name}>
              {item.name}:{" "}
              <strong>
                {Number(item.value).toFixed(2)}{" "}
                {unit}
              </strong>
            </p>
          ))}
      </div>
    </div>
  );
}

export default function WhoGrowthChart({
  birthDate,
  sex,
  gestationalAgeWeeks,
  measurements,
}: WhoGrowthChartProps) {
  const { t, i18n } = useTranslation();

  const [metric, setMetric] =
    useState<Metric>("weight");

  const [rangeMonths, setRangeMonths] =
    useState<ChartRange>(12);

  const metricSummaries = useMemo(() => {
    if (!birthDate || !sex) {
      return {
        weight: null,
        length: null,
        head: null,
      };
    }

    return (
      Object.keys(
        METRIC_CONFIG,
      ) as Metric[]
    ).reduce(
      (result, currentMetric) => {
        const config =
          METRIC_CONFIG[currentMetric];

        const latest = [...measurements]
          .filter((measurement) => {
            const value =
              measurement[config.valueKey];

            return (
              typeof value === "number" &&
              Number.isFinite(value) &&
              value > 0
            );
          })
          .sort(
            (first, second) =>
              new Date(
                second.startedAt,
              ).getTime() -
              new Date(
                first.startedAt,
              ).getTime(),
          )[0];

        if (!latest) {
          result[currentMetric] = null;
          return result;
        }

        try {
          const value =
            latest[config.valueKey];

          if (typeof value !== "number") {
            result[currentMetric] = null;
            return result;
          }

          result[currentMetric] =
            calculateMeasurementPercentile({
              metric: currentMetric,
              sex,
              value,
              birthDate,
              measuredAt: latest.startedAt,
              gestationalAgeWeeks,
            });
        } catch (error) {
          console.error(
            `Could not calculate ${currentMetric} percentile`,
            error,
          );

          result[currentMetric] = null;
        }

        return result;
      },
      {
        weight: null,
        length: null,
        head: null,
      } as Record<
        Metric,
        ReturnType<
          typeof calculateMeasurementPercentile
        > | null
      >,
    );
  }, [
    birthDate,
    sex,
    gestationalAgeWeeks,
    measurements,
  ]);

  const chartData = useMemo(() => {
    if (!birthDate || !sex) {
      return null;
    }

    const config = METRIC_CONFIG[metric];
    const dataset = config.datasets[sex];

    if (dataset.length === 0) {
      return null;
    }

    const babyPoints = measurements
      .map((measurement) => {
        const value =
          measurement[config.valueKey];

        if (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value <= 0
        ) {
          return null;
        }

        try {
          const result =
            calculateMeasurementPercentile({
              metric,
              sex,
              value,
              birthDate,
              measuredAt:
                measurement.startedAt,
              gestationalAgeWeeks,
            });

          return {
            id: measurement.id,
            ageMonths:
              result.correctedAgeDays /
              DAYS_PER_MONTH,
            value,
            percentile: result.percentile,
            measuredAt:
              measurement.startedAt,
            usedCorrectedAge:
              result.usedCorrectedAge,
          };
        } catch (error) {
          console.error(
            "Could not calculate WHO measurement point",
            error,
          );

          return null;
        }
      })
      .filter(
        (
          point,
        ): point is BabyPoint =>
          point !== null,
      )
      .sort(
        (first, second) =>
          first.ageMonths - second.ageMonths,
      );

    const visibleBabyPoints =
      babyPoints.filter(
        (point) =>
          point.ageMonths >= 0 &&
          point.ageMonths <= rangeMonths,
      );

    const curves: CurvePoint[] = [];

    for (
      let month = 0;
      month <= rangeMonths;
      month += 1
    ) {
      const row = interpolateLmsRow(
        dataset,
        month * DAYS_PER_MONTH,
      );

      curves.push(
        createCurvePoint(row, month),
      );
    }

    return {
      curves,
      babyPoints,
      visibleBabyPoints,
      usedCorrectedAge: babyPoints.some(
        (point) =>
          point.usedCorrectedAge,
      ),
    };
  }, [
    birthDate,
    sex,
    gestationalAgeWeeks,
    measurements,
    metric,
    rangeMonths,
  ]);

  if (!birthDate || !sex) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              {t("growth.whoChart.title")}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("growth.whoChart.missingProfile")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!chartData) {
    return null;
  }

  const config = METRIC_CONFIG[metric];

  const trendMessage = (() => {
    const points = chartData.babyPoints;

    if (points.length === 0) {
      return t(
        "growth.whoChart.noMeasurements",
      );
    }

    if (points.length === 1) {
      return t(
        "growth.whoChart.addMoreMeasurements",
      );
    }

    const previous =
      points[points.length - 2];

    const latest =
      points[points.length - 1];

    const difference =
      latest.percentile -
      previous.percentile;

    if (Math.abs(difference) < 10) {
      return t(
        "growth.whoChart.stableTrend",
      );
    }

    return difference > 0
      ? t(
          "growth.whoChart.higherPercentile",
        )
      : t(
          "growth.whoChart.lowerPercentile",
        );
  })();

  const rangeOptions: ChartRange[] = [
    6,
    12,
    24,
    60,
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <header className="border-b border-slate-100 p-4 dark:border-slate-700 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("growth.whoChart.title")}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("growth.whoChart.description")}
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
            <Baby className="h-3.5 w-3.5" />

            {chartData.usedCorrectedAge
              ? t(
                  "growth.whoChart.correctedAge",
                )
              : t(
                  "growth.whoChart.chronologicalAge",
                )}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            Object.keys(
              METRIC_CONFIG,
            ) as Metric[]
          ).map((metricOption) => {
            const optionConfig =
              METRIC_CONFIG[metricOption];

            const Icon =
              optionConfig.icon;

            const summary =
              metricSummaries[
                metricOption
              ];

            const isActive =
              metric === metricOption;

            return (
              <button
                key={metricOption}
                type="button"
                onClick={() =>
                  setMetric(metricOption)
                }
                className={[
                  "rounded-2xl border p-3 text-left transition",
                  isActive
                    ? "border-violet-500 bg-violet-50 shadow-sm ring-2 ring-violet-100 dark:bg-violet-950/40 dark:ring-violet-900"
                    : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Icon className="h-4 w-4 text-violet-600" />
                    {t(
                      optionConfig.labelKey,
                    )}
                  </span>

                  {isActive ? (
                    <CircleGauge className="h-4 w-4 text-violet-600" />
                  ) : null}
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {summary
                    ? formatPercentile(
                        summary.percentile,
                        i18n.language,
                      )
                    : "—"}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    "growth.whoChart.percentile",
                  )}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {rangeOptions.map(
            (range) => (
              <button
                key={range}
                type="button"
                onClick={() =>
                  setRangeMonths(range)
                }
                className={[
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                  rangeMonths === range
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                ].join(" ")}
              >
                {t(
                  `growth.whoChart.period${range}`,
                )}
              </button>
            ),
          )}
        </div>
      </header>

      <div className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <config.icon className="h-5 w-5 text-violet-600" />

            <h3 className="font-bold text-slate-900 dark:text-white">
              {t(config.labelKey)}
            </h3>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {config.unit}
          </span>
        </div>

        <div className="h-[300px] w-full sm:h-[360px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={chartData.curves}
              margin={{
                top: 12,
                right: 12,
                bottom: 18,
                left: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.3}
              />

              <XAxis
                type="number"
                dataKey="ageMonths"
                domain={[0, rangeMonths]}
                allowDataOverflow
                tick={{ fontSize: 11 }}
                label={{
                  value: t(
                    "growth.whoChart.ageMonths",
                  ),
                  position: "insideBottom",
                  offset: -12,
                }}
              />

              <YAxis
                type="number"
                width={46}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) =>
                  Number(value).toFixed(1)
                }
              />

              <Tooltip
                content={
                  <ChartTooltip
                    unit={config.unit}
                    language={
                      i18n.language
                    }
                    t={t}
                  />
                }
              />

              <Legend
                verticalAlign="top"
                height={34}
                wrapperStyle={{
                  fontSize: 11,
                }}
              />

              <Line
                type="monotone"
                dataKey="p3"
                name="P3"
                stroke="#e11d48"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="p15"
                name="P15"
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="3 5"
                dot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="p50"
                name="P50"
                stroke="#64748b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="p85"
                name="P85"
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="3 5"
                dot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="p97"
                name="P97"
                stroke="#e11d48"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />

              <Scatter
                name={t(
                  "growth.whoChart.baby",
                )}
                data={
                  chartData.visibleBabyPoints
                }
                dataKey="value"
                fill="#7c3aed"
                line={{
                  stroke: "#7c3aed",
                  strokeWidth: 4,
                }}
                shape="circle"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 rounded-2xl bg-violet-50 p-3 dark:bg-violet-950/30">
          <p className="flex items-start gap-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
            {chartData.babyPoints.length >=
              2 &&
            chartData.babyPoints[
              chartData.babyPoints.length -
                1
            ].percentile <
              chartData.babyPoints[
                chartData.babyPoints.length -
                  2
              ].percentile ? (
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            {trendMessage}
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />

            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {t(
                  "growth.whoChart.percentileExplanationTitle",
                )}
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-200">
                {t(
                  "growth.whoChart.percentileExplanation",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        {t("growth.whoChart.footer")}
      </footer>
    </section>
  );
}
