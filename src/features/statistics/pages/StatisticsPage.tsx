import PremiumGate from "../../../components/premium/PremiumGate";
import StatisticsContent from "../components/StatisticsContent";

export default function StatisticsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <PremiumGate
          preview={<StatisticsContent />}
        >
          <StatisticsContent />
        </PremiumGate>
      </div>
    </main>
  );
}
