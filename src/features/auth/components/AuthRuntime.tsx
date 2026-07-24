import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase/supabaseClient";
import { useAuthStore } from "../../../store/authStore";
import { useBabyStore } from "../../../store/babyStore";
import { useActivityStore } from "../../../store/activityStore";

const ACCOUNT_SCOPE_KEY = "babynest-account-scope";

async function applySession(session: Session | null) {
  useAuthStore.getState().setSession(session);
  if (!session || !supabase) return;
  const previousAccount = localStorage.getItem(ACCOUNT_SCOPE_KEY);
  if (previousAccount && previousAccount !== session.user.id) {
    useBabyStore.setState({ babies: [], selectedBabyId: null });
    useActivityStore.setState({ activities: [], activeActivity: null });
  }
  localStorage.setItem(ACCOUNT_SCOPE_KEY, session.user.id);
  const { error } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", session.user.id)
    .single();
  if (!error) {
  }
}

export default function AuthRuntime() {
  useEffect(() => {
    if (!supabase) {
      useAuthStore.getState().setSession(null);
      return;
    }
    void supabase.auth
      .getSession()
      .then(({ data, error }) =>
        error
          ? useAuthStore.getState().setError("unavailable")
          : void applySession(data.session),
      );
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
