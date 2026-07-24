import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [backupPath, email, familyId, babyId] = process.argv.slice(2);

if (!backupPath || !email || !familyId || !babyId) {
  throw new Error(
    "Usage: node scripts/import-cloud-backup.mjs <backup> <email> <family-id> <baby-id>",
  );
}

const backup = JSON.parse(readFileSync(backupPath, "utf8"));
if (!Array.isArray(backup.activities)) throw new Error("INVALID_BACKUP");

const activities = backup.activities.map((activity) => ({
  id: activity.id,
  type: activity.type,
  started_at: activity.startedAt,
  ended_at: activity.endedAt ?? null,
  data: activity.data ?? {},
  note: activity.note ?? null,
  created_at: activity.createdAt ?? activity.startedAt,
  updated_at: activity.updatedAt ?? activity.createdAt ?? activity.startedAt,
}));

const encoded = Buffer.from(JSON.stringify(activities), "utf8").toString("base64");
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sql = `
begin;
with actor as (
  select id from public.profiles where email = ${quote(email)} limit 1
), payload as (
  select jsonb_array_elements(convert_from(decode(${quote(encoded)}, 'base64'), 'utf8')::jsonb) as item
)
insert into public.activities (
  id, family_id, baby_id, type, started_at, ended_at, data, note,
  created_at, updated_at, created_by, updated_by, client_id
)
select
  (item->>'id')::uuid,
  ${quote(familyId)}::uuid,
  ${quote(babyId)}::uuid,
  item->>'type',
  (item->>'started_at')::timestamptz,
  nullif(item->>'ended_at', '')::timestamptz,
  coalesce(item->'data', '{}'::jsonb),
  item->>'note',
  (item->>'created_at')::timestamptz,
  (item->>'updated_at')::timestamptz,
  actor.id,
  actor.id,
  'backup-import-2026-07-22'
from payload cross join actor
on conflict (id) do update set
  family_id = excluded.family_id,
  baby_id = excluded.baby_id,
  type = excluded.type,
  started_at = excluded.started_at,
  ended_at = excluded.ended_at,
  data = excluded.data,
  note = excluded.note,
  updated_by = excluded.updated_by,
  client_id = excluded.client_id;
commit;
`;

const result = spawnSync(
  "npx",
  ["supabase", "db", "query", "--linked", sql],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(result.status ?? 1);
