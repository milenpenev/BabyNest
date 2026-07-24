import { Cloud, KeyRound, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isCloudConfigured } from "../../../lib/supabase/supabaseClient";
import { authService } from "../services/authService";
export type AuthMode = "login" | "register" | "forgot" | "reset";
export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!isCloudConfigured) throw new Error("CLOUD_NOT_CONFIGURED");
      if (mode === "login") {
        const { error } = await authService.login(email, password);
        if (error) throw error;
        navigate(
          new URLSearchParams(location.search).get("next") || "/settings",
        );
      } else if (mode === "register") {
        const { error } = await authService.register(email, password, name);
        if (error) throw error;
        setMessage(t("auth.verifyEmail"));
      } else if (mode === "forgot") {
        const { error } = await authService.forgotPassword(email);
        if (error) throw error;
        setMessage(t("auth.resetSent"));
      } else {
        const { error } = await authService.resetPassword(password);
        if (error) throw error;
        setMessage(t("auth.passwordUpdated"));
      }
    } catch (error) {
      setError(
        error instanceof Error && error.message === "CLOUD_NOT_CONFIGURED"
          ? t("auth.notConfigured")
          : t("auth.genericError"),
      );
    } finally {
      setBusy(false);
    }
  }
  async function magic() {
    setBusy(true);
    setError("");
    try {
      const { error } = await authService.magicLink(email);
      if (error) throw error;
      setMessage(t("auth.magicSent"));
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Cloud className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
          {t(`auth.${mode}.title`)}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t(`auth.${mode}.description`)}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" ? (
            <label className="block text-sm font-semibold">
              {t("auth.name")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-11 w-full rounded-xl border px-3 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          ) : null}
          {mode !== "reset" ? (
            <label className="block text-sm font-semibold">
              {t("auth.email")}
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border pl-10 pr-3 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </label>
          ) : null}
          {!["forgot"].includes(mode) ? (
            <label className="block text-sm font-semibold">
              {t(mode === "reset" ? "auth.newPassword" : "auth.password")}
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border pl-10 pr-3 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </label>
          ) : null}
          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t(`auth.${mode}.submit`)
            )}
          </button>
          {mode === "login" ? (
            <button
              type="button"
              disabled={busy || !email}
              onClick={() => void magic()}
              className="h-11 w-full rounded-xl border border-indigo-200 font-semibold text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
            >
              {t("auth.magicLink")}
            </button>
          ) : null}
        </form>
        {message ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
          <Link
            to={mode === "login" ? "/auth/register" : "/auth/login"}
            className="font-semibold text-indigo-600"
          >
            {t(mode === "login" ? "auth.registerLink" : "auth.loginLink")}
          </Link>
          {mode === "login" ? (
            <Link to="/auth/forgot-password" className="text-slate-500">
              {t("auth.forgotLink")}
            </Link>
          ) : null}
        </div>
        {!isCloudConfigured ? (
          <Link to="/" className="mt-5 block text-center text-xs text-slate-400">
            {t("auth.continueOffline")}
          </Link>
        ) : null}
      </section>
    </main>
  );
}
