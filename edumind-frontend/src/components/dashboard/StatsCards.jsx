import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  TrendingUp,
  Layers3,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


const API_BASE_URL = "http://127.0.0.1:8000";


function StatsCards() {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
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
            "Failed to load dashboard statistics."
          );
        }

        const data = await response.json();

        setAnalytics(data);
      } catch (error) {
        console.error(
          "Error loading dashboard statistics:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);


  const overview = analytics?.overview || {};


  const stats = [
    {
      title: "Study Materials",
      value: overview.total_materials || 0,
      description: "Materials in your library",
      icon: BookOpen,
      iconBg: "bg-[#e5f5ee]",
      iconColor: "text-[#2fa084]",
      accent: "bg-[#2fa084]",
      glow: "bg-[#6fcf97]/10",
    },
    {
      title: "Quizzes Taken",
      value: overview.quizzes_completed || 0,
      description: "Completed quiz attempts",
      icon: Target,
      iconBg: "bg-[#eef4ff]",
      iconColor: "text-[#5478c8]",
      accent: "bg-[#6d8fda]",
      glow: "bg-[#8eafff]/10",
    },
    {
      title: "Average Score",
      value: `${overview.average_quiz_score || 0}%`,
      description: "Across completed quizzes",
      icon: TrendingUp,
      iconBg: "bg-[#fff5e8]",
      iconColor: "text-[#d58b32]",
      accent: "bg-[#e0a34f]",
      glow: "bg-[#f4c77b]/10",
    },
    {
      title: "Flashcards Reviewed",
      value: overview.flashcards_reviewed || 0,
      description: "Cards reviewed",
      icon: Layers3,
      iconBg: "bg-[#f4edff]",
      iconColor: "text-[#8565c2]",
      accent: "bg-[#9b7bd4]",
      glow: "bg-[#c1a7ee]/10",
    },
  ];


  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[148px] overflow-hidden rounded-2xl border border-[#e2ebe7] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.04)]"
          >
            <div className="animate-pulse">

              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-[#edf3f0]" />
                <div className="h-3 w-10 rounded-full bg-[#edf3f0]" />
              </div>

              <div className="mt-5 h-3 w-24 rounded-full bg-[#edf3f0]" />

              <div className="mt-2 h-7 w-16 rounded-lg bg-[#e5ece9]" />

              <div className="mt-3 h-2.5 w-36 rounded-full bg-[#f0f4f2]" />

            </div>
          </div>
        ))}

      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.title}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
              delay: index * 0.06,
              ease: "easeOut",
            }}
            whileHover={{
              y: -5,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            }}
            whileTap={{
              scale: 0.99,
            }}
            className="group relative min-h-[148px] overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.045)] transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(23,33,30,0.09)]"
          >

            {/* Decorative glow */}

            <div
              className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${stat.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
            />


            {/* Top row */}

            <div className="relative flex items-start justify-between">

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor} ring-1 ring-black/[0.02] transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon
                  size={21}
                  strokeWidth={2}
                />
              </div>


              <div className="flex items-center gap-1.5 pt-1">

                <span
                  className={`h-1.5 w-1.5 rounded-full ${stat.accent}`}
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9aa7a2]">
                  Live
                </span>

              </div>

            </div>


            {/* Metric */}

            <div className="relative mt-5">

              <p className="text-xs font-semibold tracking-wide text-[#71817b]">
                {stat.title}
              </p>

              <div className="mt-1 flex items-baseline gap-1.5">

                <h3 className="text-[28px] font-bold leading-none tracking-[-0.035em] text-[#17211e]">
                  {stat.value}
                </h3>

              </div>

            </div>


            {/* Description */}

            <div className="relative mt-3 flex items-center justify-between gap-3">

              <p className="truncate text-[11px] font-medium text-[#8a9892]">
                {stat.description}
              </p>

              <div className="h-1 w-7 shrink-0 overflow-hidden rounded-full bg-[#edf2ef]">
                <div
                  className={`h-full w-2/3 rounded-full ${stat.accent} opacity-70 transition-all duration-500 group-hover:w-full`}
                />
              </div>

            </div>


            {/* Bottom accent */}

            <div
              className={`absolute bottom-0 left-0 h-[2px] w-0 ${stat.accent} transition-all duration-300 group-hover:w-full`}
            />

          </motion.div>
        );
      })}

    </div>
  );
}


export default StatsCards;