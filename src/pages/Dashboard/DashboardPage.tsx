import DashboardHero from "../../components/dashboard/DashboardHero";
import SummaryCards from "../../components/dashboard/SummaryCards";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHero />

        <SummaryCards />
      </div>
    </main>
  );
}