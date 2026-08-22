import WelcomeSection from "../../components/dashboard/WelcomeSection";
import StatsCards from "../../components/dashboard/StatsCards";
import QuickActions from "../../components/dashboard/QuickActions";
import LearningOverview from "../../components/dashboard/LearningOverview";
import RecentMaterials from "../../components/dashboard/RecentMaterials";
import TodaysTasks from "../../components/dashboard/TodaysTasks";
import DashboardSection from "../../components/dashboard/DashboardSection";

function Dashboard() {
  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

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