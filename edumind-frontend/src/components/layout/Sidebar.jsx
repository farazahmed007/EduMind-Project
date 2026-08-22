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
    <aside className="flex h-screen w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white">
      
      {/* Logo */}
      <Logo />

      {/* Main Navigation */}
      <nav className="mt-3 flex-1 space-y-1">
        {mainNavigation.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 py-3">
        {bottomNavigation.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </div>

      {/* Streak Card */}
      <div className="mx-3 mb-4 rounded-xl border border-gray-200 bg-[#EEEEEE] p-4">
        <p className="text-sm font-medium text-[#1F6F5F]">
          🔥 Your Streak
        </p>

        <p className="mt-1 text-2xl font-bold text-[#2FA084]">
          12 Days
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Keep it up!
        </p>
      </div>

    </aside>
  );
}