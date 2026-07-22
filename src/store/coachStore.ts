import { create } from "zustand";
import { persist } from "zustand/middleware";
interface CoachDecision { fingerprint: string; dismissedAt?: string; snoozedUntil?: string }
interface CoachStore { decisions: CoachDecision[]; dismiss: (fingerprint: string) => void; snooze: (fingerprint: string, hours?: number) => void }
export const useCoachStore = create<CoachStore>()(persist((set) => ({ decisions: [], dismiss: (fingerprint) => set((state) => ({ decisions: [...state.decisions.filter((item) => item.fingerprint !== fingerprint), { fingerprint, dismissedAt: new Date().toISOString() }] })), snooze: (fingerprint, hours = 24) => set((state) => ({ decisions: [...state.decisions.filter((item) => item.fingerprint !== fingerprint), { fingerprint, snoozedUntil: new Date(Date.now() + hours * 3_600_000).toISOString() }] })) }), { name: "babynest-coach", version: 1 }));
