import {
  BarChart3,
  Clock3,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const weeklyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 1.8 },
  { day: "Thu", hours: 4.1 },
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 5.2 },
  { day: "Sun", hours: 4.2 },
];

const subjects = [
  {
    name: "Java Programming",
    progress: 78,
    color: "bg-[#2FA084]",
  },
  {
    name: "Machine Learning",
    progress: 65,
    color: "bg-[#6FCF97]",
  },
  {
    name: "Computer Networks",
    progress: 52,
    color: "bg-[#1F6F5F]",
  },
  {
    name: "Database Management",
    progress: 72,
    color: "bg-[#2FA084]",
  },
];

function LearningOverview() {
  return (
    <section className="mt-8">
      {/* Section Heading */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1F6F5F]">
          Learning Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Track your learning activity and subject progress.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Learning Activity */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">

          {/* Card Header */}
          <div className="flex items-start justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <BarChart3 size={22} />
              </div>

              <div>
                <h3 className="font-semibold text-[#1F6F5F]">
                  Learning Activity
                </h3>

                <p className="text-sm text-gray-500">
                  Study hours this week
                </p>
              </div>
            </div>

            {/* Total Study Time */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#2FA084]">
                <Clock3 size={16} />

                <span className="text-sm font-semibold">
                  24.5h
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-400">
                This week
              </p>
            </div>

          </div>

          {/* Chart */}
          <div className="mt-6 h-[280px] w-full">

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>

                <defs>
                  <linearGradient
                    id="learningGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2FA084"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="100%"
                      stopColor="#2FA084"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) => `${value}h`}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value) => [`${value} hours`, "Study Time"]}
                />

                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#2FA084"
                  strokeWidth={3}
                  fill="url(#learningGradient)"
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>

          {/* Bottom Insight */}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EEEEEE] px-4 py-3">

            <TrendingUp
              size={17}
              className="text-[#2FA084]"
            />

            <p className="text-sm text-gray-600">
              Your study time is{" "}
              <span className="font-semibold text-[#1F6F5F]">
                18% higher
              </span>{" "}
              than last week.
            </p>

          </div>

        </div>

        {/* Subject Progress */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <BarChart3 size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-[#1F6F5F]">
                Subject Progress
              </h3>

              <p className="text-sm text-gray-500">
                Your current progress
              </p>
            </div>

          </div>

          {/* Subjects */}
          <div className="mt-7 space-y-6">

            {subjects.map((subject) => (
              <div key={subject.name}>

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-700">
                    {subject.name}
                  </span>

                  <span className="text-sm font-semibold text-[#1F6F5F]">
                    {subject.progress}%
                  </span>

                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEEEEE]">

                  <div
                    className={`h-full rounded-full ${subject.color} transition-all duration-500`}
                    style={{
                      width: `${subject.progress}%`,
                    }}
                  />

                </div>

              </div>
            ))}

          </div>

          {/* View Analytics */}
          <button
            className="mt-8 w-full rounded-xl border border-[#2FA084]
              py-2.5 text-sm font-semibold text-[#1F6F5F]
              transition hover:bg-[#2FA084] hover:text-white"
          >
            View Detailed Analytics
          </button>

        </div>

      </div>
    </section>
  );
}

export default LearningOverview;