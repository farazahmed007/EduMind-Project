import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Flame,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const QUESTION_OPTIONS = [5, 10, 15, 20];

const DIFFICULTIES = [
  {
    value: "easy",
    label: "Easy",
    description: "Definitions and direct understanding",
    icon: BookOpen,
    accent: "bg-[#eef9f4] text-[#2fa084]",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Concepts and moderate reasoning",
    icon: Target,
    accent: "bg-[#eef9f4] text-[#278c73]",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Deeper reasoning and application",
    icon: Zap,
    accent: "bg-[#eef9f4] text-[#1f6f5f]",
  },
];

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

export default function Quiz() {
  const { token } = useAuth();

  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  // --------------------------------------------------
  // Quiz settings
  // --------------------------------------------------

  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  // --------------------------------------------------
  // Quiz state
  // --------------------------------------------------

  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // --------------------------------------------------
  // Quiz analytics state
  // --------------------------------------------------

  const quizScoreRef = useRef(0);
  const quizAnalyticsRecordedRef = useRef(false);

  const [quizAnalyticsLoading, setQuizAnalyticsLoading] = useState(false);
  const [quizAnalyticsError, setQuizAnalyticsError] = useState("");

  // --------------------------------------------------
  // Load PDF materials
  // --------------------------------------------------

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      setMaterialsError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/materials/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to load study materials.";

          try {
            const errorData = await response.json();

            if (errorData?.detail) {
              errorMessage = errorData.detail;
            }
          } catch {
            // Keep default error message.
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        const pdfMaterials = Array.isArray(data)
          ? data.filter(
              (material) =>
                String(material.type).toUpperCase() === "PDF"
            )
          : [];

        setMaterials(pdfMaterials);

        if (pdfMaterials.length > 0) {
          setSelectedMaterialId(String(pdfMaterials[0].id));
        }
      } catch (error) {
        console.error("Error loading quiz materials:", error);

        setMaterialsError(
          error.message ||
            "Something went wrong while loading materials."
        );
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMaterials();
  }, [token]);

  // --------------------------------------------------
  // Selected material
  // --------------------------------------------------

  const selectedMaterial = materials.find(
    (material) =>
      String(material.id) === String(selectedMaterialId)
  );

  // --------------------------------------------------
  // Current question
  // --------------------------------------------------

  const currentQuestion =
    quiz?.questions?.[currentQuestionIndex] || null;

  // --------------------------------------------------
  // Reset active quiz
  // --------------------------------------------------

  const resetQuizState = () => {
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setSubmitted(false);
    setScore(0);
    setCompleted(false);
    setQuizError("");
    setQuizAnalyticsLoading(false);
    setQuizAnalyticsError("");

    quizScoreRef.current = 0;
    quizAnalyticsRecordedRef.current = false;
  };

  // --------------------------------------------------
  // Record completed quiz analytics
  // --------------------------------------------------

  const recordQuizAnalytics = async () => {
    if (
      quizAnalyticsRecordedRef.current ||
      !selectedMaterialId ||
      !quiz?.questions?.length
    ) {
      return true;
    }

    if (!token) {
      setQuizAnalyticsError(
        "Your session has expired. Please log in again."
      );

      return false;
    }

    setQuizAnalyticsLoading(true);
    setQuizAnalyticsError("");

    try {
      const finalScore = quizScoreRef.current;
      const totalQuestions = quiz.questions.length;

      const response = await fetch(
        `${API_BASE_URL}/api/analytics/quiz-attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            material_id: Number(selectedMaterialId),
            score: finalScore,
            total: totalQuestions,
            difficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to record quiz analytics.";

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default error.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log("Quiz analytics recorded successfully:", data);

      quizAnalyticsRecordedRef.current = true;

      return true;
    } catch (error) {
      console.error("Error recording quiz analytics:", error);

      setQuizAnalyticsError(
        error.message ||
          "Unable to save your quiz result."
      );

      return false;
    } finally {
      setQuizAnalyticsLoading(false);
    }
  };

  // --------------------------------------------------
  // Generate quiz
  // --------------------------------------------------

  const handleGenerateQuiz = async () => {
    if (!selectedMaterialId || quizLoading) {
      return;
    }

    if (!token) {
      setQuizError(
        "Your session has expired. Please log in again."
      );

      return;
    }

    setQuizLoading(true);
    setQuizError("");
    setQuizAnalyticsError("");

    resetQuizState();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            num_questions: numQuestions,
            difficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to generate quiz.";

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default error.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (
        !data.questions ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error("The server returned an empty quiz.");
      }

      setQuiz(data);
    } catch (error) {
      console.error("Error generating quiz:", error);

      setQuizError(
        error.message ||
          "Something went wrong while generating the quiz."
      );
    } finally {
      setQuizLoading(false);
    }
  };

  // --------------------------------------------------
  // Select answer
  // --------------------------------------------------

  const handleSelectAnswer = (answer) => {
    if (submitted || !currentQuestion) {
      return;
    }

    setSelectedAnswer(answer);
  };

  // --------------------------------------------------
  // Submit answer
  // --------------------------------------------------

  const handleSubmitAnswer = () => {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      submitted
    ) {
      return;
    }

    const isCorrect =
      selectedAnswer === currentQuestion.correct_answer;

    if (isCorrect) {
      const nextScore = quizScoreRef.current + 1;

      quizScoreRef.current = nextScore;
      setScore(nextScore);
    }

    setSubmitted(true);
  };

  // --------------------------------------------------
  // Next question / finish quiz
  // --------------------------------------------------

  const handleNextQuestion = async () => {
    if (
      !quiz?.questions ||
      quizAnalyticsLoading
    ) {
      return;
    }

    const isLastQuestion =
      currentQuestionIndex >= quiz.questions.length - 1;

    if (isLastQuestion) {
      const analyticsSaved =
        await recordQuizAnalytics();

      if (!analyticsSaved) {
        return;
      }

      setCompleted(true);
      return;
    }

    setCurrentQuestionIndex(
      (previousIndex) => previousIndex + 1
    );

    setSelectedAnswer("");
    setSubmitted(false);
  };

  // --------------------------------------------------
  // Retry quiz
  // --------------------------------------------------

  const handleRetryQuiz = () => {
    handleGenerateQuiz();
  };

  // --------------------------------------------------
  // Done
  // --------------------------------------------------

  const handleDone = () => {
    resetQuizState();
  };

  // --------------------------------------------------
  // Change material
  // --------------------------------------------------

  const handleMaterialChange = (event) => {
    const newMaterialId = event.target.value;

    setSelectedMaterialId(newMaterialId);
    resetQuizState();
  };

  // --------------------------------------------------
  // Loading materials
  // --------------------------------------------------

  if (materialsLoading) {
    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            className="overflow-hidden rounded-[24px] border border-[#dfeae5] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.05)]"
          >
            <div className="relative overflow-hidden px-6 py-16 text-center sm:px-10">
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              </div>

              <h2 className="mt-6 text-lg font-bold tracking-tight text-[#263b34]">
                Loading your learning space
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#84928c]">
                Fetching your study materials so EduMind can prepare
                your quiz workspace.
              </p>

              <div className="mx-auto mt-7 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#edf3f0]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#2fa084]" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Materials error
  // --------------------------------------------------

  if (materialsError) {
    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            className="overflow-hidden rounded-[24px] border border-[#f0d8d8] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.05)]"
          >
            <div className="px-6 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#c96363]">
                <AlertCircle size={27} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#3c4541]">
                Unable to load study materials
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#89938f]">
                {materialsError}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // No PDFs
  // --------------------------------------------------

  if (materials.length === 0) {
    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            className="relative overflow-hidden rounded-[28px] border border-[#dfeae5] bg-white shadow-[0_10px_35px_rgba(23,33,30,0.05)]"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-[#cdeee1]/20 blur-3xl" />

            <div className="relative px-6 py-14 text-center sm:px-10 sm:py-16">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                <FileText size={34} strokeWidth={1.8} />
              </div>

              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[#dceee6] bg-[#f5faf7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5f7d72]">
                <Sparkles size={12} className="text-[#2fa084]" />
                Quiz workspace
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#263b34] sm:text-3xl">
                Your quiz library is waiting
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#84918c]">
                Upload a PDF to your Learning Library and EduMind
                will turn it into an interactive quiz.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Completed quiz
  // --------------------------------------------------

  if (completed && quiz) {
    const totalQuestions = quiz.questions.length;

    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    const resultMessage =
      percentage >= 90
        ? "Excellent work. You have a strong grasp of this material."
        : percentage >= 70
        ? "Great progress. A little more practice can make this even stronger."
        : percentage >= 50
        ? "You’re building understanding. Review the missed concepts and try again."
        : "This is a good starting point. Review the material and give it another attempt.";

    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dceee6] bg-white px-3 py-1.5 shadow-sm">
                  <CheckCircle2
                    size={13}
                    className="text-[#2fa084]"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#628078]">
                    Assessment complete
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#263b34] sm:text-3xl">
                  Quiz Complete
                </h1>

                <p className="mt-1.5 max-w-xl truncate text-sm font-medium text-[#84918c]">
                  {selectedMaterial?.title}
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dfeae5] bg-white px-3.5 py-2.5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9aa6a1]">
                  Difficulty
                </span>
                <span className="rounded-lg bg-[#e8f6f0] px-2 py-1 text-xs font-bold capitalize text-[#1f6f5f]">
                  {difficulty}
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-[#dfeae5] bg-white shadow-[0_12px_40px_rgba(23,33,30,0.06)]">
              <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#6fcf97]/12 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-[#cdeee1]/20 blur-3xl" />

              <div className="relative px-6 py-10 sm:px-10 sm:py-12">
                <div className="mx-auto max-w-xl text-center">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-[#edf8f3] bg-[#e8f6f0] text-[#1f6f5f]">
                    {percentage >= 70 ? (
                      <Trophy size={40} strokeWidth={1.8} />
                    ) : (
                      <CheckCircle2 size={40} strokeWidth={1.8} />
                    )}

                    <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                      <Sparkles size={13} />
                    </div>
                  </div>

                  <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa7a2]">
                    Your score
                  </p>

                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-6xl font-bold tracking-[-0.06em] text-[#176b5b]">
                      {score}
                    </span>

                    <span className="text-2xl font-semibold text-[#a2ada8]">
                      / {totalQuestions}
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f3faf7] px-3.5 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#2fa084]" />
                    <span className="text-sm font-bold text-[#2f7665]">
                      {percentage}%
                    </span>
                  </div>

                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#7d8b85]">
                    {resultMessage}
                  </p>

                  <div className="mx-auto mt-8 max-w-md">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em]">
                      <span className="text-[#a0aba6]">
                        Performance
                      </span>

                      <span className="text-[#2fa084]">
                        {score} correct
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2ef]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${percentage}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full bg-[#2fa084]"
                      />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#e5ece9] bg-[#fafcfb] px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aba6]">
                        Correct
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#2fa084]">
                        {score}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#e5ece9] bg-[#fafcfb] px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0aba6]">
                        Reviewed
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#53635d]">
                        {totalQuestions}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      onClick={handleRetryQuiz}
                      disabled={
                        quizLoading ||
                        quizAnalyticsLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_8px_22px_rgba(47,160,132,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {quizLoading ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <RotateCcw size={17} />
                      )}

                      {quizLoading
                        ? "Generating..."
                        : "Retry Quiz"}
                    </button>

                    <button
                      onClick={handleDone}
                      disabled={
                        quizLoading ||
                        quizAnalyticsLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-5 py-3 text-sm font-semibold text-[#53635d] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a9dfcc] hover:bg-[#f7fbf9] hover:text-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <ArrowLeft size={16} />
                      Back to Quiz Setup
                    </button>
                  </div>

                  {quizAnalyticsError && (
                    <div className="mx-auto mt-6 flex max-w-lg items-start gap-3 rounded-2xl border border-[#f0d8d8] bg-[#fff7f7] px-4 py-3 text-left">
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-[#c96363]"
                      />

                      <div>
                        <p className="text-sm font-semibold text-[#a85b5b]">
                          Your result could not be saved.
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#a86d6d]">
                          {quizAnalyticsError}
                        </p>

                        <p className="mt-1 text-[11px] text-[#b57b7b]">
                          Click the result button again to retry.
                        </p>
                      </div>
                    </div>
                  )}

                  {quizAnalyticsRecordedRef.current && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f1faf6] px-3 py-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#2fa084]"
                      />

                      <span className="text-xs font-semibold text-[#4d786b]">
                        Result saved to Learning Analytics
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Active quiz
  // --------------------------------------------------

  if (quiz && currentQuestion) {
    const totalQuestions = quiz.questions.length;

    const questionNumber = currentQuestionIndex + 1;

    const progressPercentage = Math.round(
      (questionNumber / totalQuestions) * 100
    );

    const isCorrect =
      selectedAnswer ===
      currentQuestion.correct_answer;

    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
          >
            {/* Quiz top bar */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                    <ClipboardCheck
                      size={17}
                      strokeWidth={2.2}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1f6f5f]">
                      EduMind Quiz
                    </p>

                    <p className="max-w-[250px] truncate text-[10px] font-medium text-[#8a9792] sm:max-w-md">
                      {selectedMaterial?.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-[#dfeae5] bg-white px-3 py-2 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9ca8a3]">
                  Progress
                </p>

                <p className="mt-0.5 text-xs font-bold text-[#53635d]">
                  {questionNumber}{" "}
                  <span className="font-medium text-[#a0aba6]">
                    / {totalQuestions}
                  </span>
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#89968f]">
                  Question {questionNumber} of {totalQuestions}
                </span>

                <span className="text-[10px] font-bold text-[#2fa084]">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[#e6eeea]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progressPercentage}%`,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-[#2fa084]"
                />
              </div>
            </div>

            {/* Main quiz card */}
            <div className="overflow-hidden rounded-[26px] border border-[#dfeae5] bg-white shadow-[0_10px_35px_rgba(23,33,30,0.055)]">
              <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dceee6] bg-[#f5faf7] px-3 py-1.5 text-[10px] font-bold text-[#52766a]">
                      <Target
                        size={12}
                        className="text-[#2fa084]"
                      />
                      {difficulty.charAt(0).toUpperCase() +
                        difficulty.slice(1)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e7ece9] bg-[#fafcfb] px-3 py-1.5 text-[10px] font-semibold text-[#89958f]">
                      <FileText size={12} />
                      Document grounded
                    </span>
                  </div>

                  <span className="hidden text-[10px] font-semibold text-[#a0aba6] sm:block">
                    Take your time and reason it out.
                  </span>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-8">
                {/* Question */}
                <div className="relative overflow-hidden rounded-[22px] border border-[#e1ebe6] bg-gradient-to-br from-[#f8fbfa] via-white to-[#f1faf6] px-5 py-6 sm:px-7 sm:py-7">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#6fcf97]/10 blur-2xl" />

                  <div className="relative">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f6f0] text-[10px] font-bold text-[#2fa084]">
                        {questionNumber}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b9a93]">
                        Question
                      </span>
                    </div>

                    <h2 className="text-[18px] font-bold leading-8 tracking-[-0.015em] text-[#263b34] sm:text-[21px] sm:leading-9">
                      {currentQuestion.question}
                    </h2>
                  </div>
                </div>

                {/* Options */}
                <div className="mt-6 space-y-3">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6a1]">
                    Choose your answer
                  </p>

                  {currentQuestion.options.map(
                    (option, index) => {
                      const optionLetter =
                        String.fromCharCode(65 + index);

                      const isSelected =
                        selectedAnswer === option;

                      const isCorrectOption =
                        submitted &&
                        option ===
                          currentQuestion.correct_answer;

                      const isWrongSelected =
                        submitted &&
                        isSelected &&
                        !isCorrect;

                      let borderClass =
                        "border-[#e1e9e5] bg-white hover:-translate-y-0.5 hover:border-[#a9dfcc] hover:bg-[#f8fcfa] hover:shadow-sm";

                      let letterClass =
                        "bg-[#f1f4f2] text-[#71817b]";

                      if (!submitted && isSelected) {
                        borderClass =
                          "border-[#2fa084] bg-[#f3faf7] ring-4 ring-[#2fa084]/8 shadow-sm";

                        letterClass =
                          "bg-[#2fa084] text-white";
                      }

                      if (isCorrectOption) {
                        borderClass =
                          "border-[#9ed6bd] bg-[#f1faf6] shadow-sm";

                        letterClass =
                          "bg-[#2fa084] text-white";
                      }

                      if (isWrongSelected) {
                        borderClass =
                          "border-[#eab8b8] bg-[#fff7f7] shadow-sm";

                        letterClass =
                          "bg-[#d66c6c] text-white";
                      }

                      return (
                        <motion.button
                          key={index}
                          type="button"
                          onClick={() =>
                            handleSelectAnswer(option)
                          }
                          disabled={submitted}
                          whileHover={
                            !submitted
                              ? { scale: 1.005 }
                              : undefined
                          }
                          whileTap={
                            !submitted
                              ? { scale: 0.995 }
                              : undefined
                          }
                          className={`group flex w-full items-start gap-3.5 rounded-2xl border px-4 py-4 text-left transition-all duration-200 sm:px-5 ${borderClass} ${
                            submitted
                              ? "cursor-default"
                              : "cursor-pointer"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${letterClass}`}
                          >
                            {isCorrectOption ? (
                              <Check
                                size={17}
                                strokeWidth={2.5}
                              />
                            ) : isWrongSelected ? (
                              <XCircle size={17} />
                            ) : (
                              optionLetter
                            )}
                          </span>

                          <span
                            className={`pt-1 text-sm font-medium leading-6 ${
                              isCorrectOption
                                ? "text-[#356f60]"
                                : isWrongSelected
                                ? "text-[#8f5656]"
                                : "text-[#53635d]"
                            }`}
                          >
                            {option}
                          </span>

                          {!submitted && isSelected && (
                            <span className="ml-auto mt-1 shrink-0">
                              <CheckCircle2
                                size={17}
                                className="text-[#2fa084]"
                              />
                            </span>
                          )}
                        </motion.button>
                      );
                    }
                  )}
                </div>

                {/* Feedback */}
                <AnimatePresence initial={false}>
                  {submitted && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                        y: -8,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        y: -8,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`mt-5 rounded-[20px] border px-5 py-5 ${
                          isCorrect
                            ? "border-[#cdeee1] bg-[#f2faf7]"
                            : "border-[#efd1d1] bg-[#fff7f7]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isCorrect
                                ? "bg-[#dff3e9] text-[#2fa084]"
                                : "bg-[#fdeaea] text-[#cf6868]"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 size={19} />
                            ) : (
                              <XCircle size={19} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-bold ${
                                isCorrect
                                  ? "text-[#287864]"
                                  : "text-[#a65b5b]"
                              }`}
                            >
                              {isCorrect
                                ? "Correct answer"
                                : "Not quite this time"}
                            </p>

                            {!isCorrect && (
                              <p className="mt-1.5 text-sm leading-6 text-[#6f7773]">
                                <span className="font-semibold text-[#53635d]">
                                  Correct answer:
                                </span>{" "}
                                {currentQuestion.correct_answer}
                              </p>
                            )}

                            <div
                              className={`mt-3 border-t pt-3 ${
                                isCorrect
                                  ? "border-[#dceee6]"
                                  : "border-[#efdcdc]"
                              }`}
                            >
                              <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#9aa6a1]">
                                Explanation
                              </p>

                              <p className="mt-1.5 text-sm leading-6 text-[#65716c]">
                                {currentQuestion.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom actions */}
                <div className="mt-7 flex flex-col-reverse gap-4 border-t border-[#edf1ef] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9aa6a1]">
                    <Flame
                      size={13}
                      className="text-[#2fa084]"
                    />

                    {quizAnalyticsLoading
                      ? "Saving your quiz result..."
                      : submitted
                      ? "Review the explanation before continuing."
                      : "Select one answer to continue."}
                  </div>

                  {!submitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      <CheckCircle2 size={17} />
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      disabled={quizAnalyticsLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {quizAnalyticsLoading ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Saving Result...
                        </>
                      ) : (
                        <>
                          {questionNumber === totalQuestions
                            ? "See Results"
                            : "Next Question"}

                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {quizAnalyticsError && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f0d8d8] bg-[#fff7f7] px-4 py-3">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-[#c96363]"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#a85b5b]">
                        Your quiz result could not be saved.
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#a86d6d]">
                        {quizAnalyticsError}
                      </p>

                      <p className="mt-1 text-[11px] text-[#b57b7b]">
                        Click the result button again to retry.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Quiz setup
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#f4f7f6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          {/* Header */}
          <section className="relative mb-5 overflow-hidden rounded-[26px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#f1faf6] px-5 py-6 shadow-[0_8px_30px_rgba(23,33,30,0.045)] sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#cdeee1]/25 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                  <ClipboardCheck
                    size={26}
                    strokeWidth={1.9}
                  />

                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                    <Sparkles size={9} />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82968e]">
                      Learning workspace
                    </span>

                    <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                    <span className="text-[10px] font-semibold text-[#2fa084]">
                      AI-powered assessment
                    </span>
                  </div>

                  <h1 className="text-[25px] font-bold tracking-[-0.04em] text-[#176b5b] sm:text-[29px]">
                    Quiz Intelligence
                  </h1>

                  <p className="mt-1 max-w-xl text-sm font-medium leading-5 text-[#7c8b85]">
                    Turn your study material into focused,
                    adaptive practice.
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-[#dfeae5] bg-white/85 px-3.5 py-3 shadow-sm backdrop-blur-sm md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                  <Sparkles size={16} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9aa6a1]">
                    EduMind AI
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                    Learn by testing yourself
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Setup card */}
          <section className="overflow-hidden rounded-[26px] border border-[#dfeae5] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.05)]">
            <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#93a19b]">
                    Configure your session
                  </p>

                  <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#2d4039]">
                    Build your quiz
                  </h2>
                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#f3faf7] text-[#2fa084] sm:flex">
                  <Target size={17} />
                </div>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                {/* Material */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label
                      htmlFor="quiz-material"
                      className="text-sm font-bold text-[#4d5d57]"
                    >
                      Study Material
                    </label>

                    <span className="text-[10px] font-semibold text-[#9aa6a1]">
                      PDF
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="quiz-material"
                      value={selectedMaterialId}
                      onChange={handleMaterialChange}
                      disabled={quizLoading}
                      className="w-full appearance-none rounded-xl border border-[#dfe8e4] bg-[#f8faf9] px-4 py-3.5 pr-11 text-sm font-medium text-[#53635d] outline-none transition-all duration-200 hover:border-[#c9ddd5] focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {materials.map((material) => (
                        <option
                          key={material.id}
                          value={material.id}
                        >
                          {material.title}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#899790]"
                    />
                  </div>

                  {selectedMaterial && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                        <FileText size={12} />
                      </span>

                      <span className="truncate text-[11px] font-medium text-[#89958f]">
                        {selectedMaterial.size}
                      </span>

                      <span className="ml-auto rounded-full bg-[#f3f8f5] px-2 py-1 text-[9px] font-bold text-[#648077]">
                        Ready
                      </span>
                    </div>
                  )}
                </div>

                {/* Number */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label className="text-sm font-bold text-[#4d5d57]">
                      Number of Questions
                    </label>

                    <span className="text-[10px] font-semibold text-[#2fa084]">
                      {numQuestions} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {QUESTION_OPTIONS.map((number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() =>
                          setNumQuestions(number)
                        }
                        disabled={quizLoading}
                        className={`rounded-xl border px-3 py-3.5 text-sm font-bold transition-all duration-200 ${
                          numQuestions === number
                            ? "border-[#2fa084] bg-[#2fa084] text-white shadow-[0_5px_15px_rgba(47,160,132,0.16)]"
                            : "border-[#dfe8e4] bg-white text-[#65736d] hover:-translate-y-0.5 hover:border-[#a9dfcc] hover:bg-[#f7fbf9] hover:text-[#1f6f5f]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mt-7 border-t border-[#edf1ef] pt-7">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold text-[#4d5d57]">
                    Difficulty
                  </label>

                  <span className="text-[10px] font-semibold capitalize text-[#89958f]">
                    {difficulty} mode
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {DIFFICULTIES.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      difficulty === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setDifficulty(item.value)
                        }
                        disabled={quizLoading}
                        className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                          isActive
                            ? "border-[#a9dfcc] bg-[#f4faf7] shadow-sm ring-4 ring-[#2fa084]/5"
                            : "border-[#e1e9e5] bg-white hover:-translate-y-0.5 hover:border-[#c8ddd5] hover:bg-[#fafcfb]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {isActive && (
                          <span className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#e8f6f0]" />
                        )}

                        <div className="relative flex items-start justify-between gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.accent}`}
                          >
                            <Icon size={18} />
                          </div>

                          {isActive && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2fa084] text-white shadow-sm">
                              <Check size={13} strokeWidth={2.7} />
                            </div>
                          )}
                        </div>

                        <div className="relative mt-4">
                          <p
                            className={`text-sm font-bold ${
                              isActive
                                ? "text-[#1f6f5f]"
                                : "text-[#53635d]"
                            }`}
                          >
                            {item.label}
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-[#8a9791]">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate */}
              <div className="mt-7 flex flex-col gap-4 border-t border-[#edf1ef] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-[#2fa084]"
                    />

                    <p className="text-xs font-bold text-[#53635d]">
                      Ready to test your understanding?
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] leading-5 text-[#9aa6a1]">
                    EduMind will generate a fresh quiz from your
                    selected material.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={
                    quizLoading ||
                    !selectedMaterialId
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_8px_22px_rgba(47,160,132,0.2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {quizLoading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Quiz
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {quizError && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f0d8d8] bg-[#fff7f7] px-4 py-3"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-[#c96363]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#a85b5b]">
                      Quiz generation failed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#a86d6d]">
                      {quizError}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Value cards */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <motion.div
              variants={itemVariants}
              className="group rounded-2xl border border-[#dfeae5] bg-white p-5 shadow-[0_5px_20px_rgba(23,33,30,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(23,33,30,0.055)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <FileText size={18} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#53635d]">
                Document Grounded
              </h3>

              <p className="mt-1.5 text-[11px] leading-5 text-[#8b9792]">
                Questions are generated directly from your uploaded
                study material.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group rounded-2xl border border-[#dfeae5] bg-white p-5 shadow-[0_5px_20px_rgba(23,33,30,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(23,33,30,0.055)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <ClipboardCheck size={18} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#53635d]">
                Instant Feedback
              </h3>

              <p className="mt-1.5 text-[11px] leading-5 text-[#8b9792]">
                Review the correct answer and explanation after every
                question.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="group rounded-2xl border border-[#dfeae5] bg-white p-5 shadow-[0_5px_20px_rgba(23,33,30,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(23,33,30,0.055)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Sparkles size={18} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#53635d]">
                Fresh Questions
              </h3>

              <p className="mt-1.5 text-[11px] leading-5 text-[#8b9792]">
                Retry the quiz to generate a new set of questions and
                keep practicing.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}