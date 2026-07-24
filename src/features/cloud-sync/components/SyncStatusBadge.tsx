import { Cloud, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSyncStatusStore } from "../../../store/syncStatusStore";
export default function SyncStatusBadge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const state = useSyncStatusStore((s) => s.state);
  const pending = useSyncStatusStore((s) => s.pendingCount);
  const Icon =
    state === "offline"
      ? CloudOff
      : state === "syncing"
        ? Loader2
        : state === "failed" || state === "conflict"
          ? TriangleAlert
          : Cloud;
  const content = <>
    <Icon className={`h-3.5 w-3.5 ${state === "syncing" ? "animate-spin" : ""}`} />
    <span className={state === "conflict" ? "hidden sm:inline" : ""}>{t(`cloudSync.states.${state}`)}</span>
    {pending ? ` · ${pending}` : ""}
  </>;
  if (state === "conflict") return <button type="button" onClick={()=>navigate("/settings#conflict-review")} className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900" aria-label={t("cloudSync.states.conflict")} title={t("cloudSync.states.conflict")}>{content}</button>;
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${state === "failed" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : state === "offline" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}
    >
      {content}
    </span>
  );
}
