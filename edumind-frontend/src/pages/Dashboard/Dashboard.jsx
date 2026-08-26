import { useEffect, useState } from "react";

import WelcomeSection from "../../components/dashboard/WelcomeSection";
import StatsCards from "../../components/dashboard/StatsCards";
import QuickActions from "../../components/dashboard/QuickActions";
import LearningOverview from "../../components/dashboard/LearningOverview";
import RecentMaterials from "../../components/dashboard/RecentMaterials";
import TodaysTasks from "../../components/dashboard/TodaysTasks";
import DashboardSection from "../../components/dashboard/DashboardSection";

import { checkBackendHealth } from "../../api/api";

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus("connected");
      } catch (error) {
        console.error("Backend connection failed:", error);
        setBackendStatus("disconnected");
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

      {/* Backend Connection Status */}
      <div className="mb-4 flex items-center justify-end">
        {backendStatus === "checking" && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Checking backend...
          </span>
        )}

        {backendStatus === "connected" && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            🟢 Backend Connected
          </span>
        )}

        {backendStatus === "disconnected" && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            🔴 Backend Disconnected
          </span>
        )}
      </div>

      <DashboardSection delay={0}>
        <WelcomeSection />
      </DashboardSection>

      <DashboardSection delay={0.08}>
        <StatsCards />
      </DashboardSection>

      <DashboardSection delay={0.16}>
        <QuickActions />
      </DashboardSection>

      <DashboardSection delay={0.24}>
        <LearningOverview />
      </DashboardSection>

      <DashboardSection delay={0.32}>
        <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">

          <div className="xl:col-span-2">
            <RecentMaterials />
          </div>

          <TodaysTasks />

        </section>
      </DashboardSection>

    </div>
  );
}

export default Dashboard;