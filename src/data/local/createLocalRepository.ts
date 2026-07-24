import { liveQuery, type Table } from "dexie";
import type {
  LocalEntity,
  SyncEntityType,
} from "../../lib/local-db/localDb.types";
import { enqueueSync } from "../sync/syncQueue";
const requestBackgroundSync = () =>
  window.dispatchEvent(new Event("babynest:sync-request"));
export function createLocalRepository<T extends { id: string }>(
  table: Table<LocalEntity<T>, string>,
  entityType: Exclude<SyncEntityType, "profile">,
  getFamilyId: (value: T) => string | undefined,
) {
  return {
    async list(familyId?: string) {
      const rows = await table.toArray();
      return rows
        .filter(
          (row) =>
            !row.meta.deletedAt &&
            (!familyId || row.meta.familyId === familyId),
        )
        .map((row) => row.value);
    },
    async getById(id: string) {
      const row = await table.get(id);
      return row && !row.meta.deletedAt ? row.value : undefined;
    },
    async create(value: T) {
      const now = new Date().toISOString();
      const existing = await table.get(value.id);
      await table.put({
        id: value.id,
        value,
        meta: {
          ...existing?.meta,
          syncStatus: "pending",
          familyId: getFamilyId(value),
          updatedAt: now,
        },
      });
      await enqueueSync({
        entityType,
        entityId: value.id,
        operation: existing?.meta.serverVersion ? "update" : "create",
        payload: value,
        baseVersion: existing?.meta.serverVersion,
      });
      requestBackgroundSync();
    },
    async update(id: string, updates: Partial<T>, baseVersion?: number) {
      const current = await table.get(id);
      if (!current) throw new Error("LOCAL_NOT_FOUND");
      const value = { ...current.value, ...updates };
      const now = new Date().toISOString();
      await table.put({
        ...current,
        value,
        meta: { ...current.meta, syncStatus: "pending", updatedAt: now },
      });
      await enqueueSync({
        entityType,
        entityId: id,
        operation: "update",
        payload: updates,
        baseVersion,
      });
      requestBackgroundSync();
    },
    async softDelete(id: string, baseVersion?: number) {
      const current = await table.get(id);
      const now = new Date().toISOString();
      if (current)
        await table.put({
          ...current,
          meta: {
            ...current.meta,
            deletedAt: now,
            syncStatus: "pending",
            updatedAt: now,
          },
        });
      await enqueueSync({
        entityType,
        entityId: id,
        operation: "delete",
        payload: { id, deletedAt: now },
        baseVersion,
      });
      requestBackgroundSync();
    },
    observe(familyId?: string) {
      return liveQuery(async () => {
        const rows = await table.toArray();
        return rows
          .filter(
            (row) =>
              !row.meta.deletedAt &&
              (!familyId || row.meta.familyId === familyId),
          )
          .map((row) => row.value);
      });
    },
  };
}
