import type { ReactNode } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Header />
          {children}
        </div>
      </div>
    </div>
  );
}