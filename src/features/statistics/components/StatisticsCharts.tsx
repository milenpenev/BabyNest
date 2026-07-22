import type { StatisticsChartPoint } from "../utils/chartData";

export interface StatisticsChartSeries {
  dataKey: string;
  label: string;
  className: string;
  formatValue?: (value: number) => string;
}

interface StatisticsChartsProps {
  data: StatisticsChartPoint[];
  series: StatisticsChartSeries[];
  emptyLabel: string;
  zeroLabel?: string;
  hasRecords?: boolean;
}

export default function StatisticsCharts({ data, series, emptyLabel, zeroLabel, hasRecords = true }: StatisticsChartsProps) {
  const numericValues = data.flatMap((row) => series.map((item) => Number(row[item.dataKey]) || 0));
  const maximumValue = Math.max(...numericValues, 0);

  if (!hasRecords || data.length === 0) return <div className="mt-5 flex h-28 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-500">{emptyLabel}</div>;
  if (maximumValue <= 0) return <div className="mt-5 flex h-28 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-500">{zeroLabel ?? emptyLabel}</div>;

  return <div className="mt-5 w-full">
    <div className="flex h-28 w-full items-end gap-2">
      {data.map((row) => <div key={row.dayKey} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
        {series.map((item) => {
          const value = Number(row[item.dataKey]) || 0;
          const height = value > 0 ? Math.max(10, value / maximumValue * 100) : 0;
          const displayValue = item.formatValue ? item.formatValue(value) : String(value);
          return <div key={item.dataKey} className="group/bar relative flex h-full min-w-1 flex-1 items-end">
            <div className={["relative w-full rounded-t-sm transition-opacity hover:opacity-80", item.className].join(" ")} style={{ height: `${height}%` }} aria-label={`${item.label}: ${displayValue}`}>
              {value > 0 ? <span className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-lg group-hover/bar:block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{item.label}: {displayValue}</span> : null}
            </div>
          </div>;
        })}
      </div>)}
    </div>
    <div className="mt-2 flex gap-2">{data.map((row) => <span key={row.dayKey} className="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">{row.label}</span>)}</div>
    <div className="mt-3 flex flex-wrap gap-3">{series.map((item) => <span key={item.dataKey} className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><i className={["h-2.5 w-2.5 rounded-sm", item.className].join(" ")} />{item.label}</span>)}</div>
  </div>;
}
