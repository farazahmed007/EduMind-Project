import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Trophy,
  TrendingUp,
  Target,
  Sparkles,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatDate(value);
};

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  accent = "green",
}) {
  const accentStyles = {
    green: {
      iconBg: "bg-[#e8f6f0]",
      iconText: "text-[#2fa084]",
      value: "text-[#176b5b]",
      glow: "bg-[#6fcf97]/10",
    },
    blue: {
      iconBg: "bg-[#edf5f8]",
      iconText: "text-[#4c8292]",
      value: "text-[#356c7b]",
      glow: "bg-[#a8d5e2]/10",
    },
    amber: {
      iconBg: "bg-[#fff7e8]",
      iconText: "text-[#c68a36]",
      value: "text-[#9b6a27]",
      glow: "bg-[#f3c878]/10",
    },
    purple: {
      iconBg: "bg-[#f2eff9]",
      iconText: "text-[#75639b]",
      value: "text-[#5d4e82]",
      glow: "bg-[#c7b8e6]/10",
    },
  };

  const styles =
    accentStyles[accent] || accentStyles.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[22px] border border-[#dfe9e4] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,33,30,0.07)]"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d9b95]">
            {label}
          </p>

          <div className="mt-2 flex items-baseline gap-1">
            <p
              className={`text-[30px] font-bold tracking-[-0.04em] ${styles.value}`}
            >
              {value}
            </p>

            {suffix && (
              <span className="text-sm font-bold text-[#9aa6a1]">
                {suffix}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText} shadow-sm`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>

      <p className="relative mt-3 text-[11px] font-medium leading-5 text-[#89958f]">
        {description}
      </p>
    </motion.div>
  );
}

function ScoreTrendChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8faf9] px-6 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#2fa084]">
            <BarChart3 size={26} />
          </div>

          <p className="mt-4 text-sm font-bold text-[#53635d]">
            No quiz trend yet
          </p>

          <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-[#8d9994]">
            Complete a quiz to start building your
            performance history.
          </p>
        </div>
      </div>
    );
  }

  const width = 760;
  const height = 280;
  const paddingX = 48;
  const paddingY = 28;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const maxScore = 100;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX +
          (index / (data.length - 1)) *
            chartWidth;

    const y =
      paddingY +
      ((maxScore - item.score) / maxScore) *
        chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints =
    points.length > 1
      ? `${paddingX},${height - paddingY} ${linePoints} ${
          width - paddingX
        },${height - paddingY}`
      : "";

  return (
    <div className="rounded-2xl border border-[#e5ede9] bg-[#f8faf9] p-3 sm:p-5">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[280px] min-w-[650px] w-full"
          role="img"
          aria-label="Quiz performance trend"
        >
          {[0, 25, 50, 75, 100].map(
            (value) => {
              const y =
                paddingY +
                ((maxScore - value) /
                  maxScore) *
                  chartHeight;

              return (
                <g key={value}>
                  <line
                    x1={paddingX}
                    x2={width - paddingX}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-[#e2eae6]"
                    strokeWidth="1"
                  />

                  <text
                    x="8"
                    y={y + 4}
                    className="fill-[#9aa6a1] text-[11px]"
                  >
                    {value}%
                  </text>
                </g>
              );
            }
          )}

          {points.length > 1 && (
            <>
              <polygon
                points={areaPoints}
                fill="currentColor"
                className="text-[#2fa084]/[0.06]"
              />

              <polyline
                fill="none"
                stroke="currentColor"
                className="text-[#2fa084]"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            </>
          )}

          {points.map((point, index) => (
            <g
              key={`${point.date}-${index}`}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="9"
                fill="currentColor"
                className="text-white"
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="currentColor"
                className="text-[#2fa084]"
              />

              <text
                x={point.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-[#9aa6a1] text-[11px]"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 border-t border-[#e7eeeb] pt-3 text-[10px] font-medium text-[#9aa6a1]">
        <span>
          {data.length} quiz attempt
          {data.length === 1 ? "" : "s"} recorded
        </span>

        <span>
          1 = oldest • {data.length} = latest
        </span>
      </div>
    </div>
  );
}

function MaterialPerformance({ data }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8faf9] px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#2fa084]">
          <BookOpen size={26} />
        </div>

        <p className="mt-4 text-sm font-bold text-[#53635d]">
          No material performance yet
        </p>

        <p className="mx-auto mt-1.5 max-w-md text-xs font-medium leading-5 text-[#8d9994]">
          Complete a quiz to see how you are
          performing across individual study materials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const score = Number(
          item.average_score || 0
        );

        return (
          <motion.div
            key={item.material_id}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.04,
            }}
            className="rounded-2xl border border-[#e4ece8] bg-[#fafcfb] p-4 transition-all duration-200 hover:border-[#cfe1d9] hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <FileText size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#43534d]">
                  {item.material_title}
                </p>

                <p className="mt-1 text-[10px] font-medium text-[#9aa6a1]">
                  {item.attempts} quiz attempt
                  {item.attempts === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-bold tracking-tight text-[#1f6f5f]">
                  {item.average_score}%
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9da9a4]">
                  Average
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9efec]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    Math.max(0, score)
                  )}%`,
                }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-gradient-to-r from-[#2fa084] to-[#6fcf97]"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function RecentActivity({ activities }) {
  if (!activities.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8faf9] px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#2fa084]">
          <Activity size={26} />
        </div>

        <p className="mt-4 text-sm font-bold text-[#53635d]">
          No recent activity
        </p>

        <p className="mx-auto mt-1.5 max-w-md text-xs font-medium leading-5 text-[#8d9994]">
          Your completed quizzes and flashcard
          sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4ece8] bg-white">
      {activities.map((activity, index) => {
        const isQuiz = activity.type === "quiz";

        return (
          <motion.div
            key={`${activity.type}-${activity.date}-${index}`}
            initial={{
              opacity: 0,
              x: -6,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: index * 0.04,
            }}
            className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#fafcfb] sm:px-5 ${
              index !== activities.length - 1
                ? "border-b border-[#edf2ef]"
                : ""
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isQuiz
                  ? "bg-[#e8f6f0] text-[#2fa084]"
                  : "bg-[#edf8f3] text-[#348c72]"
              }`}
            >
              {isQuiz ? (
                <CheckCircle2 size={18} />
              ) : (
                <Layers3 size={18} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#4a5a54]">
                {activity.title}
              </p>

              <p className="mt-1 truncate text-[11px] font-medium text-[#9aa6a1]">
                {activity.description}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold text-[#9aa6a1]">
                {formatRelativeDate(
                  activity.date
                )}
              </p>

              {isQuiz && (
                <p className="mt-1 text-sm font-bold text-[#1f6f5f]">
                  {activity.score}%
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#dceee6] bg-[#f4faf7] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2fa084] shadow-sm">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-[#356b5c]">
          {title}
        </p>

        <p className="mt-1 text-[11px] font-medium leading-5 text-[#789087]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { token } = useAuth();

  const [analytics, setAnalytics] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (
    showRefreshState = false
  ) => {
    if (!token) {
      return;
    }

    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

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
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          "Failed to load learning analytics."
        );
      }

      const data = await response.json();

      if (!data || !data.overview) {
        throw new Error(
          "The server returned invalid analytics data."
        );
      }

      setAnalytics(data);
    } catch (fetchError) {
      console.error(
        "Error loading analytics:",
        fetchError
      );

      setError(
        fetchError.message ||
          "Unable to load learning analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const overview = analytics?.overview || {};
  const scoreTrend =
    analytics?.score_trend || [];
  const materialPerformance =
    analytics?.material_performance || [];
  const recentActivity =
    analytics?.recent_activity || [];

  const averageScore = Number(
    overview.average_quiz_score || 0
  );

  const performanceMessage = useMemo(() => {
    if (!overview.quizzes_completed) {
      return "Complete your first quiz to start tracking your performance.";
    }

    if (averageScore >= 85) {
      return "Your recorded quiz performance is consistently high.";
    }

    if (averageScore >= 70) {
      return "Your recorded scores show steady progress with room to strengthen weaker areas.";
    }

    return "Use your recorded quiz results to guide your next revision sessions.";
  }, [
    overview.quizzes_completed,
    averageScore,
  ]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#f4f7f6]">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[620px] items-center justify-center">
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="w-full max-w-md rounded-[28px] border border-[#dfeae5] bg-white p-10 text-center shadow-[0_12px_40px_rgba(23,33,30,0.05)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#2fa084]">
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#30443e]">
                Preparing your analytics
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-[#89958f]">
                Gathering your latest learning
                activity and performance data.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-full bg-[#f4f7f6]">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[620px] items-center justify-center">
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="w-full max-w-lg rounded-[28px] border border-[#f0d8d8] bg-white p-10 text-center shadow-[0_12px_40px_rgba(23,33,30,0.05)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#c96363]">
                <Activity size={28} />
              </div>

              <h1 className="mt-5 text-xl font-bold text-[#4b514f]">
                Unable to load analytics
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-[#8a9490]">
                {error}
              </p>

              <button
                onClick={() =>
                  fetchAnalytics()
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2fa084] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f]"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-5 sm:px-6 sm:pt-6 lg:px-8 xl:px-10">
        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[28px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#f0faf6] px-5 py-6 shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:px-7 sm:py-7 lg:px-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#cdeee1]/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                <BarChart3
                  size={25}
                  strokeWidth={2}
                />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles
                    size={9}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c938a]">
                    Your learning data
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[10px] font-semibold text-[#2fa084]">
                    Performance overview
                  </span>
                </div>

                <h1 className="text-[26px] font-bold tracking-[-0.035em] text-[#176b5b] sm:text-[30px]">
                  Learning Analytics
                </h1>

                <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#7b8984]">
                  Understand your study activity, quiz
                  performance, and revision patterns.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-2xl border border-[#dfeae5] bg-white/85 px-3.5 py-3 shadow-sm backdrop-blur-sm md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                  <Activity size={15} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa6a1]">
                    Data status
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-[#53635d]">
                    Up to date
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  fetchAnalytics(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-4 py-3 text-xs font-bold text-[#63736c] shadow-sm transition-all duration-200 hover:border-[#bcd8cd] hover:bg-[#f8fbfa] hover:text-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </div>
        </motion.section>

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 flex items-center gap-3 rounded-xl border border-[#f1dfb9] bg-[#fffaf0] px-4 py-3 text-xs font-medium text-[#956d31]"
          >
            <Activity size={15} />
            {error}
          </motion.div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Study Materials"
            value={
              overview.total_materials || 0
            }
            description="Materials currently available in your learning library."
            accent="green"
          />

          <StatCard
            icon={Trophy}
            label="Quizzes Completed"
            value={
              overview.quizzes_completed || 0
            }
            description="Completed quiz attempts recorded by EduMind."
            accent="amber"
          />

          <StatCard
            icon={TrendingUp}
            label="Average Quiz Score"
            value={
              overview.average_quiz_score || 0
            }
            suffix="%"
            description={performanceMessage}
            accent="blue"
          />

          <StatCard
            icon={Layers3}
            label="Flashcards Reviewed"
            value={
              overview.flashcards_reviewed || 0
            }
            description="Cards reviewed across completed flashcard sessions."
            accent="purple"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="rounded-[26px] border border-[#dfe9e4] bg-white p-5 shadow-[0_8px_32px_rgba(23,33,30,0.04)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#30443e]">
                    Quiz Performance Trend
                  </h2>

                  <span className="rounded-full bg-[#e8f6f0] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#2fa084]">
                    Scores
                  </span>
                </div>

                <p className="mt-1 text-xs font-medium text-[#8c9893]">
                  Your recorded quiz scores over time.
                </p>
              </div>

              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084] sm:flex">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="mt-5">
              <ScoreTrendChart
                data={scoreTrend}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12,
            }}
            className="rounded-[26px] border border-[#dfe9e4] bg-white p-5 shadow-[0_8px_32px_rgba(23,33,30,0.04)] sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Brain size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#30443e]">
                  Learning Insight
                </h2>

                <p className="mt-0.5 text-[10px] font-medium text-[#9aa6a1]">
                  Based on recorded activity
                </p>
              </div>
            </div>

            <div className="mt-5">
              <InsightCard
                icon={Sparkles}
                title="Current performance"
                description={
                  performanceMessage
                }
              />
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-[#fafcfb] px-4 py-3">
                <span className="text-xs font-medium text-[#7f8d87]">
                  Quiz attempts
                </span>

                <span className="text-sm font-bold text-[#1f6f5f]">
                  {overview.quizzes_completed ||
                    0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#fafcfb] px-4 py-3">
                <span className="text-xs font-medium text-[#7f8d87]">
                  Flashcards reviewed
                </span>

                <span className="text-sm font-bold text-[#1f6f5f]">
                  {overview.flashcards_reviewed ||
                    0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#fafcfb] px-4 py-3">
                <span className="text-xs font-medium text-[#7f8d87]">
                  Materials available
                </span>

                <span className="text-sm font-bold text-[#1f6f5f]">
                  {overview.total_materials ||
                    0}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-[#91a09a]">
              <Target
                size={13}
                className="text-[#2fa084]"
              />
              Use your recorded results to guide
              revision.
            </div>
          </motion.div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.16,
            }}
            className="rounded-[26px] border border-[#dfe9e4] bg-white p-5 shadow-[0_8px_32px_rgba(23,33,30,0.04)] sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <BookOpen size={19} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-[#30443e]">
                  Performance by Material
                </h2>

                <p className="mt-1 text-xs font-medium text-[#8c9893]">
                  Quiz performance across your study
                  materials.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <MaterialPerformance
                data={materialPerformance}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="rounded-[26px] border border-[#dfe9e4] bg-white p-5 shadow-[0_8px_32px_rgba(23,33,30,0.04)] sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Clock3 size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#30443e]">
                  Recent Activity
                </h2>

                <p className="mt-1 text-xs font-medium text-[#8c9893]">
                  Your latest completed learning
                  activities.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <RecentActivity
                activities={recentActivity}
              />
            </div>
          </motion.div>
        </section>

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-[#9aa6a1]">
          <ArrowUpRight size={12} />
          EduMind • Your learning data, organized
        </div>
      </div>
    </div>
  );
}