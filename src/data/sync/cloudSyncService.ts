import type { RealtimeChannel } from "@supabase/supabase-js";
import { babyNestDb } from "../../lib/local-db/babyNestDb";
import type {
  LocalEntity,
  SyncOperation,
} from "../../lib/local-db/localDb.types";
import { requireSupabase, supabase } from "../../lib/supabase/supabaseClient";
import { useSyncStatusStore } from "../../store/syncStatusStore";
import { markQueueFailure } from "./syncQueue";
import { normalizeSyncError } from "./syncErrors";
import { useBabyStore } from "../../store/babyStore";
import { useActivityStore } from "../../store/activityStore";
import type { Baby } from "../../entities/baby/model/baby.types";
import type { Activity } from "../../entities/activity/model/activity.types";
import {
  useBreastfeedingTimerStore,
  type BreastfeedingSession,
} from "../../store/breastfeedingTimerStore";
const tables = {
  family: "families",
  familyMember: "family_members",
  baby: "babies",
  activity: "activities",
} as const;
type QueueEntity = keyof typeof tables;
function rowPayload(
  operation: SyncOperation,
  activeFamilyId?: string,
  resolvedEntityId?: string,
  resolvedBabyId?: string,
) {
  const value = operation.payload as Record<string, unknown>;
  const map = JSON.parse(
    localStorage.getItem("babynest-cloud-migration-map") || "{}",
  ) as Record<string, string>;
  const mapped = (id: unknown) => map[String(id)] ?? String(id);
  if (operation.entityType === "activity")
    return {
      id: resolvedEntityId ?? mapped(operation.entityId),
      family_id: activeFamilyId ?? value.familyId,
      baby_id: resolvedBabyId ?? mapped(value.babyId),
      type: value.type,
      started_at: value.startedAt,
      ended_at: value.endedAt ?? null,
      data: value.data ?? {},
      note: value.note ?? null,
      client_id: localStorage.getItem("babynest-device-id"),
    };
  if (operation.entityType === "baby")
    return {
      id: resolvedEntityId ?? mapped(operation.entityId),
      family_id: activeFamilyId ?? value.familyId,
      name: value.name,
      birthday: value.birthday,
      gender: value.gender,
      gestational_week: value.gestationalWeek,
      data: value,
      client_id: localStorage.getItem("babynest-device-id"),
    };
  if (operation.entityType === "family")
    return {
      id: mapped(operation.entityId),
      name: value.name,
      owner_id: value.ownerId ?? value.owner_id,
      client_id: localStorage.getItem("babynest-device-id"),
    };
  return {
    id: mapped(operation.entityId),
    family_id: activeFamilyId ?? value.familyId,
    profile_id: value.userId,
    role: value.role,
    status: "active",
    permissions: value.permissions ?? {},
    client_id: localStorage.getItem("babynest-device-id"),
  };
}
export async function refreshSyncCounts() {
  const [pending, failed, conflicts] = await Promise.all([
    babyNestDb.syncQueue.where("status").anyOf("pending", "syncing").count(),
    babyNestDb.syncQueue.where("status").anyOf("failed", "blocked").count(),
    babyNestDb.conflicts.where("status").equals("unresolved").count(),
  ]);
  useSyncStatusStore.getState().setStatus({
    pendingCount: pending,
    failedCount: failed,
    conflictCount: conflicts,
    state: !navigator.onLine
      ? "offline"
      : conflicts
        ? "conflict"
        : failed
          ? "failed"
          : pending
            ? "pending"
            : "synced",
  });
}
export async function pushQueue() {
  if (!navigator.onLine || !supabase) return;
  const config = await babyNestDb.syncState.get("cloud");
  if (!config?.enabled) return;

  // Recover interrupted sync operations.
  await babyNestDb.syncQueue
    .where("status")
    .equals("syncing")
    .modify({
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

  const operations = await babyNestDb.syncQueue
    .where("status")
    .anyOf("pending", "failed")
    .filter(
      (item) =>
        !item.nextAttemptAt || item.nextAttemptAt <= new Date().toISOString(),
    )
    .sortBy("createdAt");
  const client = requireSupabase();
  const { data: cloudBabies } = await client
    .from("babies")
    .select("id,name,birthday")
    .eq("family_id", config.familyId)
    .is("deleted_at", null);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const locked = new Set<string>();
  useSyncStatusStore.getState().setStatus({ state: "syncing" });
  for (const operation of operations) {
    const lock = `${operation.entityType}:${operation.entityId}`;
    if (locked.has(lock)) continue;
    locked.add(lock);
    await babyNestDb.syncQueue.update(operation.id, {
      status: "syncing",
      updatedAt: new Date().toISOString(),
    });
    try {
      const table = tables[operation.entityType as QueueEntity];
      const map = JSON.parse(
        localStorage.getItem("babynest-cloud-migration-map") || "{}",
      ) as Record<string, string>;
      const value = operation.payload as Record<string, unknown>;
      const matchingBaby = cloudBabies?.find(
        (baby) =>
          baby.name === value.name &&
          String(baby.birthday) === String(value.birthday),
      );
      const resolvedBaby =
        operation.entityType === "baby"
          ? matchingBaby
          : cloudBabies?.length === 1
            ? cloudBabies[0]
            : undefined;
      const remoteId =
        map[operation.entityId] ??
        (operation.entityType === "baby" && resolvedBaby
          ? resolvedBaby.id
          : operation.entityId);
      const payloadBabyId = String(value.babyId ?? "");
      const remoteBabyId =
        map[payloadBabyId] ??
        (uuidPattern.test(payloadBabyId) ? payloadBabyId : resolvedBaby?.id);
      let query;
      if (operation.operation === "delete")
        query = client
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", remoteId);
      else
        query = client
          .from(table)
          .upsert(
            rowPayload(
              operation,
              config.familyId,
              remoteId,
              remoteBabyId,
            ) as never,
            { onConflict: "id" },
          );
      if (operation.baseVersion !== undefined)
        query = query.eq("version", operation.baseVersion);
      const { error } = await query;
      if (error) throw error;
      await babyNestDb.syncQueue.delete(operation.id);
    } catch (error) {
      await markQueueFailure(operation, normalizeSyncError(error));
    }
  }
  const completed = new Date().toISOString();
  await babyNestDb.syncState.put({
    ...config,
    id: "cloud",
    lastSuccessfulSyncAt: completed,
    lastError: undefined,
  });
  useSyncStatusStore.getState().setStatus({ lastSuccessfulSync: completed });

  await refreshSyncCounts();
}
function localTable(entity: QueueEntity) {
  return entity === "family"
    ? babyNestDb.families
    : entity === "familyMember"
      ? babyNestDb.familyMembers
      : entity === "baby"
        ? babyNestDb.babies
        : babyNestDb.activities;
}
function localId(remoteId: unknown) {
  const map = JSON.parse(
    localStorage.getItem("babynest-cloud-migration-map") || "{}",
  ) as Record<string, string>;
  return (
    Object.entries(map).find(([, value]) => value === String(remoteId))?.[0] ??
    String(remoteId)
  );
}
function domainValue(entity: QueueEntity, row: Record<string, unknown>) {
  if (entity === "baby") {
    const data = (row.data ?? {}) as Partial<Baby>;
    return {
      id: localId(row.id),
      familyId: String(row.family_id),
      name: String(row.name),
      birthday: String(row.birthday),
      gender: String(row.gender ?? "unspecified") as Baby["gender"],
      gestationalWeek: row.gestational_week
        ? Number(row.gestational_week)
        : undefined,
      birthWeightKg: data.birthWeightKg,
      birthHeightCm: data.birthHeightCm,
      notes: data.notes,
      routinePreferences: data.routinePreferences,
      vaccinationProfile: data.vaccinationProfile,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    } satisfies Baby;
  }
  if (entity === "activity")
    return {
      id: localId(row.id),
      familyId: String(row.family_id),
      babyId: localId(row.baby_id),
      type: String(row.type),
      startedAt: String(row.started_at),
      endedAt: row.ended_at ? String(row.ended_at) : undefined,
      data: row.data ?? {},
      note: row.note ? String(row.note) : undefined,
      createdBy: row.created_by ? String(row.created_by) : undefined,
      updatedBy: row.updated_by ? String(row.updated_by) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    } as Activity;
  return row;
}
function updateReactiveUi(
  entity: QueueEntity,
  value: unknown,
  deleted: boolean,
) {
  if (entity === "baby") {
    const baby = value as Baby;
    useBabyStore.setState((state) => {
      const babies = deleted
        ? state.babies.filter((item) => item.id !== baby.id)
        : state.babies.some((item) => item.id === baby.id)
          ? state.babies.map((item) => (item.id === baby.id ? baby : item))
          : [...state.babies, baby];
      return {
        babies,
        selectedBabyId: babies.some((item) => item.id === state.selectedBabyId)
          ? state.selectedBabyId
          : (babies[0]?.id ?? null),
      };
    });
  }
  if (entity === "activity") {
    const activity = value as Activity;
    if (!deleted && !activity.endedAt && activity.type === "sleep") {
      const timerData = activity.data as typeof activity.data & {
        pausedAt?: string | null;
        totalPausedMilliseconds?: number;
      };
      useActivityStore.setState((state) => ({
        activities: state.activities.filter((item) => item.id !== activity.id),
        activeActivity: {
          id: activity.id,
          babyId: activity.babyId,
          type: "sleep",
          startedAt: activity.startedAt,
          pausedAt: timerData.pausedAt ?? null,
          totalPausedMilliseconds: timerData.totalPausedMilliseconds ?? 0,
        },
      }));
      return;
    }
    if (!deleted && !activity.endedAt && activity.type === "breastfeeding") {
      const timerState = (
        activity.data as typeof activity.data & {
          timerState?: BreastfeedingSession;
        }
      ).timerState;
      if (timerState)
        useBreastfeedingTimerStore.setState({ activeSession: timerState });
      useActivityStore.setState((state) => ({
        activities: state.activities.filter((item) => item.id !== activity.id),
      }));
      return;
    }
    useActivityStore.setState((state) => ({
      activities: deleted
        ? state.activities.filter((item) => item.id !== activity.id)
        : state.activities.some((item) => item.id === activity.id)
          ? state.activities.map((item) =>
              item.id === activity.id ? activity : item,
            )
          : [...state.activities, activity],
    }));
    if (
      activity.type === "sleep" &&
      useActivityStore.getState().activeActivity?.id === activity.id
    )
      useActivityStore.setState({ activeActivity: null });
    if (
      activity.type === "breastfeeding" &&
      useBreastfeedingTimerStore.getState().activeSession?.id === activity.id
    )
      useBreastfeedingTimerStore.setState({ activeSession: null });
  }
}
export async function applyRemoteRow(
  entity: QueueEntity,
  row: Record<string, unknown>,
) {
  const table = localTable(entity) as typeof babyNestDb.families;
  const identity = localId(row.id);
  const existing = (await table.get(identity)) as
    | LocalEntity<unknown>
    | undefined;
  if (existing?.meta.syncStatus === "pending") {
    if (
      existing.meta.serverVersion !== undefined &&
      existing.meta.serverVersion !== row.version
    ) {
      await babyNestDb.conflicts.put({
        id: crypto.randomUUID(),
        entityType: entity,
        entityId: identity,
        localVersion: existing,
        remoteVersion: row,
        detectedAt: new Date().toISOString(),
        status: "unresolved",
      });
      await refreshSyncCounts();
    }
    return;
  }
  const deletedAt = row.deleted_at ? String(row.deleted_at) : undefined;
  const value = domainValue(entity, row);
  await table.put({
    id: identity,
    value,
    meta: {
      syncStatus: "synced",
      serverVersion: Number(row.version ?? 1),
      lastSyncedAt: new Date().toISOString(),
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
      deletedAt,
      familyId: String(row.family_id ?? row.id),
    },
  } as never);
  updateReactiveUi(entity, value, Boolean(deletedAt));
}
export async function pullChanges(familyId: string) {
  const client = requireSupabase();
  for (const entity of [
    "family",
    "familyMember",
    "baby",
    "activity",
  ] as QueueEntity[]) {
    const stateId = `pull:${familyId}:${entity}`;
    const state = await babyNestDb.syncState.get(stateId);
    let page = 0;
    let latest = state?.cursor;
    while (true) {
      let query = client
        .from(tables[entity])
        .select("*")
        .order("updated_at", { ascending: true })
        .range(page * 500, page * 500 + 499);
      if (entity === "family") query = query.eq("id", familyId);
      else query = query.eq("family_id", familyId);
      if (state?.cursor) query = query.gt("updated_at", state.cursor);
      const { data, error } = await query;
      if (error) throw error;
      for (const row of data ?? []) {
        await applyRemoteRow(entity, row);
        latest = String(row.updated_at);
      }
      if ((data?.length ?? 0) < 500) break;
      page++;
    }
    await babyNestDb.syncState.put({
      id: stateId,
      cursor: latest,
      lastSuccessfulSyncAt: new Date().toISOString(),
    });
  }
}
let channels: RealtimeChannel[] = [];
export async function subscribeRealtime(familyId: string) {
  unsubscribeRealtime();
  if (!supabase) return;
  for (const entity of ["familyMember", "baby", "activity"] as QueueEntity[]) {
    const channel = supabase
      .channel(`babynest:${familyId}:${entity}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tables[entity],
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const row = (
            payload.new && Object.keys(payload.new).length
              ? payload.new
              : payload.old
          ) as Record<string, unknown>;
          void applyRemoteRow(entity, row);
        },
      )
      .subscribe();
    channels.push(channel);
  }
}
export function unsubscribeRealtime() {
  for (const channel of channels) void supabase?.removeChannel(channel);
  channels = [];
}
