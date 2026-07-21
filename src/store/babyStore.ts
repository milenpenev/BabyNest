import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Baby } from "../entities/baby/model/baby.types";

interface BabyStore {
  babies: Baby[];
  selectedBabyId: string | null;

  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, updates: Partial<Baby>) => void;
  removeBaby: (id: string) => void;
  selectBaby: (id: string) => void;
}

const defaultBaby: Baby = {
  id: "filip",
  name: "Филип",
  birthday: "2026-04-01",
  gender: "boy",
  gestationalWeek: 36,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useBabyStore = create<BabyStore>()(
  persist(
    (set) => ({
      babies: [defaultBaby],
      selectedBabyId: defaultBaby.id,

      addBaby: (baby) =>
        set((state) => ({
          babies: [...state.babies, baby],
          selectedBabyId: state.selectedBabyId ?? baby.id,
        })),

      updateBaby: (id, updates) =>
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
        })),

      removeBaby: (id) =>
        set((state) => {
          const babies = state.babies.filter((baby) => baby.id !== id);

          return {
            babies,
            selectedBabyId:
              state.selectedBabyId === id
                ? (babies[0]?.id ?? null)
                : state.selectedBabyId,
          };
        }),

      selectBaby: (id) =>
        set((state) => ({
          selectedBabyId: state.babies.some((baby) => baby.id === id)
            ? id
            : state.selectedBabyId,
        })),
    }),
    {
      name: "babynest-babies",
    },
  ),
);