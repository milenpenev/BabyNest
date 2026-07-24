import { Capacitor } from "@capacitor/core";

import { requireSupabase } from "../../../lib/supabase/supabaseClient";

const callback = (
  path = "callback",
) =>
  Capacitor.isNativePlatform()
    ? `babynest://auth/${path}`
    : `${window.location.origin}/auth/${path}`;

export const authService = {
  async register(
    email: string,
    password: string,
    displayName: string,
  ) {
    return requireSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name:
            displayName.trim(),
        },
        emailRedirectTo: callback(),
      },
    });
  },

  async login(
    email: string,
    password: string,
  ) {
    return requireSupabase().auth.signInWithPassword({
      email,
      password,
    });
  },

  async magicLink(email: string) {
    return requireSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callback(),
        shouldCreateUser: false,
      },
    });
  },

  async forgotPassword(
    email: string,
  ) {
    return requireSupabase().auth.resetPasswordForEmail(
      email,
      {
        redirectTo: callback(
          "reset-password",
        ),
      },
    );
  },

  async resetPassword(
    password: string,
  ) {
    return requireSupabase().auth.updateUser({
      password,
    });
  },

  async updateDisplayName(
    displayName: string,
  ) {
    return requireSupabase().auth.updateUser({
      data: {
        display_name:
          displayName.trim(),
      },
    });
  },

  async signOut() {
    return requireSupabase().auth.signOut({
      scope: "local",
    });
  },
};
