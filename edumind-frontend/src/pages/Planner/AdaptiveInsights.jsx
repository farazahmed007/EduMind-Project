import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ==================================================
// PRIORITY HELPERS
// ==================================================

const getPriorityClasses = (priority) => {
  switch (priority) {
    case "high":
      return {
        badge: "border-red-200 bg-red-50 text-red-600",
        dot: "bg-red-500",
        icon: "bg-red-100 text-red-600",
      };

    case "medium":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-600",
        dot: "bg-orange-500",
        icon: "bg-orange-100 text-orange-600",
      };

    default:
      return {
        badge:
          "border-[#cdeee1] bg-[#f0faf5] text-[#1f6f5f]",
        dot: "bg-[#2fa084]",
        icon: "bg-[#e8f6f0] text-[#2fa084]",
      };
  }
};

// ==================================================
// TREND HELPERS
// ==================================================

const getTrendIcon = (score) => {
  if (score === null || score === undefined) {
    return null;
  }

  const numericScore = Number(score);

  if (numericScore < 60) {
    return TrendingDown;
  }

  if (numericScore >= 80) {
    return TrendingUp;
  }

  return null;
};

// ==================================================
// COMPONENT
// ==================================================

function AdaptiveInsights() {
  const { token } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ==================================================
  // FETCH AI RECOMMENDATIONS
  // ==================================================

  const fetchRecommendations = async (showRefreshState = false) => {
    if (!token) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/adaptive/recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to load adaptive recommendations.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = Array.isArray(data.detail)
              ? data.detail
                  .map((item) => item.msg || String(item))
                  .join(", ")
              : data.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      setRecommendations(
        Array.isArray(data?.recommendations)
          ? data.recommendations
          : []
      );
    } catch (err) {
      console.error(
        "Error loading adaptive recommendations:",
        err
      );

      setRecommendations([]);

      setError(
        err.message ||
          "Unable to load adaptive recommendations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    fetchRecommendations();
  }, [token]);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <section className="mb-6 overflow-hidden rounded-[24px] border border-[#dceee6] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.045)]">
      {/* ==================================================
          PREMIUM HEADER
          ================================================== */}

      <div className="relative overflow-hidden border-b border-[#edf2ef] bg-gradient-to-br from-[#f8fcfa] via-white to-[#eef9f4] px-5 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#6fcf97]/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#cdeee1]/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
              <Brain size={22} strokeWidth={2.1} />

              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                <Sparkles size={9} strokeWidth={2.5} />
              </span>
            </div>

            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#789087]">
                  Adaptive Intelligence
                </span>

                <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2fa084]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />
                  Personalized
                </span>
              </div>

              <h3 className="text-[22px] font-bold tracking-[-0.025em] text-[#176b5b] sm:text-[24px]">
                AI Study Insights
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-5 text-[#71817b]">
                Personalized recommendations based on your
                learning performance, quiz history, and study
                activity.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchRecommendations(true)}
            disabled={loading || refreshing}
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#dce7e2] bg-white/90 px-3.5 py-2.5 text-xs font-bold text-[#5e7069] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#a9dfcc] hover:text-[#1f6f5f] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`transition-transform duration-500 ${
                refreshing ? "animate-spin" : "group-hover:rotate-90"
              }`}
            />
            Refresh Insights
          </button>
        </div>

        {/* Header metrics */}
        {!loading && !error && recommendations.length > 0 && (
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dceee6] bg-white/80 px-3 py-1.5">
              <Target size={13} className="text-[#2fa084]" />
              <span className="text-[10px] font-bold text-[#60736b]">
                {recommendations.length} active recommendation
                {recommendations.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#dceee6] bg-white/80 px-3 py-1.5">
              <Sparkles size={13} className="text-[#2fa084]" />
              <span className="text-[10px] font-bold text-[#60736b]">
                Powered by your learning data
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f6f0]">
              <LoaderIcon />
            </div>

            <div>
              <p className="text-xs font-bold text-[#53635d]">
                Analyzing your learning activity
              </p>

              <p className="mt-0.5 text-[10px] font-medium text-[#96a39e]">
                Building personalized recommendations...
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#edf2ef] bg-[#fafcfb] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#edf2ef]" />

                  <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-3/5 animate-pulse rounded bg-[#edf2ef]" />
                    <div className="mt-2 h-2.5 w-4/5 animate-pulse rounded bg-[#f0f3f1]" />
                    <div className="mt-2 h-2.5 w-2/3 animate-pulse rounded bg-[#f0f3f1]" />
                  </div>
                </div>

                <div className="mt-4 h-8 w-full animate-pulse rounded-xl bg-[#f0f3f1]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================
          ERROR
          ================================================== */}

      {!loading && error && (
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-red-200 bg-[#fff8f8] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
                <AlertCircle size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-red-700">
                  Unable to load AI insights
                </h4>

                <p className="mt-1 text-sm leading-5 text-red-600/90">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => fetchRecommendations(true)}
                  disabled={refreshing}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow-sm ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={
                      refreshing ? "animate-spin" : ""
                    }
                  />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          EMPTY STATE
          ================================================== */}

      {!loading &&
        !error &&
        recommendations.length === 0 && (
          <div className="p-5 sm:p-6">
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#d9e7e1] bg-[#fafcfb] px-6 py-12 text-center">
              <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dceee6] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                <Lightbulb size={24} />
              </div>

              <h4 className="relative mt-5 text-base font-bold text-[#53635d]">
                Your AI insights are waiting
              </h4>

              <p className="relative mx-auto mt-2 max-w-lg text-sm leading-6 text-[#8a9892]">
                Upload study materials and complete some
                learning activities. EduMind will use that
                activity to identify what deserves your
                attention next.
              </p>
            </div>
          </div>
        )}

      {/* ==================================================
          RECOMMENDATIONS
          ================================================== */}

      {!loading &&
        !error &&
        recommendations.length > 0 && (
          <div className="p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              {recommendations.map(
                (recommendation, index) => {
                  const priority = getPriorityClasses(
                    recommendation.priority
                  );

                  const TrendIcon = getTrendIcon(
                    recommendation.average_quiz_score
                  );

                  return (
                    <article
                      key={`${recommendation.material_id}-${index}`}
                      className="group relative overflow-hidden rounded-2xl border border-[#e4ece8] bg-[#fbfcfb] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cdeee1] hover:bg-white hover:shadow-[0_10px_28px_rgba(23,33,30,0.06)] sm:p-5"
                    >
                      {/* Priority accent */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1 ${priority.dot}`}
                      />

                      <div className="flex items-start gap-3">
                        {/* Material icon */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${priority.icon} shadow-sm`}
                        >
                          <BookOpen
                            size={19}
                            strokeWidth={2.1}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Title row */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#9aa6a1]">
                                  Focus area {index + 1}
                                </span>
                              </div>

                              <h4 className="mt-1 truncate text-sm font-bold text-[#43534d]">
                                {recommendation.material_title}
                              </h4>
                            </div>

                            <span
                              className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${priority.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${priority.dot}`}
                              />
                              {recommendation.priority ||
                                "medium"}
                            </span>
                          </div>

                          {/* Recommendation reason */}
                          {recommendation.reason && (
                            <div className="mt-4 rounded-xl border border-[#edf2ef] bg-white p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                                  <Target size={13} />
                                </div>

                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#648077]">
                                  Why this material
                                </p>
                              </div>

                              <p className="mt-2 text-sm leading-5 text-[#687871]">
                                {recommendation.reason}
                              </p>
                            </div>
                          )}

                          {/* Recommended action */}
                          {recommendation.action && (
                            <div className="mt-3 rounded-xl border border-[#dceee6] bg-[#f3faf7] p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
                                  <Lightbulb size={13} />
                                </div>

                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f6f5f]">
                                  Recommended action
                                </p>

                                <ArrowUpRight
                                  size={13}
                                  className="ml-auto text-[#82a69a]"
                                />
                              </div>

                              <p className="mt-2 text-sm font-medium leading-5 text-[#557067]">
                                {recommendation.action}
                              </p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {recommendation.suggested_duration_minutes && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ede9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8b84]">
                                <Clock3
                                  size={12}
                                  className="text-[#2fa084]"
                                />
                                {
                                  recommendation.suggested_duration_minutes
                                }{" "}
                                min
                              </span>
                            )}

                            {recommendation.average_quiz_score !==
                              null &&
                              recommendation.average_quiz_score !==
                                undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ede9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8b84]">
                                  {TrendIcon ? (
                                    <TrendIcon
                                      size={12}
                                      className={
                                        Number(
                                          recommendation.average_quiz_score
                                        ) >= 80
                                          ? "text-[#2fa084]"
                                          : "text-orange-500"
                                      }
                                    />
                                  ) : (
                                    <Target
                                      size={12}
                                      className="text-[#8a9a93]"
                                    />
                                  )}

                                  Avg. score{" "}
                                  <strong className="text-[#52635c]">
                                    {
                                      recommendation.average_quiz_score
                                    }
                                    %
                                  </strong>
                                </span>
                              )}

                            {recommendation.quiz_attempts !==
                              undefined && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ede9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8b84]">
                                <CheckCircle2
                                  size={12}
                                  className="text-[#2fa084]"
                                />
                                {
                                  recommendation.quiz_attempts
                                }{" "}
                                attempt
                                {recommendation.quiz_attempts ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            )}

                            {recommendation.days_since_activity !==
                              null &&
                              recommendation.days_since_activity !==
                                undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ede9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8b84]">
                                  <Clock3
                                    size={12}
                                    className="text-[#8b9a94]"
                                  />
                                  {recommendation.days_since_activity ===
                                  0
                                    ? "Active today"
                                    : `Inactive for ${recommendation.days_since_activity} day${
                                        recommendation.days_since_activity ===
                                        1
                                          ? ""
                                          : "s"
                                      }`}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#edf2ef] bg-[#fafcfb] px-4 py-3">
              <Sparkles
                size={14}
                className="shrink-0 text-[#2fa084]"
              />

              <p className="text-[10px] font-medium leading-4 text-[#899791]">
                Recommendations are generated from your
                learning activity and update as your progress
                changes.
              </p>
            </div>
          </div>
        )}
    </section>
  );
}

// ==================================================
// SMALL LOADING ICON
// ==================================================

function LoaderIcon() {
  return (
    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#bfe5d5] border-t-[#2fa084]" />
  );
}

export default AdaptiveInsights;