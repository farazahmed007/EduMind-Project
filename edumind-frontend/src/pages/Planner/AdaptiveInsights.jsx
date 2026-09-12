import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Clock3,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";


// ==================================================
// PRIORITY HELPERS
// ==================================================

const getPriorityClasses = (priority) => {
  switch (priority) {
    case "high":
      return {
        badge:
          "bg-red-50 text-red-600 border-red-100",
        dot: "bg-red-500",
      };

    case "medium":
      return {
        badge:
          "bg-orange-50 text-orange-600 border-orange-100",
        dot: "bg-orange-500",
      };

    default:
      return {
        badge:
          "bg-[#6FCF97]/15 text-[#1F6F5F] border-[#6FCF97]/30",
        dot: "bg-[#2FA084]",
      };
  }
};


// ==================================================
// COMPONENT
// ==================================================

function AdaptiveInsights() {
  const { token } = useAuth();

  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==================================================
  // FETCH AI RECOMMENDATIONS
  // ==================================================

  const fetchRecommendations = async () => {
    if (!token) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
          const data =
            await response.json();

          if (data?.detail) {
            message =
              Array.isArray(data.detail)
                ? data.detail
                    .map(
                      (item) =>
                        item.msg
                    )
                    .join(", ")
                : data.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      setRecommendations(
        Array.isArray(
          data?.recommendations
        )
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
    <section className="mb-5 rounded-2xl border border-[#6FCF97]/30 bg-white p-6 shadow-sm">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
            <Sparkles size={21} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2FA084]">
              Adaptive Intelligence
            </p>

            <h3 className="mt-1 text-xl font-bold text-[#1F6F5F]">
              AI Study Insights
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Personalized study recommendations based
              on your learning performance and activity.
            </p>
          </div>

        </div>

        {!loading && !error && (
          <button
            type="button"
            onClick={fetchRecommendations}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#2FA084] hover:text-[#1F6F5F]"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        )}

      </div>


      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <div className="mt-6 space-y-3">

          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-start gap-3">

                <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />

                <div className="flex-1">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-gray-100" />

                  <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-gray-100" />

                  <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-gray-100" />
                </div>

              </div>
            </div>
          ))}

        </div>
      )}


      {/* ==================================================
          ERROR
          ================================================== */}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-5">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div className="flex-1">

              <h4 className="text-sm font-semibold text-red-700">
                Unable to load AI insights
              </h4>

              <p className="mt-1 text-sm leading-5 text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchRecommendations}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
              >
                <RefreshCw size={15} />
                Try Again
              </button>

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
          <div className="mt-6 rounded-xl bg-[#F8F9F8] px-6 py-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Lightbulb size={23} />
            </div>

            <h4 className="mt-4 text-base font-semibold text-gray-600">
              No recommendations yet
            </h4>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Upload study materials and complete some
              learning activities so EduMind can identify
              what you should study next.
            </p>

          </div>
        )}


      {/* ==================================================
          RECOMMENDATIONS
          ================================================== */}

      {!loading &&
        !error &&
        recommendations.length > 0 && (
          <div className="mt-6 space-y-3">

            {recommendations.map(
              (recommendation, index) => {
                const priority =
                  getPriorityClasses(
                    recommendation.priority
                  );

                return (
                  <div
                    key={`${recommendation.material_id}-${index}`}
                    className="rounded-xl border border-gray-100 bg-[#F8F9F8] p-4 transition hover:border-[#6FCF97]/40 hover:shadow-sm"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                      {/* ==================================================
                          MATERIAL ICON
                          ================================================== */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2FA084] shadow-sm">
                        <BookOpen size={18} />
                      </div>


                      {/* ==================================================
                          MAIN CONTENT
                          ================================================== */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0">

                            <h4 className="text-sm font-bold text-gray-700">
                              {recommendation.material_title}
                            </h4>

                            <p className="mt-1 text-xs text-gray-400">
                              Material ID:{" "}
                              {recommendation.material_id}
                            </p>

                          </div>

                          <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${priority.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${priority.dot}`}
                            />

                            {recommendation.priority ||
                              "medium"}
                          </span>

                        </div>


                        {/* ==================================================
                            REASON
                            ================================================== */}

                        {recommendation.reason && (
                          <div className="mt-3">

                            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6F5F]">
                              <Target size={14} />
                              Why this material?
                            </div>

                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {recommendation.reason}
                            </p>

                          </div>
                        )}


                        {/* ==================================================
                            ACTION
                            ================================================== */}

                        {recommendation.action && (
                          <div className="mt-3">

                            <div className="flex items-center gap-2 text-xs font-semibold text-[#1F6F5F]">
                              <Lightbulb size={14} />
                              Recommended action
                            </div>

                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {recommendation.action}
                            </p>

                          </div>
                        )}


                        {/* ==================================================
                            METADATA
                            ================================================== */}

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">

                          {recommendation.suggested_duration_minutes && (
                            <span className="flex items-center gap-1.5">
                              <Clock3 size={13} />
                              {recommendation.suggested_duration_minutes}{" "}
                              minutes
                            </span>
                          )}

                          {recommendation.average_quiz_score !==
                            null &&
                            recommendation.average_quiz_score !==
                              undefined && (
                              <span>
                                Avg. quiz score:{" "}
                                <strong className="font-semibold text-gray-500">
                                  {
                                    recommendation.average_quiz_score
                                  }
                                  %
                                </strong>
                              </span>
                            )}

                          {recommendation.quiz_attempts !==
                            undefined && (
                            <span>
                              Quiz attempts:{" "}
                              <strong className="font-semibold text-gray-500">
                                {
                                  recommendation.quiz_attempts
                                }
                              </strong>
                            </span>
                          )}

                          {recommendation.days_since_activity !==
                            null &&
                            recommendation.days_since_activity !==
                              undefined && (
                              <span>
                                Last activity:{" "}
                                <strong className="font-semibold text-gray-500">
                                  {recommendation.days_since_activity ===
                                  0
                                    ? "Today"
                                    : `${recommendation.days_since_activity} day${
                                        recommendation.days_since_activity ===
                                        1
                                          ? ""
                                          : "s"
                                      } ago`}
                                </strong>
                              </span>
                            )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

    </section>
  );
}

export default AdaptiveInsights;