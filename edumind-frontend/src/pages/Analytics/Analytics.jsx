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
} from "lucide-react";

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

function StatCard({ icon: Icon, label, value, suffix, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <div className="mt-2 flex items-baseline gap-1">
            <p className="text-3xl font-bold text-[#1F6F5F]">
              {value}
            </p>

            {suffix && (
              <span className="text-sm font-semibold text-gray-400">
                {suffix}
              </span>
            )}
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function ScoreTrendChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-xl bg-[#F8F9F8] px-6 text-center">
        <div>
          <BarChart3
            size={30}
            className="mx-auto text-gray-300"
          />
          <p className="mt-3 text-sm font-medium text-gray-500">
            Complete a quiz to start building your performance trend.
          </p>
        </div>
      </div>
    );
  }

  const width = 760;
  const height = 260;
  const paddingX = 42;
  const paddingY = 28;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const maxScore = 100;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX +
          (index / (data.length - 1)) * chartWidth;
    const y =
      paddingY +
      ((maxScore - item.score) / maxScore) * chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="rounded-xl bg-[#F8F9F8] p-4 sm:p-5">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[260px] min-w-[650px] w-full"
          role="img"
          aria-label="Quiz performance trend"
        >
          {[0, 25, 50, 75, 100].map((value) => {
            const y =
              paddingY +
              ((maxScore - value) / maxScore) * chartHeight;

            return (
              <g key={value}>
                <line
                  x1={paddingX}
                  x2={width - paddingX}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200"
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y={y + 4}
                  className="fill-gray-400 text-[11px]"
                >
                  {value}%
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="currentColor"
              className="text-[#2FA084]"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={linePoints}
            />
          )}

          {points.map((point, index) => (
            <g key={`${point.date}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="currentColor"
                className="text-[#2FA084]"
              />
              <text
                x={point.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-gray-400 text-[11px]"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>
          Quiz attempts: {data.length}
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
      <div className="rounded-xl bg-[#F8F9F8] px-6 py-12 text-center">
        <BookOpen
          size={30}
          className="mx-auto text-gray-300"
        />
        <p className="mt-3 text-sm font-medium text-gray-500">
          Material performance will appear after your first completed quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div
          key={item.material_id}
          className="rounded-xl border border-gray-100 bg-[#F8F9F8] p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-700">
                {item.material_title}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {item.attempts} quiz attempt
                {item.attempts === 1 ? "" : "s"}
              </p>
            </div>

            <p className="shrink-0 text-sm font-bold text-[#1F6F5F]">
              {item.average_score}%
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, item.average_score)
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivity({ activities }) {
  if (!activities.length) {
    return (
      <div className="rounded-xl bg-[#F8F9F8] px-6 py-12 text-center">
        <Activity
          size={30}
          className="mx-auto text-gray-300"
        />
        <p className="mt-3 text-sm font-medium text-gray-500">
          Your learning activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
      {activities.map((activity, index) => {
        const isQuiz = activity.type === "quiz";

        return (
          <div
            key={`${activity.type}-${activity.date}-${index}`}
            className="flex items-center gap-4 px-4 py-4 sm:px-5"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isQuiz
                  ? "bg-[#6FCF97]/20 text-[#1F6F5F]"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {isQuiz ? (
                <CheckCircle2 size={19} />
              ) : (
                <Layers3 size={19} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {activity.title}
              </p>
              <p className="mt-1 truncate text-xs text-gray-400">
                {activity.description}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-gray-400">
                {formatRelativeDate(activity.date)}
              </p>
              {isQuiz && (
                <p className="mt-1 text-sm font-bold text-[#1F6F5F]">
                  {activity.score}%
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/`
      );

      if (!response.ok) {
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
    fetchAnalytics();
  }, []);

  const overview = analytics?.overview || {};
  const scoreTrend = analytics?.score_trend || [];
  const materialPerformance =
    analytics?.material_performance || [];
  const recentActivity = analytics?.recent_activity || [];

  const performanceMessage = useMemo(() => {
    const score = Number(overview.average_quiz_score || 0);

    if (!overview.quizzes_completed) {
      return "Complete your first quiz to start tracking performance.";
    }

    if (score >= 85) {
      return "Excellent consistency. Keep challenging yourself.";
    }

    if (score >= 70) {
      return "Good progress. Keep revising the areas that cost marks.";
    }

    return "Use your quiz results to focus revision on weaker areas.";
  }, [overview.average_quiz_score, overview.quizzes_completed]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-[#2FA084]"
            />
            <p className="mt-4 text-sm text-gray-500">
              Loading your learning analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Activity size={28} />
            </div>
            <h1 className="mt-5 text-xl font-bold text-gray-800">
              Unable to load analytics
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              {error}
            </p>
            <button
              onClick={() => fetchAnalytics()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <BarChart3 size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#1F6F5F]">
                  Learning Analytics
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track your learning progress and identify where to focus next.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        )}

        {/* Overview cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Study Materials"
            value={overview.total_materials || 0}
            description="Materials available in your library."
          />

          <StatCard
            icon={Trophy}
            label="Quizzes Completed"
            value={overview.quizzes_completed || 0}
            description="Completed quiz attempts recorded."
          />

          <StatCard
            icon={Brain}
            label="Average Quiz Score"
            value={overview.average_quiz_score || 0}
            suffix="%"
            description={performanceMessage}
          />

          <StatCard
            icon={Layers3}
            label="Flashcards Reviewed"
            value={overview.flashcards_reviewed || 0}
            description="Cards reviewed in completed study sets."
          />
        </section>

        {/* Trend + insight */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Quiz Performance Trend
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your recorded quiz scores over time.
                </p>
              </div>

              <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] sm:flex">
                <Activity size={18} />
              </div>
            </div>

            <div className="mt-5">
              <ScoreTrendChart data={scoreTrend} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
                <Brain size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Learning Insight
              </h2>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F8F9F8] p-5">
              <p className="text-sm leading-6 text-gray-600">
                {performanceMessage}
              </p>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Quiz attempts
                </span>
                <span className="font-semibold text-[#1F6F5F]">
                  {overview.quizzes_completed || 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Flashcards reviewed
                </span>
                <span className="font-semibold text-[#1F6F5F]">
                  {overview.flashcards_reviewed || 0}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Materials available
                </span>
                <span className="font-semibold text-[#1F6F5F]">
                  {overview.total_materials || 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Material performance */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <BookOpen size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Performance by Material
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                See which study materials are performing strongest in quizzes.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <MaterialPerformance data={materialPerformance} />
          </div>
        </section>

        {/* Recent activity */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Clock3 size={19} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Activity
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your latest completed learning activities.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <RecentActivity activities={recentActivity} />
          </div>
        </section>
      </div>
    </div>
  );
}
