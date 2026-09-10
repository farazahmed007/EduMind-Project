import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  TrendingUp,
  Layers3,
  Loader2,
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
      change: "Materials in your library",
      icon: BookOpen,
      iconBg: "bg-[#6FCF97]/20",
      iconColor: "text-[#1F6F5F]",
      changeColor: "text-[#2FA084]",
    },
    {
      title: "Quizzes Taken",
      value: overview.quizzes_completed || 0,
      change: "Completed quiz attempts",
      icon: Target,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      changeColor: "text-[#2FA084]",
    },
    {
      title: "Average Score",
      value: `${overview.average_quiz_score || 0}%`,
      change: "Across completed quizzes",
      icon: TrendingUp,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      changeColor: "text-[#2FA084]",
    },
    {
      title: "Flashcards Reviewed",
      value: overview.flashcards_reviewed || 0,
      change: "Cards reviewed",
      icon: Layers3,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
      changeColor: "text-[#2FA084]",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[120px] items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-[#2FA084]"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.title}
            whileHover={{
              y: -4,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              {/* Icon */}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.iconBg}`}
              >
                <Icon
                  className={`h-6 w-6 ${stat.iconColor}`}
                />
              </div>

              {/* Content */}
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#1F6F5F]">
                  {stat.value}
                </h3>

                <p
                  className={`mt-1 text-xs font-medium ${stat.changeColor}`}
                >
                  {stat.change}
                </p>
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsCards;