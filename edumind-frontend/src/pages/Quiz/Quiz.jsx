import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const QUESTION_OPTIONS = [5, 10, 15, 20];

const DIFFICULTIES = [
  {
    value: "easy",
    label: "Easy",
    description: "Definitions and direct understanding",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Concepts and moderate reasoning",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Deeper reasoning and application",
  },
];

export default function Quiz() {
  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] =
    useState(true);
  const [materialsError, setMaterialsError] =
    useState("");

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  // --------------------------------------------------
  // Quiz settings
  // --------------------------------------------------

  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] =
    useState("medium");

  // --------------------------------------------------
  // Quiz state
  // --------------------------------------------------

  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] =
    useState(false);
  const [quizError, setQuizError] = useState("");

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState("");

  const [submitted, setSubmitted] = useState(false);

  const [score, setScore] = useState(0);

  const [completed, setCompleted] = useState(false);

  // --------------------------------------------------
  // Load PDF materials
  // --------------------------------------------------

  useEffect(() => {
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      setMaterialsError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/materials/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load study materials."
          );
        }

        const data = await response.json();

        const pdfMaterials = Array.isArray(data)
          ? data.filter(
              (material) =>
                String(material.type).toUpperCase() ===
                "PDF"
            )
          : [];

        setMaterials(pdfMaterials);

        if (pdfMaterials.length > 0) {
          setSelectedMaterialId(
            String(pdfMaterials[0].id)
          );
        }
      } catch (error) {
        console.error(
          "Error loading quiz materials:",
          error
        );

        setMaterialsError(
          error.message ||
            "Something went wrong while loading materials."
        );
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // --------------------------------------------------
  // Selected material
  // --------------------------------------------------

  const selectedMaterial = materials.find(
    (material) =>
      String(material.id) ===
      String(selectedMaterialId)
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
  };

  // --------------------------------------------------
  // Generate quiz
  // --------------------------------------------------

  const handleGenerateQuiz = async () => {
    if (!selectedMaterialId || quizLoading) {
      return;
    }

    setQuizLoading(true);
    setQuizError("");

    resetQuizState();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            num_questions: numQuestions,
            difficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to generate quiz.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
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
        throw new Error(
          "The server returned an empty quiz."
        );
      }

      setQuiz(data);
    } catch (error) {
      console.error(
        "Error generating quiz:",
        error
      );

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
      selectedAnswer ===
      currentQuestion.correct_answer;

    if (isCorrect) {
      setScore((previousScore) => previousScore + 1);
    }

    setSubmitted(true);
  };

  // --------------------------------------------------
  // Next question
  // --------------------------------------------------

  const handleNextQuestion = () => {
    if (!quiz?.questions) {
      return;
    }

    const isLastQuestion =
      currentQuestionIndex >=
      quiz.questions.length - 1;

    if (isLastQuestion) {
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
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Loader2
                size={18}
                className="animate-spin text-[#2FA084]"
              />
              Loading your study materials...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Materials error
  // --------------------------------------------------

  if (materialsError) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-3 text-red-600">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-sm font-semibold">
                  Unable to load study materials
                </p>

                <p className="mt-1 text-sm">
                  {materialsError}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // No PDFs
  // --------------------------------------------------

  if (materials.length === 0) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <FileText size={28} />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-gray-700">
              No PDF materials available
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Upload a PDF in your Learning Library before
              generating a quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Completed quiz
  // --------------------------------------------------

  if (completed && quiz) {
    const totalQuestions =
      quiz.questions.length;

    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <ClipboardCheck size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#1F6F5F]">
                  Quiz Complete
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedMaterial?.title}
                </p>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#6FCF97]/20 text-[#1F6F5F]">
                <CheckCircle2 size={40} />
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Your Score
              </p>

              <div className="mt-2 text-5xl font-bold text-[#1F6F5F]">
                {score}
                <span className="text-2xl text-gray-400">
                  {" "}
                  / {totalQuestions}
                </span>
              </div>

              <p className="mt-3 text-lg font-semibold text-gray-700">
                {percentage}%
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                You answered {score} out of{" "}
                {totalQuestions} questions correctly.
              </p>

              {/* Progress */}
              <div className="mx-auto mt-7 max-w-md">
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#2FA084] transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleRetryQuiz}
                  disabled={quizLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60"
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
                  disabled={quizLoading}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Done
                </button>
              </div>

              {quizError && (
                <div className="mx-auto mt-6 flex max-w-lg items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-600">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{quizError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Active quiz
  // --------------------------------------------------

  if (quiz && currentQuestion) {
    const totalQuestions =
      quiz.questions.length;

    const questionNumber =
      currentQuestionIndex + 1;

    const progressPercentage = Math.round(
      (questionNumber / totalQuestions) * 100
    );

    const isCorrect =
      selectedAnswer ===
      currentQuestion.correct_answer;

    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Quiz Header */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck
                      size={19}
                      className="text-[#2FA084]"
                    />

                    <span className="text-sm font-semibold text-[#1F6F5F]">
                      EduMind Quiz
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedMaterial?.title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Question {questionNumber} of{" "}
                    {totalQuestions}
                  </span>

                  <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-xs font-semibold text-[#1F6F5F]">
                    {progressPercentage}%
                  </span>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#2FA084] transition-all duration-300"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Area */}
            <div className="px-6 py-7">

              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F8F9F8] px-3 py-1.5 text-xs font-semibold text-gray-500">
                  Difficulty:{" "}
                  <span className="text-[#1F6F5F]">
                    {difficulty
                      .charAt(0)
                      .toUpperCase() +
                      difficulty.slice(1)}
                  </span>
                </span>
              </div>

              <div className="rounded-2xl bg-[#F8F9F8] px-6 py-6">
                <h2 className="text-lg font-semibold leading-8 text-gray-800 sm:text-xl">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="mt-6 space-y-3">
                {currentQuestion.options.map(
                  (option, index) => {
                    const optionLetter =
                      String.fromCharCode(
                        65 + index
                      );

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

                    let optionClasses =
                      "border-gray-200 bg-white hover:border-[#6FCF97] hover:bg-[#6FCF97]/5";

                    if (!submitted && isSelected) {
                      optionClasses =
                        "border-[#2FA084] bg-[#2FA084]/5 ring-2 ring-[#2FA084]/10";
                    }

                    if (isCorrectOption) {
                      optionClasses =
                        "border-green-300 bg-green-50";
                    }

                    if (isWrongSelected) {
                      optionClasses =
                        "border-red-300 bg-red-50";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          handleSelectAnswer(
                            option
                          )
                        }
                        disabled={submitted}
                        className={`flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition ${optionClasses} ${
                          submitted
                            ? "cursor-default"
                            : "cursor-pointer"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            isCorrectOption
                              ? "bg-green-500 text-white"
                              : isWrongSelected
                              ? "bg-red-500 text-white"
                              : isSelected
                              ? "bg-[#2FA084] text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isCorrectOption ? (
                            <CheckCircle2
                              size={18}
                            />
                          ) : isWrongSelected ? (
                            <XCircle size={18} />
                          ) : (
                            optionLetter
                          )}
                        </div>

                        <span className="pt-1 text-sm leading-6 text-gray-700">
                          {option}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Feedback */}
              {submitted && (
                <div
                  className={`mt-6 rounded-2xl border p-5 ${
                    isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2
                        size={21}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                    ) : (
                      <XCircle
                        size={21}
                        className="mt-0.5 shrink-0 text-red-500"
                      />
                    )}

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {isCorrect
                          ? "Correct!"
                          : "Not quite."}
                      </p>

                      {!isCorrect && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">
                            Correct answer:
                          </span>{" "}
                          {
                            currentQuestion.correct_answer
                          }
                        </p>
                      )}

                      <div className="mt-3 border-t border-black/5 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Explanation
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {
                            currentQuestion.explanation
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-400">
                  {submitted
                    ? "Review the explanation before continuing."
                    : "Select one answer to continue."}
                </div>

                {!submitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={17} />
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
                  >
                    {questionNumber ===
                    totalQuestions
                      ? "See Results"
                      : "Next Question"}

                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Quiz setup
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <ClipboardCheck size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#1F6F5F]">
                Quiz Intelligence
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Test your understanding of your study material.
              </p>
            </div>
          </div>
        </div>

        {/* Setup */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Material */}
            <div>
              <label
                htmlFor="quiz-material"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Study Material
              </label>

              <select
                id="quiz-material"
                value={selectedMaterialId}
                onChange={handleMaterialChange}
                disabled={quizLoading}
                className="w-full rounded-xl border border-gray-200 bg-[#F8F9F8] px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#6FCF97] focus:ring-2 focus:ring-[#6FCF97]/20 disabled:cursor-not-allowed disabled:opacity-60"
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

              {selectedMaterial && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <FileText size={14} />
                  {selectedMaterial.size}
                </div>
              )}
            </div>

            {/* Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Number of Questions
              </label>

              <div className="grid grid-cols-4 gap-2">
                {QUESTION_OPTIONS.map((number) => (
                  <button
                    key={number}
                    onClick={() =>
                      setNumQuestions(number)
                    }
                    disabled={quizLoading}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      numQuestions === number
                        ? "border-[#2FA084] bg-[#2FA084] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Difficulty
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.value}
                  onClick={() =>
                    setDifficulty(item.value)
                  }
                  disabled={quizLoading}
                  className={`rounded-xl border p-4 text-left transition ${
                    difficulty === item.value
                      ? "border-[#2FA084] bg-[#2FA084]/5 ring-2 ring-[#2FA084]/10"
                      : "border-gray-200 bg-white hover:border-[#6FCF97]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        difficulty === item.value
                          ? "text-[#1F6F5F]"
                          : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>

                    {difficulty === item.value && (
                      <CheckCircle2
                        size={17}
                        className="text-[#2FA084]"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <div className="mt-7 border-t border-gray-100 pt-6">
            <button
              onClick={handleGenerateQuiz}
              disabled={
                quizLoading ||
                !selectedMaterialId
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-gray-400">
              EduMind will generate a fresh quiz from the
              selected study material.
            </p>
          </div>

          {/* Error */}
          {quizError && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{quizError}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
              <FileText size={19} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-700">
              Document Grounded
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-400">
              Questions are generated from your uploaded
              study material.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
              <ClipboardCheck size={19} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-700">
              Instant Feedback
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-400">
              See the correct answer and explanation after
              every question.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Sparkles size={19} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-700">
              Fresh Questions
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-400">
              Retry the quiz to generate a new set of
              questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}