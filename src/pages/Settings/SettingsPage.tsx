import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Download, Moon, Shield, Sparkles, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppSettingsStore } from "../../store/appSettingsStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { useVaccinationStore } from "../../store/vaccinationStore";
import { useBabyStore } from "../../store/babyStore";
import { useActivityStore } from "../../store/activityStore";
import { useBreastfeedingTimerStore } from "../../store/breastfeedingTimerStore";
import { formatDateValue, formatTimeValue } from "../../features/settings/utils/formatting";
import { parseBabyNestExport, type BabyNestExport } from "../../features/settings/utils/dataTransfer";
import { useMilestoneStore } from "../../store/milestoneStore";

const notificationKeys = [
  { key: "sleep", labelKey: "settings.notificationsSleep" },
  { key: "feeding", labelKey: "settings.notificationsFeeding" },
  { key: "diaper", labelKey: "settings.notificationsDiaper" },
  { key: "medicine", labelKey: "settings.notificationsMedicine" },
  { key: "vaccination", labelKey: "settings.notificationsVaccination" },
  { key: "milestone", labelKey: "settings.notificationsMilestone" },
] as const;

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const settings = useAppSettingsStore((state) => state);
  const setLanguage = useAppSettingsStore((state) => state.setLanguage);
  const setTimeFormat = useAppSettingsStore((state) => state.setTimeFormat);
  const setDateFormat = useAppSettingsStore((state) => state.setDateFormat);
  const setFirstDayOfWeek = useAppSettingsStore((state) => state.setFirstDayOfWeek);
  const setWeightUnit = useAppSettingsStore((state) => state.setWeightUnit);
  const setLengthUnit = useAppSettingsStore((state) => state.setLengthUnit);
  const setAppearance = useAppSettingsStore((state) => state.setAppearance);
  const setNotification = useAppSettingsStore((state) => state.setNotification);
  const resetSettings = useAppSettingsStore((state) => state.reset);
  const plan = useSubscriptionStore((state) => state.plan);
  const setPlan = useSubscriptionStore((state) => state.setPlan);
  const babies = useBabyStore((state) => state.babies);
  const selectedBabyId = useBabyStore((state) => state.selectedBabyId);
  const replaceBabies = useBabyStore((state) => state.replaceBabies);
  const resetBabies = useBabyStore((state) => state.reset);
  const activities = useActivityStore((state) => state.activities);
  const replaceActivities = useActivityStore((state) => state.replaceActivities);
  const clearActivities = useActivityStore((state) => state.clearActivities);
  const resetBreastfeedingTimer = useBreastfeedingTimerStore((state) => state.cancelSession);
  const activeSession = useBreastfeedingTimerStore((state) => state.activeSession);
  const vaccinationRecords=useVaccinationStore(state=>state.records);const vaccinationConflicts=useVaccinationStore(state=>state.conflicts);const replaceVaccinations=useVaccinationStore(state=>state.replaceRecords);
  const milestoneRecords=useMilestoneStore(state=>state.records);const milestoneCatalogVersion=useMilestoneStore(state=>state.catalogVersion);const replaceMilestones=useMilestoneStore(state=>state.replaceRecords);
  const replaceSettings = useAppSettingsStore((state) => state.replaceSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearPhrase, setClearPhrase] = useState("");
  const [confirmImport, setConfirmImport] = useState(false);
  const [importPayload, setImportPayload] = useState<BabyNestExport | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const previewDate = useMemo(() => new Date(), []);

  const handleExport = () => {
    const exportPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings,
      babies,
      selectedBabyId,
      activities,
      subscription: { plan },
      timers: { breastfeedingActiveSession: activeSession },
      vaccinations:{records:vaccinationRecords,conflicts:vaccinationConflicts},
      milestones:{catalogVersion:milestoneCatalogVersion,records:milestoneRecords},
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "babynest-export.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(t("settings.exportSuccess"));
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const payloadText = await readFileAsText(file);
      const parsed = JSON.parse(payloadText);

      const validated = parseBabyNestExport(parsed);
      if (!validated) {
        throw new Error(t("settings.importInvalid"));
      }
      setError(null);
      setImportPayload(validated);
      setConfirmImport(true);
      event.target.value = "";
    } catch (importError) {
      setError(t("settings.importInvalid"));
      console.error(importError);
    }
  };

  const applyImport = () => {
    if (!importPayload) {
      return;
    }
    replaceSettings(importPayload.settings);
    replaceBabies(importPayload.babies, importPayload.selectedBabyId);
    replaceActivities(importPayload.activities);
    replaceVaccinations(importPayload.vaccinations?.records??[],importPayload.vaccinations?.conflicts??[]);
    replaceMilestones(importPayload.milestones?.records??[],importPayload.milestones?.catalogVersion);
    resetBreastfeedingTimer();
    setPlan(importPayload.subscription.plan);
    void i18n.changeLanguage(importPayload.settings.language);

    setConfirmImport(false);
    setImportPayload(null);
    setMessage(t("settings.importSuccess"));
  };

  const handleClearData = () => {
    if (clearPhrase.trim().toLowerCase() !== "clear all") {
      setError(t("settings.clearConfirmRequired"));
      return;
    }

    localStorage.removeItem("babynest-settings");
    localStorage.removeItem("babynest-babies");
    localStorage.removeItem("babynest-activities");
    localStorage.removeItem("babynest-subscription");
    localStorage.removeItem("babynest-breastfeeding-timer");
    localStorage.removeItem("babynest-language");
    localStorage.removeItem("babynest-milestones");
    resetSettings();
    resetBabies();
    clearActivities();
    resetBreastfeedingTimer();
    setPlan("free");
    void i18n.changeLanguage("bg");
    setClearPhrase("");
    setConfirmClear(false);
    setMessage(t("settings.clearSuccess"));
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-300">{t("settings.title")}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t("settings.subtitle")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{t("settings.description")}</p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-slate-200">{t("settings.currentPlan")}</p>
            <p className="mt-1 text-lg font-semibold text-white">{plan === "premium" ? t("settings.premiumPlan") : t("settings.freePlan")}</p>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><Sparkles className="h-4 w-4" />{t("settings.language")}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.language")}</label>
                <select value={settings.language} onChange={(event) => { setLanguage(event.target.value as "bg" | "en"); void i18n.changeLanguage(event.target.value); }} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="bg">{t("settings.bulgarian")}</option>
                  <option value="en">{t("settings.english")}</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.timeFormat")}</label>
                <select value={settings.timeFormat} onChange={(event) => setTimeFormat(event.target.value as "24h" | "12h")} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="24h">{t("settings.time24h")}</option>
                  <option value="12h">{t("settings.time12h")}</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.dateFormat")}</label>
                <select value={settings.dateFormat} onChange={(event) => setDateFormat(event.target.value as "dd.MM.yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd")} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="dd.MM.yyyy">{t("settings.dateDmy")}</option>
                  <option value="MM/dd/yyyy">{t("settings.dateMdy")}</option>
                  <option value="yyyy-MM-dd">{t("settings.dateYmd")}</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.firstDayOfWeek")}</label>
                <select value={settings.firstDayOfWeek} onChange={(event) => setFirstDayOfWeek(event.target.value as "monday" | "sunday")} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="monday">{t("settings.monday")}</option>
                  <option value="sunday">{t("settings.sunday")}</option>
                </select>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>{t("settings.preview")}: {formatTimeValue(previewDate, settings.timeFormat, i18n.language)} · {formatDateValue(previewDate, settings.dateFormat, i18n.language)}</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><Shield className="h-4 w-4" />{t("settings.units")}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.weightUnit")}</label>
                <select value={settings.weightUnit} onChange={(event) => setWeightUnit(event.target.value as "kg" | "lb")} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="kg">{t("settings.kg")}</option>
                  <option value="lb">{t("settings.lb")}</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("settings.lengthUnit")}</label>
                <select value={settings.lengthUnit} onChange={(event) => setLengthUnit(event.target.value as "cm" | "in")} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                  <option value="cm">{t("settings.cm")}</option>
                  <option value="in">{t("settings.in")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><Moon className="h-4 w-4" />{t("settings.appearance")}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(["system", "light", "dark"] as const).map((appearance) => (
                <button key={appearance} type="button" onClick={() => setAppearance(appearance)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${settings.appearance === appearance ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-700"}`}>{t(`settings.${appearance}`)}</button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><AlertTriangle className="h-4 w-4" />{t("settings.notifications")}</div>
            <div className="mt-4 space-y-3">
              {notificationKeys.map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <span>{t(item.labelKey)}</span>
                  <input type="checkbox" checked={settings.notifications[item.key]} onChange={(event) => setNotification(item.key, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">{t("settings.notificationsHint")}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><Shield className="h-4 w-4" />{t("settings.subscription")}</div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{t("settings.currentPlan")}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{plan === "premium" ? t("settings.premiumPlan") : t("settings.freePlan")}</p>
            </div>
            <button type="button" onClick={() => navigate("/plans")} className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{t("settings.managePlan")}</button>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><Download className="h-4 w-4" />{t("settings.dataPrivacy")}</div>
            <div className="mt-4 space-y-3">
              <button type="button" onClick={handleExport} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                <span>{t("settings.exportData")}</span>
                <Download className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                <span>{t("settings.importData")}</span>
                <Upload className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
              <button type="button" onClick={() => { setError(null); setMessage(null); setConfirmClear(true); }} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                <span>{t("settings.clearData")}</span>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </section>

          {import.meta.env.DEV ? <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><CheckCircle2 className="h-4 w-4" />{t("settings.devTools")}</div>
            <p className="mt-3 text-sm text-slate-500">{t("settings.devToolsDescription")}</p>
          </section> : null}
        </div>
      </div>

      {confirmImport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <h3 className="text-xl font-semibold text-slate-900">{t("settings.importConfirmTitle")}</h3>
            <p className="mt-3 text-sm text-slate-600">{t("settings.importConfirmDescription")}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setConfirmImport(false); setImportPayload(null); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">{t("settings.cancel")}</button>
              <button type="button" onClick={applyImport} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{t("settings.importData")}</button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-rose-700">{t("settings.clearData")}</h3>
            <p className="mt-3 text-sm text-slate-600">{t("settings.clearDataHint")}</p>
            <input autoFocus value={clearPhrase} onChange={(event) => setClearPhrase(event.target.value)} placeholder={t("settings.clearPhrasePlaceholder")} className="mt-4 h-11 w-full rounded-xl border border-rose-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-rose-100" />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setConfirmClear(false); setClearPhrase(""); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">{t("settings.cancel")}</button>
              <button type="button" onClick={handleClearData} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">{t("settings.clearData")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
