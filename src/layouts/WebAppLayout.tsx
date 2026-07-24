import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import SharedAppRuntimes from "./SharedAppRuntimes";

export default function WebAppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SharedAppRuntimes />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
