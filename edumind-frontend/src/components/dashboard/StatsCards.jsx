import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  TrendingUp,
  Flame,
} from "lucide-react";

const stats = [
  {
    title: "Study Time",
    value: "24h 30m",
    change: "+3h this week",
    icon: BookOpen,
    iconBg: "bg-[#6FCF97]/20",
    iconColor: "text-[#1F6F5F]",
    changeColor: "text-[#2FA084]",
  },
  {
    title: "Quizzes Taken",
    value: "48",
    change: "+12 this week",
    icon: Target,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    changeColor: "text-[#2FA084]",
  },
  {
    title: "Average Score",
    value: "78%",
    change: "+8% improvement",
    icon: TrendingUp,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    changeColor: "text-[#2FA084]",
  },
  {
    title: "Current Streak",
    value: "12 Days",
    change: "Keep it up!",
    icon: Flame,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-500",
    changeColor: "text-[#2FA084]",
  },
];

function StatsCards() {
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
                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>

              {/* Content */}
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#1F6F5F]">
                  {stat.value}
                </h3>

                <p className={`mt-1 text-xs font-medium ${stat.changeColor}`}>
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