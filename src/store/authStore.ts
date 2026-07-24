import { create } from "zustand";

import { syncLocalProfileName } from "../features/profile/utils/syncLocalProfileName";
import type {
  Session,
  User,
} from "@supabase/supabase-js";

interface AuthStore {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  errorCode?: string;

  setSession: (
    session: Session | null,
  ) => void;

  setLoading: (
    loading: boolean,
  ) => void;

  setError: (
    errorCode?: string,
  ) => void;

  updateUser: (
    user: User,
  ) => void;
}

export const useAuthStore =
  create<AuthStore>((set) => ({
    session: null,
    user: null,
    loading: true,
    initialized: false,

    setSession: (session) => {
      const user = session?.user ?? null;

      if (user) {
        const displayName =
          getUserDisplayName(user);

        if (displayName) {
          syncLocalProfileName(
            user.id,
            displayName,
          );
        }
      }

      set({
        session,
        user,
        loading: false,
        initialized: true,
        errorCode: undefined,
      });
    },

    setLoading: (loading) =>
      set({ loading }),

    setError: (errorCode) =>
      set({
        errorCode,
        loading: false,
      }),

    updateUser: (user) => {
      const displayName =
        getUserDisplayName(user);

      if (displayName) {
        syncLocalProfileName(
          user.id,
          displayName,
        );
      }

      set((state) => ({
        user,
        session: state.session
          ? {
              ...state.session,
              user,
            }
          : null,
      }));
    },
  }));

export function getUserDisplayName(
  user: User | null,
) {
  if (!user) return "";

  const metadata =
    user.user_metadata as
      | Record<string, unknown>
      | undefined;

  const displayName =
    metadata?.display_name ??
    metadata?.full_name ??
    metadata?.name;

  if (
    typeof displayName === "string" &&
    displayName.trim()
  ) {
    return displayName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "";
}

export function getUserInitials(
  user: User | null,
) {
  const displayName =
    getUserDisplayName(user);

  if (!displayName) {
    return "?";
  }

  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[
    parts.length - 1
  ][0]}`.toUpperCase();
}
