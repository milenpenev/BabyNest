import { create } from "zustand";
import { persist } from "zustand/middleware";
export interface CurrentUser { id: string; displayName: string; email?: string; authProvider: "local" | "firebase" | "supabase" | "appwrite"; }
interface CurrentUserStore { currentUser: CurrentUser; setCurrentUser: (user: CurrentUser) => void; }
export const LOCAL_USER_ID = "local-owner";
export const useCurrentUserStore = create<CurrentUserStore>()(persist((set) => ({ currentUser: { id: LOCAL_USER_ID, displayName: "Parent", authProvider: "local" }, setCurrentUser: (currentUser) => set({ currentUser }) }), { name: "babynest-current-user", version: 1 }));
