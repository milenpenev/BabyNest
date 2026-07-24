import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/supabaseClient";

export default function NativeAuthLinkRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !supabase) return;
    const client = supabase;
    const listener = App.addListener("appUrlOpen", ({ url }) => {
      void (async () => {
        const parsed = new URL(url);
        const params = new URLSearchParams(parsed.hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
        const target = parsed.pathname.includes("reset-password")
          ? "/auth/reset-password"
          : "/auth/callback";
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
      })();
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);
  return null;
}
