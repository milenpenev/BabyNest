import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BabyMilestoneRecord } from "../features/milestones/model/milestone.types";
import { MILESTONE_CATALOG_VERSION } from "../features/milestones/data/catalog";
import { hasFamilyPermission } from "../features/family/permissions/familyPermissions";
import { getCurrentFamilyMember, useFamilyStore } from "./familyStore";

function canManage() { return hasFamilyPermission(getCurrentFamilyMember(), "canManageMilestones"); }
function auditMilestone(record: BabyMilestoneRecord, action: "created" | "updated" | "deleted") { const member = getCurrentFamilyMember(); if (!member) return; useFamilyStore.getState().addAudit({ memberId: member.id, action, entityType: "milestone", entityId: record.id, descriptionKey: `family.audit.milestone.${action}` }); }

interface MilestoneStore {
  catalogVersion: string;
  records: BabyMilestoneRecord[];
  upsertRecord: (record: BabyMilestoneRecord) => void;
  removeRecord: (id: string) => void;
  replaceRecords: (records: BabyMilestoneRecord[], catalogVersion?: string) => void;
  clearForBaby: (babyId: string) => void;
}

function sameRecordIdentity(first: BabyMilestoneRecord, second: BabyMilestoneRecord) {
  if (first.babyId !== second.babyId) return false;
  if (first.source === "catalog" && second.source === "catalog") return Boolean(first.milestoneId && first.milestoneId === second.milestoneId);
  return first.id === second.id;
}

function deduplicate(records: BabyMilestoneRecord[]) {
  const result: BabyMilestoneRecord[] = [];
  for (const record of records) {
    const existingIndex = result.findIndex((item) => sameRecordIdentity(item, record));
    if (existingIndex === -1) result.push(record);
    else if (new Date(record.updatedAt).getTime() >= new Date(result[existingIndex].updatedAt).getTime()) result[existingIndex] = record;
  }
  return result;
}

export const useMilestoneStore = create<MilestoneStore>()(
  persist(
    (set, get) => ({
      catalogVersion: MILESTONE_CATALOG_VERSION,
      records: [],
      upsertRecord: (record) => { if (!canManage()) return; const exists = get().records.some((item) => sameRecordIdentity(item, record)); set((state) => ({ records: [...state.records.filter((item) => !sameRecordIdentity(item, record)), { ...record, updatedAt: new Date().toISOString() }] })); auditMilestone(record, exists ? "updated" : "created"); },
      removeRecord: (id) => { if (!canManage()) return; const target = get().records.find((item) => item.id === id); set((state) => {
        const target = state.records.find((item) => item.id === id);
        return { records: target ? state.records.filter((item) => !sameRecordIdentity(item, target)) : state.records };
      }); if (target) auditMilestone(target, "deleted"); },
      replaceRecords: (records, catalogVersion = MILESTONE_CATALOG_VERSION) => set({ records: deduplicate(records), catalogVersion }),
      clearForBaby: (babyId) => set((state) => ({ records: state.records.filter((item) => item.babyId !== babyId) })),
    }),
    {
      name: "babynest-milestones",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<MilestoneStore> | undefined;
        return { ...state, catalogVersion: state?.catalogVersion ?? MILESTONE_CATALOG_VERSION, records: deduplicate(state?.records ?? []) };
      },
    },
  ),
);
