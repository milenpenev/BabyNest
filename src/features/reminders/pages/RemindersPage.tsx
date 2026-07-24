import { BellRing, Clock3, History, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PremiumGate from "../../../components/premium/PremiumGate";
import type {
  Reminder,
  ReminderIntervalSource,
  ReminderSchedule,
  ReminderType,
} from "../../../entities/reminder/reminder.types";
import { useActivityStore } from "../../../store/activityStore";
import { useAppSettingsStore } from "../../../store/appSettingsStore";
import { useBabyStore } from "../../../store/babyStore";
import { useReminderStore } from "../../../store/reminderStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import { getReminderReferenceTimestamp } from "../utils/reminderSchedule";

type FormState = {
  type: ReminderType;
  title: string;
  babyId: string;
  kind: ReminderSchedule["kind"];
  intervalMinutes: string;
  intervalSource: ReminderIntervalSource;
  time: string;
  scheduledAt: string;
  note: string;
  enabled: boolean;
  activityAware: boolean;
};
const initialForm = (babyId: string): FormState => ({
  type: "feeding",
  title: "",
  babyId,
  kind: "interval",
  intervalMinutes: "180",
  intervalSource: "custom",
  time: "09:00",
  scheduledAt: "",
  note: "",
  enabled: true,
  activityAware: false,
});
function localInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function RemindersPage() {
  const { t, i18n } = useTranslation();
  const babies = useBabyStore((s) => s.babies);
  const selectedBabyId = useBabyStore((s) => s.selectedBabyId);
  const reminders = useReminderStore((s) => s.reminders);
  const events = useReminderStore((s) => s.events);
  const add = useReminderStore((s) => s.addReminder);
  const update = useReminderStore((s) => s.updateReminder);
  const remove = useReminderStore((s) => s.deleteReminder);
  const toggle = useReminderStore((s) => s.toggleReminder);
  const clearHistory = useReminderStore((s) => s.clearHistory);
  const activities = useActivityStore((s) => s.activities);
  const preferences = useAppSettingsStore((s) => s.notifications);
  const plan = useSubscriptionStore((s) => s.effectivePlan);
  const [now, setNow] = useState(() => new Date());
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() =>
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState(() => initialForm(selectedBabyId ?? ""));
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const typeOptions: ReminderType[] = [
    "feeding",
    "diaper",
    "sleep",
    "medicine",
    "bath",
    "vaccination",
    "custom",
  ];
  const validReminders = reminders.filter((r) =>
    babies.some((b) => b.id === r.babyId),
  );
  const sorted = [...validReminders].sort(
    (a, b) =>
      new Date(a.nextTriggerAt ?? 8640000000000000).getTime() -
      new Date(b.nextTriggerAt ?? 8640000000000000).getTime(),
  );
  const upcoming = sorted.filter((r) => r.enabled);
  const disabled = sorted.filter((r) => !r.enabled);
  const categoryMuted = (type: ReminderType) =>
    type !== "bath" && type !== "custom" && !preferences[type];
  function openNew(preset?: Partial<FormState>) {
    setEditing(null);
    setForm({
      ...initialForm(selectedBabyId ?? babies[0]?.id ?? ""),
      ...preset,
    });
    setError("");
    setOpen(true);
  }
  function openEdit(reminder: Reminder) {
    setEditing(reminder);
    setForm({
      type: reminder.type,
      title: reminder.title,
      babyId: reminder.babyId,
      kind: reminder.schedule.kind,
      intervalMinutes:
        reminder.schedule.kind === "interval"
          ? String(reminder.schedule.intervalMinutes)
          : "180",
      intervalSource: reminder.intervalSource ?? "custom",
      time:
        reminder.schedule.kind === "daily-time"
          ? reminder.schedule.time
          : "09:00",
      scheduledAt:
        reminder.schedule.kind === "one-time"
          ? localInput(new Date(reminder.schedule.scheduledAt))
          : "",
      note: reminder.note ?? "",
      enabled: reminder.enabled,
      activityAware: Boolean(reminder.activityAware),
    });
    setError("");
    setOpen(true);
  }
  function save() {
    if (!form.babyId) {
      setError(t("reminders.validationBaby"));
      return;
    }
    if (!form.title.trim()) {
      setError(t("reminders.validationTitle"));
      return;
    }
    let schedule: ReminderSchedule;
    if (form.kind === "interval") {
      const value = Number(form.intervalMinutes);
      if (!Number.isFinite(value) || value <= 0) {
        setError(t("reminders.validationInterval"));
        return;
      }
      schedule = { kind: "interval", intervalMinutes: value };
    } else if (form.kind === "daily-time") {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) {
        setError(t("reminders.validationTime"));
        return;
      }
      schedule = { kind: "daily-time", time: form.time };
    } else {
      const date = new Date(form.scheduledAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        setError(t("reminders.validationFuture"));
        return;
      }
      schedule = { kind: "one-time", scheduledAt: date.toISOString() };
    }
    const timestamp = new Date().toISOString();
    const data = {
      babyId: form.babyId,
      type: form.type,
      title: form.title.trim(),
      note: form.note.trim() || undefined,
      enabled: form.enabled,
      activityAware: plan === "premium" && form.activityAware,
      intervalSource:
        form.kind === "interval" && ["feeding", "diaper"].includes(form.type)
          ? form.intervalSource
          : ("custom" as const),
      schedule,
      updatedAt: timestamp,
    };
    if (editing) update(editing.id, data, activities);
    else
      add(
        { id: crypto.randomUUID(), createdAt: timestamp, ...data },
        activities,
      );
    setOpen(false);
  }
  async function requestPermission() {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPermission("denied");
      return;
    }
    setPermission(await Notification.requestPermission());
  }
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";
  const referenceText = (reminder: Reminder) => {
    if (!reminder.activityAware) return null;
    const reference = getReminderReferenceTimestamp(reminder, activities, now);
    const time = new Intl.DateTimeFormat(i18n.language, {
      timeStyle: "short",
    }).format(new Date(reference.referenceAt));
    if (reference.source === "feeding-activity")
      return t("notificationsCenter.basedOnFeeding", { time });
    if (reference.source === "diaper-activity")
      return t("notificationsCenter.basedOnDiaper", { time });
    return t("notificationsCenter.fallbackSchedule");
  };
  const renderCard = (reminder: Reminder) => (
    <article
      key={reminder.id}
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => openEdit(reminder)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {t(`reminders.types.${reminder.type}`)}
            </span>
            {categoryMuted(reminder.type) ? (
              <span className="text-xs text-amber-600">
                {t("reminders.muted")}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">
            {reminder.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatDate(reminder.nextTriggerAt)}{" "}
            {reminder.nextTriggerAt &&
            new Date(reminder.nextTriggerAt) <= now ? (
              <strong className="text-rose-600">
                · {t("reminders.overdue")}
              </strong>
            ) : null}
          </p>
          {referenceText(reminder) ? (
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              {referenceText(reminder)}
            </p>
          ) : null}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggle(reminder.id, activities)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
          >
            {reminder.enabled ? t("reminders.disable") : t("reminders.enable")}
          </button>
          <button
            type="button"
            onClick={() => remove(reminder.id)}
            aria-label={t("reminders.delete")}
            className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
  const advanced = (
    <section className="rounded-3xl border border-violet-200 bg-white p-5 dark:border-violet-900 dark:bg-slate-800">
      <h2 className="font-bold text-slate-900 dark:text-white">
        {t("reminders.advancedTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t("reminders.advancedDescription")}
      </p>
    </section>
  );
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <BellRing className="h-8 w-8" />
              <h1 className="text-3xl font-bold">{t("reminders.title")}</h1>
            </div>
            <p className="mt-3 max-w-2xl text-indigo-100">
              {t("reminders.description")}
            </p>
            <p className="mt-2 text-sm font-medium">
              {babies.find((b) => b.id === selectedBabyId)?.name ??
                t("reminders.noBaby")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNew()}
            disabled={!babies.length}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-semibold text-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t("reminders.add")}
          </button>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-bold text-slate-900 dark:text-white">
          {t("reminders.permissionTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t(`reminders.permission.${permission}`)}
        </p>
        {permission === "default" ? (
          <button
            type="button"
            onClick={requestPermission}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white"
          >
            {t("reminders.enableNotifications")}
          </button>
        ) : null}
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("reminders.presets")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["feeding", "presetFeeding", 180],
            ["diaper", "presetDiaper", 180],
            ["medicine", "presetVitamin", null],
            ["bath", "presetBath", null],
            ["custom", "presetCustom", null],
          ].map(([type, key, interval]) => (
            <button
              key={String(key)}
              type="button"
              onClick={() =>
                openNew({
                  type: type as ReminderType,
                  title: t(`reminders.${key}`),
                  kind: interval ? "interval" : "daily-time",
                  intervalMinutes: String(interval ?? 180),
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {t(`reminders.${key}`)}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("reminders.upcoming")}
        </h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {upcoming.length ? (
            upcoming.map(renderCard)
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
              {t("reminders.noUpcoming")}
            </p>
          )}
        </div>
      </section>
      {disabled.length ? (
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("reminders.disabled")}
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {disabled.map(renderCard)}
          </div>
        </section>
      ) : null}
      <PremiumGate
        title={t("reminders.advancedTitle")}
        description={t("reminders.advancedDescription")}
        preview={advanced}
      >
        {advanced}
      </PremiumGate>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <History className="h-5 w-5" />
            {t("reminders.history")}
          </h2>
          {events.length ? (
            <button
              onClick={clearHistory}
              className="text-sm font-semibold text-rose-600"
            >
              {t("reminders.clearHistory")}
            </button>
          ) : null}
        </div>
        <div className="mt-4 space-y-2">
          {events.length ? (
            events.map((event) => (
              <p
                key={event.id}
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                {formatDate(event.triggeredAt)} ·{" "}
                {t(`reminders.event.${event.status}`)}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500">{t("reminders.noHistory")}</p>
          )}
        </div>
      </section>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="my-auto w-full max-w-xl rounded-3xl bg-white p-5 shadow-xl dark:bg-slate-800">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editing ? t("reminders.edit") : t("reminders.add")}
              </h2>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">
                {t("reminders.type")}
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ReminderType })
                  }
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 dark:border-slate-600 dark:bg-slate-900"
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {t(`reminders.types.${type}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-600 dark:text-slate-300">
                {t("reminders.baby")}
                <select
                  value={form.babyId}
                  onChange={(e) => setForm({ ...form, babyId: e.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 dark:border-slate-600 dark:bg-slate-900"
                >
                  {babies.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-300">
                {t("reminders.reminderTitle")}
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600 dark:text-slate-300">
                {t("reminders.schedule")}
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as ReminderSchedule["kind"],
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border bg-white px-3 dark:border-slate-600 dark:bg-slate-900"
                >
                  <option value="interval">{t("reminders.interval")}</option>
                  <option value="daily-time">{t("reminders.daily")}</option>
                  <option value="one-time">{t("reminders.oneTime")}</option>
                </select>
              </label>
              {form.kind === "interval" ? (
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  {t("reminders.intervalMinutes")}
                  <input
                    type="number"
                    min="1"
                    value={form.intervalMinutes}
                    onChange={(e) =>
                      setForm({ ...form, intervalMinutes: e.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
                  />
                </label>
              ) : form.kind === "daily-time" ? (
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  {t("reminders.time")}
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
                  />
                </label>
              ) : (
                <label className="text-sm text-slate-600 dark:text-slate-300">
                  {t("reminders.dateTime")}
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm({ ...form, scheduledAt: e.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
                  />
                </label>
              )}
              <label className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-300">
                {t("reminders.note")}
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="mt-1 min-h-20 w-full rounded-xl border p-3 dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                />
                {t("reminders.enabled")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={
                    plan !== "premium" ||
                    !["feeding", "diaper", "sleep"].includes(form.type)
                  }
                  checked={form.activityAware}
                  onChange={(e) =>
                    setForm({ ...form, activityAware: e.target.checked })
                  }
                />
                {t("reminders.activityAware")}
              </label>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={save}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white"
            >
              <Clock3 className="h-4 w-4" />
              {t("reminders.save")}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
