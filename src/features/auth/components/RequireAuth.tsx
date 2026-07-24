import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { isCloudConfigured } from "../../../lib/supabase/supabaseClient";
import { useAuthStore } from "../../../store/authStore";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);

  if (!isCloudConfigured) return children;
  if (!initialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">{t("auth.callback")}</p>
        </div>
      </main>
    );
  }
  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate to={`/auth/login?next=${encodeURIComponent(next)}`} replace />
    );
  }
  return children;
}
