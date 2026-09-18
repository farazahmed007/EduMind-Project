import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";


export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6]">

      {/* ============================================== */}
      {/* Application Sidebar */}
      {/* ============================================== */}

      <Sidebar />


      {/* ============================================== */}
      {/* Main Application Area */}
      {/* ============================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top Navigation */}

        <TopNavbar />


        {/* Page Workspace */}

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7f6]">

          <div className="min-h-full">

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
}