import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const API_BASE_URL = "http://127.0.0.1:8000";


function getScoreTone(score) {
  if (score >= 85) {
    return {
      text: "text-[#23775f]",
      bg: "bg-[#e8f6f0]",
      bar: "bg-[#2fa084]",
      label: "Strong",
    };
  }

  if (score >= 70) {
    return {
      text: "text-[#9b6a20]",
      bg: "bg-[#fff5e5]",
      bar: "bg-[#d99a3e]",
      label: "On track",
    };
  }

  return {
    text: "text-[#b65353]",
    bg: "bg-[#fff0f0]",
    bar: "bg-[#d66a6a]",
    label: "Needs focus",
  };
}


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
      return "Your quiz performance is strong. Keep challenging yourself with new topics.";
    }

    if (averageScore >= 70) {
      return "You're making steady progress. Revisit the areas where you lose marks.";
    }

    return "Use your lower-performing materials as a guide for your next revision session.";
  }, [
    averageScore,
    overview.quizzes_completed,
  ]);


  const scoreTone = getScoreTone(averageScore);


  if (loading) {
    return (
      <section className="mt-8">

        <div className="mb-4">
          <div className="h-2.5 w-20 animate-pulse rounded-full bg-[#dfe8e4]" />

          <div className="mt-2 h-6 w-48 animate-pulse rounded-lg bg-[#e5ece9]" />

          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-[#edf2ef]" />
        </div>


        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          <div className="min-h-[420px] animate-pulse rounded-2xl border border-[#e2ebe7] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.04)] xl:col-span-2">
            <div className="flex justify-between">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#edf3f0]" />

                <div>
                  <div className="h-4 w-32 rounded bg-[#e5ece9]" />
                  <div className="mt-2 h-3 w-48 rounded bg-[#edf2ef]" />
                </div>
              </div>

              <div className="h-12 w-16 rounded-xl bg-[#edf3f0]" />
            </div>

            <div className="mt-7 h-20 rounded-2xl bg-[#f3f6f4]" />

            <div className="mt-7 h-3 rounded-full bg-[#edf2ef]" />
            <div className="mt-3 h-3 rounded-full bg-[#edf2ef]" />

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="h-20 rounded-xl bg-[#f3f6f4]" />
              <div className="h-20 rounded-xl bg-[#f3f6f4]" />
            </div>
          </div>


          <div className="min-h-[420px] animate-pulse rounded-2xl border border-[#e2ebe7] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.04)]">
            <div className="h-4 w-40 rounded bg-[#e5ece9]" />
            <div className="mt-2 h-3 w-52 rounded bg-[#edf2ef]" />

            <div className="mt-8 space-y-7">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="flex justify-between">
                    <div className="h-3 w-28 rounded bg-[#edf2ef]" />
                    <div className="h-3 w-10 rounded bg-[#edf2ef]" />
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-[#edf2ef]" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>
    );
  }


  return (
    <section className="mt-8">

      {/* ================================================= */}
      {/* Section Heading */}
      {/* ================================================= */}

      <div className="mb-4">

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
            Intelligence
          </span>
        </div>

        <h2 className="mt-1.5 text-[21px] font-bold tracking-[-0.02em] text-[#17211e]">
          Learning Overview
        </h2>

        <p className="mt-1 text-sm text-[#71817b]">
          Understand your progress and identify where to focus next.
        </p>

      </div>


      {/* ================================================= */}
      {/* Main Grid */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">


        {/* ================================================= */}
        {/* Learning Progress */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.045)] xl:col-span-2">

          {/* Decorative glow */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#6fcf97]/8 blur-3xl" />


          {/* Header */}

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ee] text-[#2fa084] shadow-sm">
                <BarChart3
                  size={21}
                  strokeWidth={2}
                />
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-[#25322e]">
                  Learning Progress
                </h3>

                <p className="mt-0.5 text-xs text-[#899690]">
                  Your quiz performance across materials
                </p>
              </div>

            </div>


            {/* Average score */}

            <div className="flex items-center gap-3 rounded-xl border border-[#e2ece8] bg-[#f8fbfa] px-3.5 py-2.5">

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${scoreTone.bg} ${scoreTone.text}`}
              >
                <TrendingUp
                  size={15}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa7a2]">
                  Average
                </p>

                <p className={`text-sm font-bold ${scoreTone.text}`}>
                  {averageScore}%
                </p>
              </div>

            </div>

          </div>


          {/* Performance insight */}

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#dceee6] bg-gradient-to-r from-[#f3faf7] to-[#f8fbfa] px-4 py-4">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
                <Target
                  size={16}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#2fa084]">
                  Learning insight
                </p>

                <p className="mt-1 text-xs leading-5 text-[#64736d] sm:text-sm">
                  {performanceMessage}
                </p>
              </div>

            </div>

          </div>


          {/* Overall progress */}

          <div className="relative mt-7">

            <div className="mb-2.5 flex items-center justify-between gap-4">

              <div>
                <p className="text-xs font-semibold text-[#53635d]">
                  Overall quiz performance
                </p>

                <p className="mt-0.5 text-[10px] text-[#9aa7a2]">
                  Based on completed quiz attempts
                </p>
              </div>

              <span className={`text-sm font-bold ${scoreTone.text}`}>
                {averageScore}%
              </span>

            </div>


            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf2ef]">

              <div
                className={`h-full rounded-full ${scoreTone.bar} transition-all duration-700 ease-out`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, averageScore)
                  )}%`,
                }}
              />

            </div>

          </div>


          {/* Quick stats */}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div className="group rounded-xl border border-[#e6eeea] bg-[#f8fbfa] p-4 transition-colors duration-200 hover:border-[#d5e7df] hover:bg-[#f4faf7]">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
                    <CheckCircle2
                      size={15}
                      strokeWidth={2}
                    />
                  </div>

                  <p className="text-[11px] font-semibold text-[#71817b]">
                    Quiz Attempts
                  </p>

                </div>

              </div>

              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#25322e]">
                {overview.quizzes_completed || 0}
              </p>

            </div>


            <div className="group rounded-xl border border-[#e6eeea] bg-[#f8fbfa] p-4 transition-colors duration-200 hover:border-[#d5e7df] hover:bg-[#f4faf7]">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
                  <BookOpen
                    size={15}
                    strokeWidth={2}
                  />
                </div>

                <p className="text-[11px] font-semibold text-[#71817b]">
                  Materials Assessed
                </p>

              </div>

              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#25322e]">
                {materialPerformance.length}
              </p>

            </div>

          </div>


          {/* Material preview */}

          {materialPerformance.length > 0 && (
            <div className="relative mt-7 border-t border-[#edf2ef] pt-6">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <p className="text-xs font-bold text-[#53635d]">
                    Recent material performance
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#9aa7a2]">
                    Your latest assessed materials
                  </p>
                </div>

                <BookOpen
                  size={16}
                  className="text-[#b2c1bb]"
                />

              </div>


              <div className="space-y-4">

                {materialPerformance
                  .slice(0, 3)
                  .map((material) => {
                    const score = Number(
                      material.average_score || 0
                    );

                    const tone = getScoreTone(score);

                    return (
                      <div
                        key={material.material_id}
                        className="group"
                      >

                        <div className="mb-2 flex items-center justify-between gap-4">

                          <span className="min-w-0 truncate text-xs font-semibold text-[#5d6c66] transition-colors group-hover:text-[#1f6f5f]">
                            {material.material_title}
                          </span>

                          <span className={`shrink-0 text-xs font-bold ${tone.text}`}>
                            {score}%
                          </span>

                        </div>


                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#edf2ef]">

                          <div
                            className={`h-full rounded-full ${tone.bar} transition-all duration-500 group-hover:brightness-105`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, score)
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

              </div>

            </div>
          )}


          {/* Empty state */}

          {!materialPerformance.length && (
            <div className="relative mt-7 rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8fbfa] px-6 py-10 text-center">

              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#aab8b2] shadow-sm">
                <BookOpen
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <p className="mt-3 text-xs font-semibold text-[#697873]">
                Your learning progress will appear here.
              </p>

              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-[#9aa7a2]">
                Complete a quiz to start building your performance history.
              </p>

            </div>
          )}

        </div>


        {/* ================================================= */}
        {/* Material Performance */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.045)]">

          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#6fcf97]/8 blur-3xl" />


          {/* Header */}

          <div className="relative flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f5ee] text-[#2fa084] shadow-sm">
              <BookOpen
                size={21}
                strokeWidth={2}
              />
            </div>

            <div>
              <h3 className="text-[15px] font-bold text-[#25322e]">
                Material Performance
              </h3>

              <p className="mt-0.5 text-xs text-[#899690]">
                Performance by material
              </p>
            </div>

          </div>


          {/* Materials */}

          <div className="relative mt-7 space-y-6">

            {materialPerformance.length > 0 ? (

              materialPerformance.map((material) => {

                const score = Number(
                  material.average_score || 0
                );

                const tone = getScoreTone(score);

                return (
                  <div
                    key={material.material_id}
                    className="group"
                  >

                    <div className="mb-2 flex items-center justify-between gap-3">

                      <span className="min-w-0 truncate text-xs font-semibold text-[#596862] transition-colors group-hover:text-[#1f6f5f]">
                        {material.material_title}
                      </span>

                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tone.bg} ${tone.text}`}>
                        {score}%
                      </span>

                    </div>


                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf2ef]">

                      <div
                        className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, score)
                          )}%`,
                        }}
                      />

                    </div>


                    <div className="mt-1.5 flex items-center justify-between">

                      <p className="text-[10px] text-[#a0aba6]">
                        {material.attempts} quiz attempt
                        {material.attempts === 1 ? "" : "s"}
                      </p>

                      <span className={`text-[9px] font-semibold ${tone.text}`}>
                        {tone.label}
                      </span>

                    </div>

                  </div>
                );
              })

            ) : (

              <div className="rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8fbfa] px-5 py-10 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#aab8b2] shadow-sm">
                  <BookOpen
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-[#697873]">
                  No material data yet
                </p>

                <p className="mt-1 text-[10px] leading-5 text-[#9aa7a2]">
                  Complete your first quiz to see material performance.
                </p>

              </div>

            )}

          </div>


          {/* Analytics CTA */}

          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="group relative mt-8 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1f6f5f] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(31,111,95,0.16)] transition-all duration-200 hover:bg-[#19594d] hover:shadow-[0_10px_24px_rgba(31,111,95,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/20"
          >
            <span>
              View Detailed Analytics
            </span>

            <ArrowUpRight
              size={15}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>

        </div>

      </div>

    </section>
  );
}


export default LearningOverview;