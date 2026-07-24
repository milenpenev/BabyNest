import { requireSupabase } from "../../../lib/supabase/supabaseClient";

export interface UserProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export const profileService = {
  async getCurrentProfile() {
    const supabase = requireSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return {
        data: null,
        error: userError,
      };
    }

    if (!user) {
      return {
        data: null,
        error: new Error("No authenticated user"),
      };
    }

    return supabase
      .from("profiles")
      .select(
        "id,email,display_name,avatar_url,created_at,updated_at",
      )
      .eq("id", user.id)
      .single<UserProfileRow>();
  },

  async updateCurrentProfile(input: {
    displayName: string;
    avatarUrl?: string | null;
  }) {
    const supabase = requireSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return {
        data: null,
        error: userError,
      };
    }

    if (!user) {
      return {
        data: null,
        error: new Error("No authenticated user"),
      };
    }

    const displayName = input.displayName.trim();

    const profileResult = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url:
          input.avatarUrl === undefined
            ? undefined
            : input.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select(
        "id,email,display_name,avatar_url,created_at,updated_at",
      )
      .single<UserProfileRow>();

    if (profileResult.error) {
      return profileResult;
    }

    const authResult =
      await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          avatar_url:
            input.avatarUrl ??
            user.user_metadata?.avatar_url ??
            null,
        },
      });

    if (authResult.error) {
      return {
        data: profileResult.data,
        error: authResult.error,
      };
    }

    return {
      data: profileResult.data,
      authUser: authResult.data.user,
      error: null,
    };
  },
};
