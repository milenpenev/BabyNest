import { babyNestDb } from "../src/lib/local-db/babyNestDb";

const queue = await babyNestDb.syncQueue.toArray();

console.table(
  queue.map(item => ({
    id: item.id,
    entity: item.entityType,
    operation: item.operation,
    status: item.status,
    attempts: item.attempts,
    nextAttemptAt: item.nextAttemptAt,
  }))
);

process.exit(0);
