import type { CurrentUser } from "../../../store/currentUserStore";

/** Authentication boundary for a future Firebase, Supabase, Appwrite, Apple, Google or Microsoft implementation. */
export interface IdentityProvider {
  getCurrentUser(): Promise<CurrentUser | null>;
  signIn(provider: "apple" | "google" | "microsoft" | "email"): Promise<CurrentUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(listener: (user: CurrentUser | null) => void): () => void;
}
