import { CalendarDays, Crown, Plus, Ruler, Scale, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ActivityDeleteDialog from "../../../components/activity/ActivityDeleteDialog";
import ActivityDetailsDrawer from "../../../components/activity/ActivityDetailsDrawer";
import GrowthQuickAdd from "../../../components/activity/GrowthQuickAdd";
import WeightPercentileCard from "./WeightPercentileCard";
import WhoGrowthChart from "./WhoGrowthChart";
import PremiumGate from "../../../components/premium/PremiumGate";
import type { Activity } from "../../../entities/activity/model/activity.types";
import { useActivityStore } from "../../../store/activityStore";
import { useAppSettingsStore } from "../../../store/appSettingsStore";
import { useBabyStore } from "../../../store/babyStore";
import { formatDateValue, formatLength, formatTimeValue, formatWeight } from "../../settings/utils/formatting";
import { buildGrowthInsights, buildHeadCircumferenceChartData, buildHeightChartData, buildWeightChartData, calculatePaddedDomain, filterGrowthByPeriod, formatMetricChange, getGrowthActivities, getMetricSummary, type GrowthChartPoint, type GrowthMetric, type GrowthPeriod } from "../utils/growth";

function GrowthChart({title,points,unit,empty}:{title:string;points:GrowthChartPoint[];unit:string;empty:string}){const domain=calculatePaddedDomain(points.map(point=>point.value));return <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"><h3 className="font-bold text-slate-900 dark:text-white">{title}</h3><div className="mt-4 h-64" role="img" aria-label={`${title}: ${points.map(point=>`${point.label} ${point.value.toFixed(2)} ${unit}`).join(", ")}`}>{points.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{top:12,right:12,bottom:4,left:0}}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-300)" opacity={.45}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis domain={domain} tick={{fontSize:11}} width={44}/><Tooltip formatter={(value)=>[`${Number(value).toFixed(2)} ${unit}`,title]}/><Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} isAnimationActive={false}/></LineChart></ResponsiveContainer>:<div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-600">{empty}</div>}</div></section>}
function normalizeBabySex(
  baby: unknown,
): "male" | "female" | null {
  if (
    !baby ||
    typeof baby !== "object"
  ) {
    return null;
  }

  const record = baby as Record<
    string,
    unknown
  >;

  const rawValue =
    record.sex ??
    record.gender ??
    record.biologicalSex;

  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue
    .trim()
    .toLowerCase();

  if (
    [
      "male",
      "boy",
      "m",
      "момче",
      "мъжки",
    ].includes(value)
  ) {
    return "male";
  }

  if (
    [
      "female",
      "girl",
      "f",
      "момиче",
      "женски",
    ].includes(value)
  ) {
    return "female";
  }

  return null;
}

function getBabyBirthDate(
  baby: unknown,
) {
  if (
    !baby ||
    typeof baby !== "object"
  ) {
    return null;
  }

  const record = baby as Record<
    string,
    unknown
  >;

  const value =
    record.birthday ??
    record.birthDate ??
    record.dateOfBirth;

  return typeof value === "string"
    ? value
    : null;
}

function getGestationalAgeWeeks(
  baby: unknown,
) {
  if (
    !baby ||
    typeof baby !== "object"
  ) {
    return null;
  }

  const record = baby as Record<
    string,
    unknown
  >;

  const value =
    record.gestationalAgeWeeks ??
    record.gestationWeeks ??
    record.birthGestationalWeeks;

  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}
export default function GrowthPageContent(){
 const {t,i18n}=useTranslation();const activities=useActivityStore(s=>s.activities);const removeActivity=useActivityStore(s=>s.removeActivity);const babyId=useBabyStore(s=>s.selectedBabyId);const baby=useBabyStore(s=>s.babies.find(item=>item.id===s.selectedBabyId));const settings=useAppSettingsStore(s=>s);const [period,setPeriod]=useState<GrowthPeriod>("3m");const [selected,setSelected]=useState<Activity|null>(null);const [deleting,setDeleting]=useState<Activity|null>(null);
 const all=useMemo(()=>getGrowthActivities(activities,babyId),[activities,babyId]);const visible=useMemo(()=>filterGrowthByPeriod(all,period),[all,period]);const weight=getMetricSummary(all,"weightKg"),height=getMetricSummary(all,"heightCm"),head=getMetricSummary(all,"headCircumferenceCm");const charts=useMemo(()=>({weight:buildWeightChartData(visible,i18n.language,settings.weightUnit,settings.lengthUnit),height:buildHeightChartData(visible,i18n.language,settings.weightUnit,settings.lengthUnit),head:buildHeadCircumferenceChartData(visible,i18n.language,settings.weightUnit,settings.lengthUnit)}),[visible,i18n.language,settings.weightUnit,settings.lengthUnit]);const insights=useMemo(()=>buildGrowthInsights(visible,t,settings.weightUnit,settings.lengthUnit),[visible,t,settings.weightUnit,settings.lengthUnit]);
 const babySex = normalizeBabySex(baby);

const babyBirthDate =
  getBabyBirthDate(baby);

const babyGestationalAgeWeeks =
  getGestationalAgeWeeks(baby);
  const whoGrowthMeasurements = useMemo(
  () =>
    all.map((entry) => ({
      id: entry.id,
      startedAt: entry.startedAt,
      weightKg:
        typeof entry.data.weightKg === "number" &&
        Number.isFinite(entry.data.weightKg) &&
        entry.data.weightKg > 0
          ? entry.data.weightKg
          : undefined,
      heightCm:
        typeof entry.data.heightCm === "number" &&
        Number.isFinite(entry.data.heightCm) &&
        entry.data.heightCm > 0
          ? entry.data.heightCm
          : undefined,
      headCircumferenceCm:
        typeof entry.data.headCircumferenceCm === "number" &&
        Number.isFinite(entry.data.headCircumferenceCm) &&
        entry.data.headCircumferenceCm > 0
          ? entry.data.headCircumferenceCm
          : undefined,
    })),
  [all],
);
 const metricCard=(metric:GrowthMetric,label:string,summary:ReturnType<typeof getMetricSummary>,icon:React.ReactNode)=>{const formatted=summary.value===null?t("statistics.notAvailable"):metric==="weightKg"?formatWeight(summary.value,settings.weightUnit,i18n.language):formatLength(summary.value,settings.lengthUnit,i18n.language);const change=formatMetricChange(summary.change,metric,settings.weightUnit,settings.lengthUnit);return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">{icon}{label}</div><p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatted}</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{change?`${t("growth.change")}: ${change}`:t("growth.noPreviousMeasurement")}</p>{summary.latest?<p className="mt-1 text-xs text-slate-400">{formatDateValue(summary.latest.startedAt,settings.dateFormat,i18n.language)}</p>:null}</article>};
 function confirmDelete(){if(!deleting)return;removeActivity(deleting.id);if(selected?.id===deleting.id)setSelected(null);setDeleting(null)}
 if(!baby)return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">{t("growth.noMeasurements")}</div>;
 return <div className="space-y-6"><section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4"/>{t("growth.heroBadge")}</span><h1 className="mt-5 text-3xl font-bold sm:text-4xl">{t("growth.heroTitle",{babyName:baby.name})}</h1><p className="mt-3 max-w-2xl text-violet-100">{t("growth.heroDescription")}</p></div><button onClick={()=>document.getElementById("growth-add")?.scrollIntoView({behavior:"smooth"})} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-semibold text-violet-700"><Plus className="h-5 w-5"/>{t("activity.addGrowth")}</button></div></section>
 <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("growth.latestMeasurements")}</h2><span className="text-xs text-slate-500">{t("growth.latestOverall")}</span></div><div className="grid gap-4 md:grid-cols-3">{metricCard("weightKg",t("activity.weightKg"),weight,<Scale className="h-4 w-4 text-violet-600"/>)}{metricCard("heightCm",t("activity.heightCm"),height,<Ruler className="h-4 w-4 text-violet-600"/>)}{metricCard("headCircumferenceCm",t("activity.headCircumferenceCm"),head,<Sparkles className="h-4 w-4 text-violet-600"/>)}</div></section>
 <WeightPercentileCard
  weightKg={weight.value}
  measuredAt={
    weight.latest?.startedAt ?? null
  }
  birthDate={babyBirthDate}
  sex={babySex}
  gestationalAgeWeeks={
    babyGestationalAgeWeeks
  }
/>
<WhoGrowthChart
  birthDate={babyBirthDate}
  sex={babySex}
  gestationalAgeWeeks={babyGestationalAgeWeeks}
  measurements={whoGrowthMeasurements}
/>
 <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{(["1m","3m","6m","all"] as GrowthPeriod[]).map(value=><button key={value} onClick={()=>setPeriod(value)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${period===value?"border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950":"border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{t(`growth.period.${value}`)}</button>)}</div><span className="text-sm text-slate-500">{t("growth.measurementsInPeriod",{count:visible.length})}</span></div>
 <PremiumGate title={t("growth.premiumTitle")} description={t("growth.premiumDescription")} preview={<div className="grid gap-4 xl:grid-cols-3"><GrowthChart title={t("growth.weightChart")} points={charts.weight} unit={settings.weightUnit} empty={t("growth.noWeightData")}/><GrowthChart title={t("growth.heightChart")} points={charts.height} unit={settings.lengthUnit} empty={t("growth.noHeightData")}/><GrowthChart title={t("growth.headChart")} points={charts.head} unit={settings.lengthUnit} empty={t("growth.noHeadData")}/></div>}><div className="space-y-5"><div className="grid gap-4 xl:grid-cols-3"><GrowthChart title={t("growth.weightChart")} points={charts.weight} unit={settings.weightUnit} empty={t("growth.noWeightData")}/><GrowthChart title={t("growth.heightChart")} points={charts.height} unit={settings.lengthUnit} empty={t("growth.noHeightData")}/><GrowthChart title={t("growth.headChart")} points={charts.head} unit={settings.lengthUnit} empty={t("growth.noHeadData")}/></div><section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500"/><h2 className="font-bold text-slate-900 dark:text-white">{t("growth.insightsTitle")}</h2></div><div className="mt-4 grid gap-3 md:grid-cols-3">{insights.length?insights.map(item=><div key={item.title} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">{item.title}</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.value}</p></div>):<p className="text-sm text-slate-500">{t("growth.noInsights")}</p>}</div></section></div></PremiumGate>
 <section id="growth-add" className="scroll-mt-20"><GrowthQuickAdd/></section>
 <section className="rounded-[2rem] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-violet-600">{t("growth.historyTitle")}</p><h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("growth.historySubtitle")}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-700">{visible.length}</span></div>{visible.length?<div className="mt-5 space-y-3">{visible.map(entry=><article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><button onClick={()=>setSelected(entry)} className="min-w-0 flex-1 text-left"><p className="font-semibold text-slate-900 dark:text-white"><CalendarDays className="mr-2 inline h-4 w-4"/>{formatDateValue(entry.startedAt,settings.dateFormat,i18n.language)} · {formatTimeValue(entry.startedAt,settings.timeFormat,i18n.language)}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{[entry.data.weightKg!==undefined?formatWeight(entry.data.weightKg,settings.weightUnit,i18n.language):null,entry.data.heightCm!==undefined?formatLength(entry.data.heightCm,settings.lengthUnit,i18n.language):null,entry.data.headCircumferenceCm!==undefined?formatLength(entry.data.headCircumferenceCm,settings.lengthUnit,i18n.language):null].filter(Boolean).join(" · ")}</p>{entry.note?<p className="mt-2 truncate text-sm text-slate-500">{entry.note}</p>:null}</button><button onClick={()=>setDeleting(entry)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-rose-600 dark:border-slate-700">{t("activity.delete")}</button></div></article>)}</div>:<div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">{t("growth.emptyHistory")}</div>}</section>
 <ActivityDetailsDrawer activity={selected} onClose={()=>setSelected(null)}/><ActivityDeleteDialog isOpen={deleting!==null} onCancel={()=>setDeleting(null)} onConfirm={confirmDelete}/></div>
}
