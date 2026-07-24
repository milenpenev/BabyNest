import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Baby } from "../entities/baby/model/baby.types";
import { getCurrentFamilyMember, useFamilyStore } from "./familyStore";
import { hasFamilyPermission } from "../features/family/permissions/familyPermissions";
import { localBabyRepository } from "../data/local/repositories";
function auditBaby(baby: Baby, action: "created" | "updated" | "deleted") {
  const member = getCurrentFamilyMember();
  if (member)
    useFamilyStore
      .getState()
      .addAudit({
        memberId: member.id,
        action,
        entityType: "baby",
        entityId: baby.id,
        descriptionKey: `family.audit.baby.${action}`,
        metadata: { name: baby.name },
      });
}

interface BabyStore {
  babies: Baby[];
  selectedBabyId: string | null;

  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, updates: Partial<Baby>) => void;
  removeBaby: (id: string) => void;
  selectBaby: (id: string) => void;
  replaceBabies: (babies: Baby[], selectedBabyId?: string | null) => void;
  reset: () => void;
}

export const useBabyStore = create<BabyStore>()(
  persist(
    (set, get) => ({
      babies: [],
      selectedBabyId: null,

      addBaby: (baby) => {
        if (!hasFamilyPermission(getCurrentFamilyMember(), "canManageBaby"))
          return;
        const nextBaby = {
          ...baby,
          familyId: baby.familyId ?? useFamilyStore.getState().family.id,
        };
        void localBabyRepository.create(nextBaby);
        set((state) => ({
          babies: [...state.babies, nextBaby],
          selectedBabyId: state.selectedBabyId ?? baby.id,
        }));
        auditBaby(nextBaby, "created");
      },

      updateBaby: (id, updates) => {
        const existing = get().babies.find((baby) => baby.id === id);
        if (
          !existing ||
          !hasFamilyPermission(getCurrentFamilyMember(), "canManageBaby")
        )
          return;
        void localBabyRepository.create({
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        set((state) => ({
          babies: state.babies.map((baby) =>
            baby.id === id
              ? {
                  ...baby,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : baby,
          ),
        }));
        auditBaby({ ...existing, ...updates }, "updated");
      },

      removeBaby: (id) => {
        const existing = get().babies.find((baby) => baby.id === id);
        if (
          !existing ||
          !hasFamilyPermission(getCurrentFamilyMember(), "canManageBaby")
        )
          return;
        void localBabyRepository.softDelete(id);
        set((state) => {
          const babies = state.babies.filter((baby) => baby.id !== id);

          return {
            babies,
            selectedBabyId:
              state.selectedBabyId === id
                ? (babies[0]?.id ?? null)
                : state.selectedBabyId,
          };
        });
        auditBaby(existing, "deleted");
      },

      selectBaby: (id) =>
        set((state) => ({
          selectedBabyId: state.babies.some((baby) => baby.id === id)
            ? id
            : state.selectedBabyId,
        })),
      replaceBabies: (babies, selectedBabyId) =>
        set({
          babies,
          selectedBabyId: babies.some((baby) => baby.id === selectedBabyId)
            ? (selectedBabyId ?? null)
            : (babies[0]?.id ?? null),
        }),
      reset: () => set({ babies: [], selectedBabyId: null }),
    }),
    {
      name: "babynest-babies",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as Partial<BabyStore> | undefined;
        const selectedAt = new Date().toISOString();
        return {
          ...state,
          babies: (state?.babies ?? []).map((baby) => ({
            ...baby,
            familyId: baby.familyId ?? "local-family",
            vaccinationProfile: baby.vaccinationProfile ?? {
              countryCode: "BG",
              scheduleVersion: "BG-2026.1",
              selectedAt,
              source: "migration",
            },
          })),
        };
      },
    },
  ),
);
