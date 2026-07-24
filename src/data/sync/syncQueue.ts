import { babyNestDb } from "../../lib/local-db/babyNestDb";
import type { SyncOperation } from "../../lib/local-db/localDb.types";
const RETRY_LIMIT = 6;
export const retryDelay = (attempts: number) =>
  Math.min(300_000, 1000 * 2 ** Math.max(0, attempts));
export async function enqueueSync(
  input: Omit<
    SyncOperation,
    "id" | "createdAt" | "updatedAt" | "attempts" | "status"
  >,
) {
  const now = new Date().toISOString();
  await babyNestDb.transaction("rw", babyNestDb.syncQueue, async () => {
    const existing = await babyNestDb.syncQueue
      .where("[entityType+entityId]")
      .equals([input.entityType, input.entityId])
      .filter((item) => item.status !== "syncing")
      .first();
    if (existing) {
      if (existing.operation === "delete") return;
      const operation =
        input.operation === "delete"
          ? "delete"
          : existing.operation === "create"
            ? "create"
            : "update";
      await babyNestDb.syncQueue.put({
        ...existing,
        ...input,
        operation,
        payload:
          input.operation === "delete"
            ? input.payload
            : { ...(existing.payload as object), ...(input.payload as object) },
        updatedAt: now,
        status: "pending",
        nextAttemptAt: undefined,
        errorCode: undefined,
      });
      return;
    }
    await babyNestDb.syncQueue.add({
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      status: "pending",
    });
  });
}
export async function markQueueFailure(
  operation: SyncOperation,
  errorCode: string,
) {
  const attempts = operation.attempts + 1;
  await babyNestDb.syncQueue.update(operation.id, {
    attempts,
    status: attempts >= RETRY_LIMIT ? "blocked" : "failed",
    errorCode,
    nextAttemptAt: new Date(Date.now() + retryDelay(attempts)).toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
export async function retryFailedQueue() {
  await babyNestDb.syncQueue
    .where("status")
    .anyOf("pending", "failed", "blocked")
    .modify({
      status: "pending",
      attempts: 0,
      nextAttemptAt: undefined,
      errorCode: undefined,
      updatedAt: new Date().toISOString(),
    });
}
