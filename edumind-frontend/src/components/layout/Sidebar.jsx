import { useCallback, useEffect, useState } from "react";
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
  X,
} from "lucide-react";

import Logo from "./Logo";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

export default function Sidebar({
  isOpen = true,
  onToggle,
}) {
  const { token } = useAuth();

  const [streak, setStreak] = useState(0);
  const [activeDaysThisWeek, setActiveDaysThisWeek] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!token) {
      setStreak(0);
      setActiveDaysThisWeek(0);
      setStreakLoading(false);
      return;
    }

    try {
      setStreakLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/analytics/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Analytics request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const studyStreak = data?.study_streak;

      setStreak(
        Number(studyStreak?.current_streak ?? 0)
      );

      setActiveDaysThisWeek(
        Number(
          studyStreak?.active_days_this_week ?? 0
        )
      );
    } catch (error) {
      console.error(
        "Unable to load study streak:",
        error
      );

      setStreak(0);
      setActiveDaysThisWeek(0);
    } finally {
      setStreakLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStreak();

    const handleActivityUpdate = () => {
      fetchStreak();
    };

    const handleWindowFocus = () => {
      fetchStreak();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStreak();
      }
    };

    window.addEventListener(
      "edumind:activity-updated",
      handleActivityUpdate
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "edumind:activity-updated",
        handleActivityUpdate
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fetchStreak]);

  const weeklyProgress = Math.min(
    Math.round((activeDaysThisWeek / 7) * 100),
    100
  );

  const weeklyLabel = streakLoading
    ? "... / 7"
    : `${activeDaysThisWeek} / 7`;

  const progressMessage = streakLoading
    ? "Loading your study progress..."
    : activeDaysThisWeek >= 7
      ? "Perfect week. Keep the momentum going!"
      : activeDaysThisWeek === 0
        ? "Start studying today to build your streak."
        : `${7 - activeDaysThisWeek} more focused ${
            7 - activeDaysThisWeek === 1
              ? "day"
              : "days"
          } to complete your week.`;

  return (
    <aside
      className={`
        flex h-screen shrink-0 flex-col
        overflow-hidden border-r border-[#e4ebe8] bg-white
        transition-[width,transform] duration-300 ease-out
        ${
          isOpen
            ? "w-[280px]"
            : "w-0 border-r-0"
        }
      `}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-[280px] flex-col">
        {/* Brand */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <div className="rounded-2xl bg-[#f7faf9] px-2 py-1">
            <Logo />
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#71817b] transition-all duration-200 hover:bg-[#f2f7f5] hover:text-[#1f6f5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/40"
            aria-label="Close sidebar"
          >
            <X
              size={18}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Navigation */}
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

        {/* Streak / Motivation Card */}
        <div className="shrink-0 px-3 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-[#dceee6] bg-gradient-to-br from-[#f3faf7] via-[#eaf7f1] to-[#e2f3eb] p-4">
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
                  {streakLoading ? "..." : streak}
                </p>

                <p className="mb-1 text-xs font-semibold text-[#668078]">
                  {streak === 1 ? "day" : "days"}
                </p>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#71837b]">
                    This week
                  </span>

                  <span className="text-[10px] font-bold text-[#1f6f5f]">
                    {weeklyLabel}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-[#2fa084] transition-[width] duration-500"
                    style={{
                      width: `${weeklyProgress}%`,
                    }}
                  />
                </div>

                <div className="mt-1 text-right">
                  <span className="text-[9px] font-semibold text-[#668078]">
                    {streakLoading
                      ? "..."
                      : `${weeklyProgress}%`}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <p className="mt-2 text-[10px] font-medium text-[#668078]">
                {progressMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}