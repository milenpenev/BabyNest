import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useBabyStore } from "../../../store/babyStore";
import { useReminderStore } from "../../../store/reminderStore";

export default function UpcomingReminderCard() {
  const { t } = useTranslation(); const [now,setNow]=useState(()=>new Date()); const selectedBabyId=useBabyStore(s=>s.selectedBabyId); const reminders=useReminderStore(s=>s.reminders);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30_000);return()=>window.clearInterval(timer)},[]);
  const next=reminders.filter(r=>r.enabled&&r.babyId===selectedBabyId&&r.nextTriggerAt&&!Number.isNaN(new Date(r.nextTriggerAt).getTime())).sort((a,b)=>new Date(a.nextTriggerAt!).getTime()-new Date(b.nextTriggerAt!).getTime())[0];
  const minutes=next?Math.ceil((new Date(next.nextTriggerAt!).getTime()-now.getTime())/60_000):0;
  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-indigo-600"/><div className="min-w-0 flex-1"><h2 className="font-semibold text-slate-900 dark:text-white">{t("reminders.dashboardTitle")}</h2>{next?<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{next.title} · {minutes<=0?t("reminders.overdue"):t("reminders.inMinutes",{count:minutes})}</p>:<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("reminders.noUpcoming")}</p>}</div><Link to="/reminders" className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{t("reminders.manage")}</Link></div></section>;
}
