import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

function LearningOverview() {
  const navigate = useNavigate();
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
            "Failed to load learning overview."
          );
        }

        const data = await response.json();

        setAnalytics(data);
      } catch (error) {
        console.error(
          "Error loading learning overview:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  const overview = analytics?.overview || {};
  const materialPerformance =
    analytics?.material_performance || [];

  const averageScore = Number(
    overview.average_quiz_score || 0
  );

  const performanceMessage = useMemo(() => {
    if (!overview.quizzes_completed) {
      return "Complete a quiz to start tracking your learning performance.";
    }

    if (averageScore >= 85) {
      return "Excellent performance. Keep challenging yourself.";
    }

    if (averageScore >= 70) {
      return "Good progress. Keep revising the areas where you lose marks.";
    }

    return "Focus your revision on materials with lower quiz performance.";
  }, [averageScore, overview.quizzes_completed]);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1F6F5F]">
            Learning Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track your learning activity and material performance.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#2FA084] border-t-transparent" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your learning overview...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      {/* Section Heading */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1F6F5F]">
          Learning Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Track your learning activity and material performance.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Learning Progress */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">

          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <BarChart3 size={22} />
              </div>

              <div>
                <h3 className="font-semibold text-[#1F6F5F]">
                  Learning Progress
                </h3>

                <p className="text-sm text-gray-500">
                  Your quiz performance across materials
                </p>
              </div>
            </div>

            {/* Average Score */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-[#2FA084]">
                <TrendingUp size={16} />

                <span className="text-sm font-semibold">
                  {averageScore}%
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Average score
              </p>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="mt-6 rounded-xl bg-[#EEEEEE] px-4 py-4">
            <p className="text-sm leading-6 text-gray-600">
              {performanceMessage}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Overall quiz performance
              </span>

              <span className="text-sm font-semibold text-[#1F6F5F]">
                {averageScore}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
              <div
                className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, averageScore)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Quick Learning Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-[#F8F9F8] p-4">
              <p className="text-xs font-medium text-gray-400">
                Quiz Attempts
              </p>

              <p className="mt-1 text-xl font-bold text-[#1F6F5F]">
                {overview.quizzes_completed || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-[#F8F9F8] p-4">
              <p className="text-xs font-medium text-gray-400">
                Materials Assessed
              </p>

              <p className="mt-1 text-xl font-bold text-[#1F6F5F]">
                {materialPerformance.length}
              </p>
            </div>
          </div>

          {/* Material Performance Preview */}
          {materialPerformance.length > 0 && (
            <div className="mt-6 space-y-4">
              {materialPerformance
                .slice(0, 3)
                .map((material) => (
                  <div key={material.material_id}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="truncate text-sm font-medium text-gray-700">
                        {material.material_title}
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-[#1F6F5F]">
                        {material.average_score}%
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
                      <div
                        className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              material.average_score
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Empty State */}
          {!materialPerformance.length && (
            <div className="mt-6 rounded-xl bg-[#F8F9F8] px-6 py-10 text-center">
              <BookOpen
                size={30}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm font-medium text-gray-500">
                Complete a quiz to start building your learning progress.
              </p>
            </div>
          )}

        </div>

        {/* Material Performance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <BookOpen size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-[#1F6F5F]">
                Material Performance
              </h3>

              <p className="text-sm text-gray-500">
                Your quiz performance by material
              </p>
            </div>
          </div>

          {/* Materials */}
          <div className="mt-7 space-y-6">
            {materialPerformance.length > 0 ? (
              materialPerformance.map((material) => (
                <div key={material.material_id}>

                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-gray-700">
                      {material.material_title}
                    </span>

                    <span className="shrink-0 text-sm font-semibold text-[#1F6F5F]">
                      {material.average_score}%
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEEEEE]">
                    <div
                      className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            material.average_score
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {material.attempts} quiz attempt
                    {material.attempts === 1 ? "" : "s"}
                  </p>

                </div>
              ))
            ) : (
              <div className="rounded-xl bg-[#F8F9F8] px-5 py-10 text-center">
                <BookOpen
                  size={28}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  Material performance will appear after your first completed quiz.
                </p>
              </div>
            )}
          </div>

          {/* View Analytics */}
          <button
            onClick={() => navigate("/analytics")}
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