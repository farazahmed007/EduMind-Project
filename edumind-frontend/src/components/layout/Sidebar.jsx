import {
  LayoutDashboard,
  Library,
  Bot,
  ClipboardCheck,
  Layers3,
  BarChart3,
  CalendarDays,
  GraduationCap,
  Settings,
  User,
  Flame,
  Sparkles,
} from "lucide-react";

import Logo from "./Logo";
import SidebarItem from "./SidebarItem";


const mainNavigation = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/library",
    icon: Library,
    label: "Learning Library",
  },
  {
    to: "/tutor",
    icon: Bot,
    label: "AI Tutor",
  },
  {
    to: "/quiz",
    icon: ClipboardCheck,
    label: "Quiz Intelligence",
  },
  {
    to: "/flashcards",
    icon: Layers3,
    label: "Flashcards",
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Learning Analytics",
  },
  {
    to: "/planner",
    icon: CalendarDays,
    label: "Study Planner",
  },
  {
    to: "/exam",
    icon: GraduationCap,
    label: "Mock Exam",
  },
];


const bottomNavigation = [
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
  },
  {
    to: "/profile",
    icon: User,
    label: "Profile",
  },
];


export default function Sidebar() {
  return (
    <aside className="flex h-screen w-[280px] shrink-0 flex-col border-r border-[#e4ebe8] bg-white">

      {/* ============================================== */}
      {/* Brand */}
      {/* ============================================== */}

      <div className="shrink-0 px-5 pb-3 pt-5">

        <div className="rounded-2xl bg-[#f7faf9] px-2 py-1">

          <Logo />

        </div>

      </div>


      {/* ============================================== */}
      {/* Navigation */}
      {/* ============================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">

        {/* Main Navigation */}

        <div className="pt-4">

          <div className="mb-2 flex items-center gap-2 px-3">

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
              Workspace
            </span>

          </div>


          <nav className="space-y-1">

            {mainNavigation.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}

          </nav>

        </div>


        {/* Account Navigation */}

        <div className="mt-6 border-t border-[#edf1ef] pt-5">

          <div className="mb-2 flex items-center gap-2 px-3">

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
              Account
            </span>

          </div>


          <nav className="space-y-1">

            {bottomNavigation.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}

          </nav>

        </div>

      </div>


      {/* ============================================== */}
      {/* Streak / Motivation Card */}
      {/* ============================================== */}

      <div className="shrink-0 px-3 pb-4">

        <div className="relative overflow-hidden rounded-2xl border border-[#dceee6] bg-gradient-to-br from-[#f3faf7] via-[#eaf7f1] to-[#e2f3eb] p-4">

          {/* Decorative glow */}

          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#6fcf97]/15 blur-2xl" />


          <div className="relative">

            {/* Card Header */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-[#1f6f5f] shadow-sm">

                  <Flame
                    size={17}
                    strokeWidth={2.2}
                  />

                </div>


                <div>

                  <p className="text-xs font-bold text-[#1f6f5f]">
                    Study Streak
                  </p>

                  <p className="text-[10px] font-medium text-[#6f8179]">
                    Keep the momentum
                  </p>

                </div>

              </div>


              <Sparkles
                size={16}
                className="text-[#2fa084]"
              />

            </div>


            {/* Streak Number */}

            <div className="mt-4 flex items-end gap-2">

              <p className="text-3xl font-bold tracking-tight text-[#176b5b]">
                12
              </p>

              <p className="mb-1 text-xs font-semibold text-[#668078]">
                days
              </p>

            </div>


            {/* Progress */}

            <div className="mt-3">

              <div className="mb-1.5 flex items-center justify-between">

                <span className="text-[10px] font-medium text-[#71837b]">
                  This week
                </span>

                <span className="text-[10px] font-bold text-[#1f6f5f]">
                  6 / 7
                </span>

              </div>


              <div className="h-1.5 overflow-hidden rounded-full bg-white/80">

                <div className="h-full w-[86%] rounded-full bg-[#2fa084]" />

              </div>

            </div>


            {/* Footer */}

            <p className="mt-3 text-[10px] font-medium text-[#668078]">
              One more focused day to complete your week.
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}