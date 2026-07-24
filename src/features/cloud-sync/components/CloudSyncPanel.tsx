import {
  AlertTriangle,
  Cloud,
  Download,
  Loader2,
  LogIn,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { babyNestDb } from "../../../lib/local-db/babyNestDb";
import type {
  SyncConflict,
  SyncOperation,
} from "../../../lib/local-db/localDb.types";
import { isCloudConfigured } from "../../../lib/supabase/supabaseClient";
import { useActivityStore } from "../../../store/activityStore";
import { useAuthStore } from "../../../store/authStore";
import { useBabyStore } from "../../../store/babyStore";
import { useBreastfeedingTimerStore } from "../../../store/breastfeedingTimerStore";
import { useSyncStatusStore } from "../../../store/syncStatusStore";
import {
  pushQueue,
  refreshSyncCounts,
} from "../../../data/sync/cloudSyncService";
import {
  clearFailedQueue,
  dismissQueueOperation,
  retryFailedQueue,
  retryQueueOperation,
} from "../../../data/sync/syncQueue";
import { authService } from "../../auth/services/authService";
import { resolveConflict } from "../services/conflictService";
import {
  createCloudFamily,
  createLocalBackup,
  downloadMigrationBackup,
  migrateLocalData,
  type MigrationBackup,
} from "../services/localMigrationService";
export default function CloudSyncPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const sync = useSyncStatusStore();
  const babies = useBabyStore((s) => s.babies);
  const activities = useActivityStore((s) => s.activities);
  const activeSleep = useActivityStore((s) => s.activeActivity);
  const activeFeeding = useBreastfeedingTimerStore((s) => s.activeSession);
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [backup, setBackup] = useState<MigrationBackup | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [queueIssues, setQueueIssues] = useState<SyncOperation[]>([]);
  const [queueActionId, setQueueActionId] = useState<string | null>(
    null,
  );
  const [clearingQueue, setClearingQueue] = useState(false);
  const controller = useRef<AbortController | null>(null);
  async function refresh() {
    await refreshSyncCounts();
    setConflicts(
      await babyNestDb.conflicts.where("status").equals("unresolved").toArray(),
    );
    setQueueIssues(
      await babyNestDb.syncQueue
        .where("status")
        .anyOf("failed", "blocked")
        .toArray(),
    );
    const cloud = await babyNestDb.syncState.get("cloud");
    setFamilyId(cloud?.familyId ?? "");
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!conflicts.length || window.location.hash !== "#conflict-review") return;
    window.requestAnimationFrame(() => {
      const target = document.getElementById("conflict-review");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.focus({ preventScroll: true });
    });
  }, [conflicts.length]);
  async function retryOperation(operationId: string) {
    setQueueActionId(operationId);
    setMessage("");

    try {
      await retryQueueOperation(operationId);
      await pushQueue();
      await refresh();
    } catch (error) {
      console.error(
        "[BabyNest sync] Failed to retry operation",
        error,
      );

      setMessage(t("cloudSync.queueActionFailed"));
    } finally {
      setQueueActionId(null);
    }
  }

  async function dismissOperation(operationId: string) {
    setQueueActionId(operationId);
    setMessage("");

    try {
      await dismissQueueOperation(operationId);
      await refresh();
    } catch (error) {
      console.error(
        "[BabyNest sync] Failed to dismiss operation",
        error,
      );

      setMessage(t("cloudSync.queueActionFailed"));
    } finally {
      setQueueActionId(null);
    }
  }

  async function clearFailedOperations() {
    if (
      !window.confirm(
        t("cloudSync.clearFailedConfirm"),
      )
    ) {
      return;
    }

    setClearingQueue(true);
    setMessage("");

    try {
      const cleared = await clearFailedQueue();
      await refresh();

      setMessage(
        t("cloudSync.clearedFailedResult", {
          count: cleared,
        }),
      );
    } catch (error) {
      console.error(
        "[BabyNest sync] Failed to clear failed operations",
        error,
      );

      setMessage(t("cloudSync.queueActionFailed"));
    } finally {
      setClearingQueue(false);
    }
  }

  async function startMigration() {
    if (!user || !confirm || activeSleep || activeFeeding) return;
    setBusy(true);
    setMessage("");
    controller.current = new AbortController();
    try {
      const localBackup = backup ?? createLocalBackup(babies, activities);
      setBackup(localBackup);
      const target =
        familyId ||
        (await createCloudFamily(
          familyName || t("cloudSync.defaultFamilyName"),
        ));
      setFamilyId(target);
      await migrateLocalData({
        familyId: target,
        babies,
        activities,
        signal: controller.current.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setMessage(t("cloudSync.migrationComplete"));
      await pushQueue();
      await refresh();
    } catch (error) {
      setMessage(
        t(
          error instanceof DOMException && error.name === "AbortError"
            ? "cloudSync.migrationCancelled"
            : "cloudSync.migrationFailed",
        ),
      );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }
  return (
    <section className="rounded-[2rem] border border-cyan-200 bg-white p-5 shadow-sm dark:border-cyan-900 dark:bg-slate-800 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
          <Cloud className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold">{t("cloudSync.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("cloudSync.description")}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={t("cloudSync.connection")}
          value={t(`cloudSync.states.${sync.state}`)}
        />
        <Metric
          label={t("cloudSync.pending")}
          value={String(sync.pendingCount)}
        />
        <Metric
          label={t("cloudSync.failed")}
          value={String(sync.failedCount)}
        />
        <Metric
          label={t("cloudSync.conflicts")}
          value={String(sync.conflictCount)}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {t("cloudSync.lastSynced")}:{" "}
        {sync.lastSuccessfulSync
          ? new Date(sync.lastSuccessfulSync).toLocaleString()
          : "—"}
      </p>
      {queueIssues.length ? (
        <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />

                <h3 className="font-bold text-rose-800 dark:text-rose-200">
                  {t("cloudSync.failedOperationsTitle")}
                </h3>
              </div>

              <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-300/80">
                {t("cloudSync.failedOperationsHelp")}
              </p>
            </div>

            <button
              type="button"
              disabled={clearingQueue || Boolean(queueActionId)}
              onClick={() => void clearFailedOperations()}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-40 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
            >
              {clearingQueue ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              {t("cloudSync.clearFailed")}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {queueIssues.map((operation) => {
              const operationBusy =
                queueActionId === operation.id;

              return (
                <article
                  key={operation.id}
                  className="rounded-xl border border-rose-200 bg-white p-4 dark:border-rose-900 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {t("cloudSync.operationDescription", {
                          entity: operation.entityType,
                          operation: operation.operation,
                        })}
                      </p>

                      <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {t(
                          `cloudSync.queueStatuses.${operation.status}`,
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          operationBusy ||
                          clearingQueue
                        }
                        onClick={() =>
                          void retryOperation(operation.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                      >
                        {operationBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}

                        {t("cloudSync.retryOne")}
                      </button>

                      <button
                        type="button"
                        disabled={
                          operationBusy ||
                          clearingQueue
                        }
                        onClick={() =>
                          void dismissOperation(operation.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("cloudSync.dismiss")}
                      </button>
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                    <dt className="text-slate-500">
                      {t("cloudSync.errorLabel")}
                    </dt>
                    <dd className="break-words font-medium text-rose-700 dark:text-rose-300">
                      {operation.errorCode ||
                        t("cloudSync.unknownError")}
                    </dd>

                    <dt className="text-slate-500">
                      {t("cloudSync.attemptsLabel")}
                    </dt>
                    <dd>{operation.attempts}</dd>

                    <dt className="text-slate-500">
                      {t("cloudSync.createdLabel")}
                    </dt>
                    <dd>
                      {new Date(
                        operation.createdAt,
                      ).toLocaleString(i18n.language)}
                    </dd>
                  </dl>

                  <p className="mt-3 break-all text-[11px] text-slate-400">
                    {t("cloudSync.recordReference")}:{" "}
                    {operation.entityId}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {!isCloudConfigured ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {t("cloudSync.notConfigured")}
        </div>
      ) : !user ? (
        <button
          onClick={() => navigate("/auth/login?next=/settings")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <LogIn className="h-4 w-4" />
          {t("cloudSync.signIn")}
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {user.email}
          </span>
          <button
            onClick={() => void authService.signOut()}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {t("cloudSync.signOut")}
          </button>
          <button
            onClick={() =>
              void (async () => {
                await retryFailedQueue();
                await pushQueue();
                await refresh();
              })()
            }
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            {t("cloudSync.retry")}
          </button>
        </div>
      )}
      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
        <h3 className="font-bold">{t("cloudSync.migration.title")}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("cloudSync.migration.counts", {
            babies: babies.length,
            activities: activities.length,
          })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const value = createLocalBackup(babies, activities);
              setBackup(value);
              downloadMigrationBackup(value);
            }}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            <Download className="h-4 w-4" />
            {t("cloudSync.backup")}
          </button>
          {user ? (
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t("cloudSync.familyName")}
              className="h-10 min-w-48 flex-1 rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
            />
          ) : null}
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="mt-1"
          />
          <span>{t("cloudSync.migration.confirm")}</span>
        </label>
        {activeSleep || activeFeeding ? (
          <p className="mt-2 text-sm text-amber-700">
            {t("cloudSync.migration.activeTimer")}
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            disabled={
              !user || !confirm || busy || Boolean(activeSleep || activeFeeding)
            }
            onClick={() => void startMigration()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t("cloudSync.migrate")}
          </button>
          {busy ? (
            <button
              onClick={() => controller.current?.abort()}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {t("activity.cancel")}
            </button>
          ) : null}
        </div>
        {progress.total ? (
          <p className="mt-2 text-xs text-slate-500">
            {progress.done}/{progress.total}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
            {message}
          </p>
        ) : null}
      </div>
      {conflicts.length ? (
        <div id="conflict-review" tabIndex={-1} className="mt-6 scroll-mt-24 border-t border-slate-200 pt-5 outline-none dark:border-slate-700">
          <h3 className="font-bold">{t("cloudSync.conflictReview")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("cloudSync.conflictHelp")}
          </p>
          <div className="mt-4 space-y-4">
            {conflicts.map((conflict) => {
              const local = conflictDetails(conflict.localVersion);
              const cloud = conflictDetails(conflict.remoteVersion);
              const type = local.type ?? cloud.type ?? conflict.entityType;
              const typeLabel = t(`statistics.${type}`, { defaultValue: type });
              return (
                <article
                  key={conflict.id}
                  className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                    <h4 className="font-bold">
                      {t("cloudSync.activityRecord", { type: typeLabel })}
                    </h4>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <ConflictVersion
                      title={t("cloudSync.deviceVersion")}
                      hint={t("cloudSync.deviceVersionHint")}
                      details={local}
                      locale={i18n.language}
                      activeLabel={t("cloudSync.activeNow")}
                      unknownLabel={t("cloudSync.unknownValue")}
                      startedLabel={t("cloudSync.startedLabel")}
                      endedLabel={t("cloudSync.endedLabel")}
                      changedLabel={t("cloudSync.changedLabel")}
                    />
                    <ConflictVersion
                      title={t("cloudSync.cloudVersion")}
                      hint={t("cloudSync.cloudVersionHint")}
                      details={cloud}
                      locale={i18n.language}
                      activeLabel={t("cloudSync.activeNow")}
                      unknownLabel={t("cloudSync.unknownValue")}
                      startedLabel={t("cloudSync.startedLabel")}
                      endedLabel={t("cloudSync.endedLabel")}
                      changedLabel={t("cloudSync.changedLabel")}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() =>
                        void resolveConflict(conflict, "keep-local").then(
                          refresh,
                        )
                      }
                      className="rounded-xl bg-indigo-600 p-3 text-left text-white"
                    >
                      <strong className="block">
                        {t("cloudSync.useDeviceVersion")}
                      </strong>
                      <span className="mt-1 block text-xs text-indigo-100">
                        {t("cloudSync.useDeviceResult")}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        void resolveConflict(conflict, "keep-remote").then(
                          refresh,
                        )
                      }
                      className="rounded-xl border border-slate-300 bg-white p-3 text-left dark:border-slate-600 dark:bg-slate-800"
                    >
                      <strong className="block">
                        {t("cloudSync.useCloudVersion")}
                      </strong>
                      <span className="mt-1 block text-xs text-slate-500">
                        {t("cloudSync.useCloudResult")}
                      </span>
                    </button>
                  </div>
                  <p className="mt-3 break-all text-[11px] text-slate-400">
                    {t("cloudSync.recordReference")}: {conflict.entityId}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
        <h3 className="font-bold text-rose-700">{t("cloudSync.dangerZone")}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("cloudSync.deleteCloudDeferred")}
        </p>
        <button
          disabled
          className="mt-3 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 opacity-50"
        >
          {t("cloudSync.deleteCloudData")}
        </button>
      </div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}

function conflictDetails(input: unknown) {
  const outer =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const value =
    outer.value && typeof outer.value === "object"
      ? (outer.value as Record<string, unknown>)
      : outer;
  return {
    type: String(value.type ?? ""),
    startedAt: value.startedAt ?? value.started_at,
    endedAt: value.endedAt ?? value.ended_at,
    updatedAt: value.updatedAt ?? value.updated_at,
  };
}

function ConflictVersion({
  title,
  hint,
  details,
  locale,
  activeLabel,
  unknownLabel,
  startedLabel,
  endedLabel,
  changedLabel,
}: {
  title: string;
  hint: string;
  details: ReturnType<typeof conflictDetails>;
  locale: string;
  activeLabel: string;
  unknownLabel: string;
  startedLabel: string;
  endedLabel: string;
  changedLabel: string;
}) {
  const format = (value: unknown) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(String(value)))
      : unknownLabel;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h5 className="font-bold">{title}</h5>
      <p className="text-xs text-slate-500">{hint}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-slate-500">{startedLabel}</dt>
        <dd className="font-medium">{format(details.startedAt)}</dd>
        <dt className="text-slate-500">{endedLabel}</dt>
        <dd className="font-medium">
          {details.endedAt ? format(details.endedAt) : activeLabel}
        </dd>
        <dt className="text-slate-500">{changedLabel}</dt>
        <dd className="font-medium">{format(details.updatedAt)}</dd>
      </dl>
    </section>
  );
}
