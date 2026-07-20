import { Milk, Moon, NotebookTabs } from "lucide-react";

const summaryCards = [
  {
    label: "Сън днес",
    value: "11ч 42м",
    icon: Moon,
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    label: "Хранения",
    value: "7",
    icon: Milk,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Пелени",
    value: "5",
    icon: NotebookTabs,
    accent: "bg-amber-100 text-amber-700",
  },
];

export default function SummaryCards() {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaryCards.map(({ label, value, icon: Icon, accent }) => (
        <article
          key={label}
          className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}