import { Crown, LockKeyhole } from "lucide-react";

import { useSubscriptionStore } from "../../store/subscriptionStore";

export default function SubscriptionDevSwitcher() {
  const plan = useSubscriptionStore((state) => state.plan);

  const setPlan = useSubscriptionStore((state) => state.setPlan);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <button
        type="button"
        onClick={() => setPlan("free")}
        className={[
          "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
          plan === "free"
            ? "bg-slate-900 text-white"
            : "text-slate-500 hover:bg-slate-100",
        ].join(" ")}
      >
        <LockKeyhole className="h-4 w-4" />
        Free
      </button>

      <button
        type="button"
        onClick={() => setPlan("premium")}
        className={[
          "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
          plan === "premium"
            ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
            : "text-slate-500 hover:bg-slate-100",
        ].join(" ")}
      >
        <Crown className="h-4 w-4" />
        Premium
      </button>
    </div>
  );
}
