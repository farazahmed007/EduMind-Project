import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";

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
        console.error(
          "Backend connection failed:",
          error
        );

        setBackendStatus("disconnected");
      }
    };

    checkConnection();
  }, []);


  return (
    <div className="min-h-full bg-[#f4f7f6]">

      {/* ================================================= */}
      {/* Dashboard Workspace */}
      {/* ================================================= */}

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8 lg:pt-6 xl:px-10">

        {/* ================================================= */}
        {/* Backend Status */}
        {/* ================================================= */}

        <div className="mb-4 flex justify-end">

          {backendStatus === "checking" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e1ebe6] bg-white px-3 py-1.5 shadow-sm">

              <Loader2
                size={12}
                className="animate-spin text-[#2fa084]"
              />

              <span className="text-[10px] font-semibold text-[#7f8e88]">
                Connecting to EduMind
              </span>

            </div>
          )}


          {backendStatus === "connected" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7ebe2] bg-[#f4faf7] px-3 py-1.5 shadow-sm">

              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e1f3ea] text-[#2fa084]">
                <CheckCircle2
                  size={10}
                  strokeWidth={2.5}
                />
              </span>

              <span className="text-[10px] font-bold text-[#3e7566]">
                All systems connected
              </span>

            </div>
          )}


          {backendStatus === "disconnected" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d8d8] bg-[#fff7f7] px-3 py-1.5 shadow-sm">

              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#fde8e8] text-[#c96363]">
                <CircleAlert
                  size={10}
                  strokeWidth={2.4}
                />
              </span>

              <span className="text-[10px] font-bold text-[#a85b5b]">
                Backend connection unavailable
              </span>

            </div>
          )}

        </div>


        {/* ================================================= */}
        {/* Welcome */}
        {/* ================================================= */}

        <DashboardSection delay={0}>
          <WelcomeSection />
        </DashboardSection>


        {/* ================================================= */}
        {/* Core Statistics */}
        {/* ================================================= */}

        <DashboardSection delay={0.06}>
          <StatsCards />
        </DashboardSection>


        {/* ================================================= */}
        {/* Quick Actions */}
        {/* ================================================= */}

        <DashboardSection delay={0.12}>
          <QuickActions />
        </DashboardSection>


        {/* ================================================= */}
        {/* Learning Intelligence */}
        {/* ================================================= */}

        <DashboardSection delay={0.18}>
          <LearningOverview />
        </DashboardSection>


        {/* ================================================= */}
        {/* Recent Activity + Today's Plan */}
        {/* ================================================= */}

        <DashboardSection delay={0.24}>

          <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">

            <div className="min-w-0 xl:col-span-2">
              <RecentMaterials />
            </div>

            <div className="min-w-0">
              <TodaysTasks />
            </div>

          </section>

        </DashboardSection>


        {/* ================================================= */}
        {/* Footer breathing space */}
        {/* ================================================= */}

        <div className="h-2 sm:h-4" />

      </div>

    </div>
  );
}


export default Dashboard;