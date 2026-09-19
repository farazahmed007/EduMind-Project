import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

function WelcomeSection() {
  const { user } = useAuth();

  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);

  const displayName = user?.name || "User";

  useEffect(() => {
    let isMounted = true;

    const fetchStreak = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (isMounted) {
          setStreak(0);
          setStreakLoading(false);
        }

        return;
      }

      try {
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

        if (isMounted) {
          setStreak(
            data?.study_streak?.current_streak ?? 0
          );
        }
      } catch (error) {
        console.error(
          "Unable to load study streak:",
          error
        );

        if (isMounted) {
          setStreak(0);
        }
      } finally {
        if (isMounted) {
          setStreakLoading(false);
        }
      }
    };

    fetchStreak();

    return () => {
      isMounted = false;
    };
  }, []);

  const streakLabel = streakLoading
    ? "..."
    : `${streak} ${streak === 1 ? "day" : "days"}`;

  return (
    <section className="mb-7">
      <div className="relative overflow-hidden rounded-[24px] border border-[#dcece5] bg-white shadow-[0_10px_35px_rgba(31,111,95,0.07)]">
        {/* Decorative background */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />

          <div className="absolute bottom-[-100px] right-24 h-56 w-56 rounded-full bg-[#2fa084]/8 blur-3xl" />

          <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-[#cdeee1]/70 sm:block" />

          <div className="absolute right-16 top-16 hidden h-16 w-16 rounded-full border border-[#cdeee1]/80 sm:block" />
        </div>

        {/* Main content */}

        <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8">
          {/* Greeting */}

          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dceee6] bg-[#f3faf7] px-3 py-1.5">
              <Sparkles
                size={13}
                strokeWidth={2.2}
                className="text-[#2fa084]"
              />

              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1f6f5f]">
                Your learning space
              </span>
            </div>

            <h1 className="max-w-2xl text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#17211e] sm:text-[34px] lg:text-[38px]">
              Welcome back,{" "}
              <span className="text-[#1f6f5f]">
                {displayName}
              </span>

              <span className="ml-2 inline-block">
                👋
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#667670] sm:text-[15px]">
              Pick up where you left off and keep making progress toward
              your learning goals.
            </p>

            {/* Mini progress indicators */}

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {/* Streak */}

              <div className="inline-flex items-center gap-2 rounded-xl border border-[#e4eee9] bg-[#f8fbfa] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5ee] text-[#2fa084]">
                  <Flame
                    size={15}
                    strokeWidth={2.2}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#8a9993]">
                    Streak
                  </p>

                  <p className="text-xs font-bold text-[#25322e]">
                    {streakLabel}
                  </p>
                </div>
              </div>

              {/* Focus */}

              <div className="inline-flex items-center gap-2 rounded-xl border border-[#e4eee9] bg-[#f8fbfa] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5ee] text-[#2fa084]">
                  <Target
                    size={15}
                    strokeWidth={2.2}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#8a9993]">
                    Focus
                  </p>

                  <p className="text-xs font-bold text-[#25322e]">
                    Keep going
                  </p>
                </div>
              </div>

              {/* Learning */}

              <div className="inline-flex items-center gap-2 rounded-xl border border-[#e4eee9] bg-[#f8fbfa] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5ee] text-[#2fa084]">
                  <BookOpen
                    size={15}
                    strokeWidth={2.2}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#8a9993]">
                    Learning
                  </p>

                  <p className="text-xs font-bold text-[#25322e]">
                    In progress
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual focus card */}

          <div className="relative hidden shrink-0 lg:block">
            <div className="relative flex h-[170px] w-[210px] items-center justify-center">
              {/* Outer glow */}

              <div className="absolute h-36 w-36 rounded-full bg-[#6fcf97]/10 blur-2xl" />

              {/* Decorative rings */}

              <div className="absolute h-36 w-36 rounded-full border border-[#cdeee1]" />

              <div className="absolute h-28 w-28 rounded-full border border-[#dceee6]" />

              {/* Main icon tile */}

              <div className="relative flex h-24 w-24 rotate-[-3deg] items-center justify-center rounded-[26px] border border-[#cdeee1] bg-gradient-to-br from-[#f3faf7] to-[#e5f5ee] shadow-[0_12px_30px_rgba(31,111,95,0.12)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2fa084] shadow-sm">
                  <BookOpen
                    size={29}
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              {/* Floating streak badge */}

              <div className="absolute right-1 top-4 flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-2 shadow-[0_8px_24px_rgba(23,33,30,0.10)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff5df] text-[#d88b18]">
                  <Flame
                    size={15}
                    fill="currentColor"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9aa59f]">
                    Streak
                  </p>

                  <p className="text-xs font-bold text-[#25322e]">
                    {streakLabel}
                  </p>
                </div>
              </div>

              {/* Floating progress badge */}

              <div className="absolute bottom-3 left-0 flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-2 shadow-[0_8px_24px_rgba(23,33,30,0.10)]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e5f5ee] text-[#2fa084]">
                  <Target
                    size={14}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9aa59f]">
                    Today
                  </p>

                  <p className="text-xs font-bold text-[#25322e]">
                    Stay focused
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent */}

        <div className="relative h-1 overflow-hidden bg-[#edf6f2]">
          <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-[#2fa084] to-[#6fcf97]" />
        </div>
      </div>
    </section>
  );
}

export default WelcomeSection;