import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import {
  ArrowLeft,
  FileText,
  Bot,
  Sparkles,
  ClipboardCheck,
  Layers3,
  Clock3,
  HardDrive,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  User,
  Trophy,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function MaterialDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // AI Summary states
  // --------------------------------------------------

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // --------------------------------------------------
  // AI Tutor states
  // --------------------------------------------------

  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState("");

  // --------------------------------------------------
  // Quiz states
  // --------------------------------------------------

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState("");
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");

  // --------------------------------------------------
  // Flashcard states
  // --------------------------------------------------

  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardCurrentIndex, setFlashcardCurrentIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [flashcardDifficulty, setFlashcardDifficulty] = useState("medium");

  // --------------------------------------------------
  // Load material information
  // --------------------------------------------------

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/materials/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch materials");
        }

        const materials = await response.json();

        const selectedMaterial = materials.find(
          (item) => String(item.id) === String(id)
        );

        setMaterial(selectedMaterial || null);
      } catch (error) {
        console.error("Error loading material:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  // --------------------------------------------------
  // Generate AI Summary
  // --------------------------------------------------

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${id}/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to generate summary.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.summary) {
        throw new Error(
          "The server returned an empty summary."
        );
      }

      setSummary(data.summary);
    } catch (error) {
      console.error(
        "Error generating summary:",
        error
      );

      setSummaryError(
        error.message ||
          "Something went wrong while generating the summary."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  // --------------------------------------------------
  // Open AI Tutor
  // --------------------------------------------------

  const handleOpenTutor = () => {
    setTutorOpen(true);
    setTutorError("");
  };

  // --------------------------------------------------
  // Close AI Tutor
  // --------------------------------------------------

  const handleCloseTutor = () => {
    setTutorOpen(false);
    setTutorError("");
  };

  // --------------------------------------------------
  // Clear AI Tutor conversation
  // --------------------------------------------------

  const handleClearTutor = () => {
    setTutorMessages([]);
    setTutorQuestion("");
    setTutorError("");
  };

  // --------------------------------------------------
  // Ask AI Tutor
  // --------------------------------------------------

  const handleAskTutor = async () => {
    const question = tutorQuestion.trim();

    if (!question || tutorLoading) {
      return;
    }

    setTutorError("");

    // Save previous conversation before adding
    // the current question.
    const conversationHistory =
      tutorMessages.slice(-10);

    // Optimistically add user message.
    setTutorMessages((previousMessages) => [
      ...previousMessages,
      {
        role: "user",
        content: question,
      },
    ]);

    setTutorQuestion("");
    setTutorLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${id}/tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question,
            conversation_history:
              conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to get a response from AI Tutor.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.answer) {
        throw new Error(
          "The server returned an empty AI response."
        );
      }

      setTutorMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error(
        "Error asking AI Tutor:",
        error
      );

      // Remove optimistic user message if request fails.
      setTutorMessages((previousMessages) => {
        if (
          previousMessages.length > 0 &&
          previousMessages[
            previousMessages.length - 1
          ].role === "user" &&
          previousMessages[
            previousMessages.length - 1
          ].content === question
        ) {
          return previousMessages.slice(
            0,
            previousMessages.length - 1
          );
        }

        return previousMessages;
      });

      setTutorError(
        error.message ||
          "Something went wrong while contacting AI Tutor."
      );
    } finally {
      setTutorLoading(false);
    }
  };

  // --------------------------------------------------
  // Submit question using Enter
  // --------------------------------------------------

  const handleTutorKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleAskTutor();
    }
  };

  // --------------------------------------------------
  // Reset Quiz State
  // --------------------------------------------------

  const resetQuizState = () => {
    setQuizQuestions([]);
    setQuizCurrentIndex(0);
    setQuizSelectedOption("");
    setQuizAnswerSubmitted(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setQuizError("");
  };

  // --------------------------------------------------
  // Close Quiz
  // --------------------------------------------------

  const handleCloseQuiz = () => {
    setQuizOpen(false);
    setQuizError("");
  };

  // --------------------------------------------------
  // Generate Quiz
  // --------------------------------------------------

  const handleGenerateQuiz = async () => {
    setQuizOpen(true);
    setQuizLoading(true);
    setQuizError("");

    resetQuizState();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${id}/quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            num_questions: 5,
            difficulty: quizDifficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to generate quiz.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default message.
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

      setQuizQuestions(data.questions);
      setQuizCurrentIndex(0);
      setQuizSelectedOption("");
      setQuizAnswerSubmitted(false);
      setQuizScore(0);
      setQuizCompleted(false);
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
  // Select Quiz Option
  // --------------------------------------------------

  const handleSelectQuizOption = (option) => {
    if (quizAnswerSubmitted) {
      return;
    }

    setQuizSelectedOption(option);
  };

  // --------------------------------------------------
  // Submit Quiz Answer
  // --------------------------------------------------

  const handleSubmitQuizAnswer = () => {
    if (
      !quizSelectedOption ||
      quizAnswerSubmitted
    ) {
      return;
    }

    const currentQuestion =
      quizQuestions[quizCurrentIndex];

    if (!currentQuestion) {
      return;
    }

    if (
      quizSelectedOption ===
      currentQuestion.correct_answer
    ) {
      setQuizScore((previousScore) => previousScore + 1);
    }

    setQuizAnswerSubmitted(true);
  };

  // --------------------------------------------------
  // Next Quiz Question
  // --------------------------------------------------

  const handleNextQuizQuestion = () => {
    const isLastQuestion =
      quizCurrentIndex >=
      quizQuestions.length - 1;

    if (isLastQuestion) {
      setQuizCompleted(true);
      return;
    }

    setQuizCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );

    setQuizSelectedOption("");
    setQuizAnswerSubmitted(false);
  };

  // --------------------------------------------------
  // Retry Quiz
  // --------------------------------------------------

  const handleRetryQuiz = () => {
    handleGenerateQuiz();
  };

  // --------------------------------------------------
  // Reset Flashcard State
  // --------------------------------------------------

  const resetFlashcardState = () => {
    setFlashcards([]);
    setFlashcardCurrentIndex(0);
    setFlashcardRevealed(false);
    setFlashcardsError("");
  };

  // --------------------------------------------------
  // Close Flashcards
  // --------------------------------------------------

  const handleCloseFlashcards = () => {
    setFlashcardsOpen(false);
    setFlashcardsError("");
  };

  // --------------------------------------------------
  // Generate Flashcards
  // --------------------------------------------------

  const handleGenerateFlashcards = async () => {
    setFlashcardsOpen(true);
    setFlashcardsLoading(true);
    setFlashcardsError("");
    resetFlashcardState();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${id}/flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            num_cards: 5,
            difficulty: flashcardDifficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to generate flashcards.";

        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (
        !data.flashcards ||
        !Array.isArray(data.flashcards) ||
        data.flashcards.length === 0
      ) {
        throw new Error(
          "The server returned an empty flashcard set."
        );
      }

      setFlashcards(data.flashcards);
      setFlashcardCurrentIndex(0);
      setFlashcardRevealed(false);
    } catch (error) {
      console.error(
        "Error generating flashcards:",
        error
      );

      setFlashcardsError(
        error.message ||
          "Something went wrong while generating flashcards."
      );
    } finally {
      setFlashcardsLoading(false);
    }
  };

  // --------------------------------------------------
  // Flashcard Navigation
  // --------------------------------------------------

  const handleNextFlashcard = () => {
    if (flashcardCurrentIndex >= flashcards.length - 1) {
      return;
    }

    setFlashcardCurrentIndex((previousIndex) => previousIndex + 1);
    setFlashcardRevealed(false);
  };

  const handlePreviousFlashcard = () => {
    if (flashcardCurrentIndex <= 0) {
      return;
    }

    setFlashcardCurrentIndex((previousIndex) => previousIndex - 1);
    setFlashcardRevealed(false);
  };

  const handleRetryFlashcards = () => {
    handleGenerateFlashcards();
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading material...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Material not found
  // --------------------------------------------------

  if (!material) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <button
            onClick={() => navigate("/library")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1F6F5F]"
          >
            <ArrowLeft size={18} />
            Back to Library
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <h2 className="text-lg font-semibold text-gray-700">
              Material not found
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              This material may have been deleted or is no
              longer available.
            </p>

          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // File URL
  // --------------------------------------------------

  const fileUrl =
    `${API_BASE_URL}/api/materials/${material.id}/file`;

  const isPDF = material.type === "PDF";

  // --------------------------------------------------
  // Current Quiz Question
  // --------------------------------------------------

  const currentQuizQuestion =
    quizQuestions[quizCurrentIndex] || null;

  const quizProgress =
    quizQuestions.length > 0
      ? (
          ((quizCurrentIndex + 1) /
            quizQuestions.length) *
          100
        )
      : 0;

  // --------------------------------------------------
  // Current Flashcard
  // --------------------------------------------------

  const currentFlashcard =
    flashcards[flashcardCurrentIndex] || null;

  const flashcardProgress =
    flashcards.length > 0
      ? ((flashcardCurrentIndex + 1) / flashcards.length) * 100
      : 0;

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <button
          onClick={() => navigate("/library")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1F6F5F]"
        >
          <ArrowLeft size={18} />
          Back to Library
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <FileText size={28} />
            </div>

            <div className="min-w-0">

              <h1 className="truncate text-2xl font-bold text-[#1F6F5F]">
                {material.title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {material.type} • {material.size} • {material.time}
              </p>

            </div>

          </div>

          {/* File actions */}
          <div className="flex flex-wrap gap-2">

            <a
              href={fileUrl}
              download={material.title}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
            >
              <Download size={17} />
              Download
            </a>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
            >
              <ExternalLink size={17} />
              Open in New Tab
            </a>

          </div>

        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* DOCUMENT VIEWER */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Viewer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">

              <div className="flex items-center gap-2">

                <FileText
                  size={18}
                  className="text-[#2FA084]"
                />

                <span className="text-sm font-semibold text-gray-700">
                  Document Viewer
                </span>

              </div>

              <span className="text-xs text-gray-400">
                {material.type}
              </span>

            </div>

            {/* Actual PDF */}
            {isPDF ? (

              <div className="h-[calc(100vh-260px)] min-h-[650px] bg-gray-200">

                <iframe
                  src={fileUrl}
                  title={material.title}
                  className="h-full w-full border-0"
                />

              </div>

            ) : (

              <div className="flex min-h-[650px] items-center justify-center bg-gray-100 p-8">

                <div className="max-w-md text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">

                    <FileText
                      size={30}
                      className="text-gray-500"
                    />

                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-gray-700">
                    Preview not available
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Browser preview is currently available for PDF
                    files. You can download this material to open it
                    with the appropriate application.
                  </p>

                  <a
                    href={fileUrl}
                    download={material.title}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
                  >
                    <Download size={17} />
                    Download File
                  </a>

                </div>

              </div>

            )}

          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-5">

            {/* Material Information */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold text-[#1F6F5F]">
                Material Information
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-gray-500">
                    File Name
                  </span>

                  <span
                    className="max-w-[190px] truncate text-right text-sm font-medium text-gray-700"
                    title={material.title}
                  >
                    {material.title}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    File Type
                  </span>

                  <span className="text-sm font-medium text-gray-700">
                    {material.type}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    File Size
                  </span>

                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <HardDrive size={14} />
                    {material.size}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Added
                  </span>

                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <Clock3 size={14} />
                    {material.time}
                  </span>

                </div>

              </div>

            </div>

            {/* AI Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold text-[#1F6F5F]">
                Learn with EduMind
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Use AI-powered tools to learn from this material.
              </p>

              <div className="mt-5 space-y-3">

                {/* AI Tutor */}
                <button
                  onClick={handleOpenTutor}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <Bot size={19} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      Ask AI Tutor
                    </p>

                    <p className="text-xs text-gray-400">
                      Ask questions about this material
                    </p>

                  </div>

                </button>

                {/* Summary */}
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5 disabled:cursor-not-allowed disabled:opacity-70"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">

                    {summaryLoading ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Sparkles size={19} />
                    )}

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      {summaryLoading
                        ? "Generating Summary..."
                        : "Generate Summary"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {summaryLoading
                        ? "EduMind is processing this material"
                        : "Get a concise explanation"}
                    </p>

                  </div>

                </button>

                {/* Quiz */}
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5 disabled:cursor-not-allowed disabled:opacity-70"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">

                    {quizLoading ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <ClipboardCheck size={19} />
                    )}

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      {quizLoading
                        ? "Generating Quiz..."
                        : "Generate Quiz"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {quizLoading
                        ? "EduMind is creating questions"
                        : "Test your understanding"}
                    </p>

                  </div>

                </button>

                {/* Flashcards */}
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={flashcardsLoading}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5 disabled:cursor-not-allowed disabled:opacity-70"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    {flashcardsLoading ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Layers3 size={19} />
                    )}
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      {flashcardsLoading
                        ? "Generating Flashcards..."
                        : "Create Flashcards"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {flashcardsLoading
                        ? "EduMind is creating revision cards"
                        : "Generate cards for revision"}
                    </p>

                  </div>

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            AI TUTOR
        ================================================== */}

        {tutorOpen && (

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Tutor Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                  <Bot size={20} />
                </div>

                <div>

                  <h2 className="font-semibold text-[#1F6F5F]">
                    AI Tutor
                  </h2>

                  <p className="text-xs text-gray-400">
                    Ask questions about {material.title}
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                {tutorMessages.length > 0 && (

                  <button
                    onClick={handleClearTutor}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    Clear Chat
                  </button>

                )}

                <button
                  onClick={handleCloseTutor}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  title="Close AI Tutor"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* Chat Area */}
            <div className="min-h-[350px] max-h-[600px] overflow-y-auto bg-[#F8F9F8] px-6 py-6">

              {tutorMessages.length === 0 && (

                <div className="mx-auto max-w-2xl text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                    <Sparkles size={24} />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-700">
                    Hi! I'm your EduMind AI Tutor 👋
                  </h3>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
                    Ask me anything about this study material.
                    I'll use the content of the selected document
                    to help explain concepts, definitions, and
                    important topics.
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">

                    <button
                      onClick={() =>
                        setTutorQuestion(
                          "Explain the main concepts in this material."
                        )
                      }
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    >
                      Explain the main concepts
                    </button>

                    <button
                      onClick={() =>
                        setTutorQuestion(
                          "What are the most important topics for an exam?"
                        )
                      }
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    >
                      Exam important topics
                    </button>

                    <button
                      onClick={() =>
                        setTutorQuestion(
                          "Explain the difficult concepts in simple terms."
                        )
                      }
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    >
                      Explain simply
                    </button>

                  </div>

                </div>

              )}

              <div className="mx-auto max-w-3xl space-y-6">

                {tutorMessages.map(
                  (message, index) => {

                    const isUser =
                      message.role === "user";

                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        {!isUser && (

                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                            <Bot size={18} />
                          </div>

                        )}

                        {isUser ? (

                          <div className="flex max-w-[78%] items-end gap-2">

                            <div className="rounded-2xl rounded-br-md bg-[#2FA084] px-4 py-3 text-white shadow-sm">

                              <div className="whitespace-pre-wrap text-sm leading-6">
                                {message.content}
                              </div>

                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
                              <User size={17} />
                            </div>

                          </div>

                        ) : (

                          <div className="max-w-[86%]">

                            <div className="mb-1 ml-1 flex items-center gap-2">

                              <span className="text-[11px] font-semibold text-[#1F6F5F]">
                                EduMind
                              </span>

                            </div>

                            <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-5 py-4 shadow-sm">

                              <ReactMarkdown
                                components={{

                                  h1: ({
                                    children,
                                  }) => (
                                    <h1 className="mb-3 mt-1 text-xl font-bold text-[#1F6F5F]">
                                      {children}
                                    </h1>
                                  ),

                                  h2: ({
                                    children,
                                  }) => (
                                    <h2 className="mb-3 mt-1 text-lg font-bold text-[#1F6F5F]">
                                      {children}
                                    </h2>
                                  ),

                                  h3: ({
                                    children,
                                  }) => (
                                    <h3 className="mb-2 mt-4 text-base font-bold text-[#1F6F5F] first:mt-0">
                                      {children}
                                    </h3>
                                  ),

                                  p: ({
                                    children,
                                  }) => (
                                    <p className="mb-3 text-sm leading-7 text-gray-700 last:mb-0">
                                      {children}
                                    </p>
                                  ),

                                  strong: ({
                                    children,
                                  }) => (
                                    <strong className="font-semibold text-gray-900">
                                      {children}
                                    </strong>
                                  ),

                                  em: ({
                                    children,
                                  }) => (
                                    <em className="italic text-gray-600">
                                      {children}
                                    </em>
                                  ),

                                  ul: ({
                                    children,
                                  }) => (
                                    <ul className="mb-3 ml-5 list-disc space-y-1.5 text-sm leading-6 text-gray-700">
                                      {children}
                                    </ul>
                                  ),

                                  ol: ({
                                    children,
                                  }) => (
                                    <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-gray-700">
                                      {children}
                                    </ol>
                                  ),

                                  li: ({
                                    children,
                                  }) => (
                                    <li className="pl-1">
                                      {children}
                                    </li>
                                  ),

                                  blockquote: ({
                                    children,
                                  }) => (
                                    <blockquote className="my-3 border-l-4 border-[#6FCF97] bg-[#F8F9F8] px-4 py-3 text-sm italic leading-6 text-gray-600">
                                      {children}
                                    </blockquote>
                                  ),

                                  code: ({
                                    className,
                                    children,
                                  }) => {

                                    const isBlock =
                                      className &&
                                      className.includes(
                                        "language-"
                                      );

                                    if (isBlock) {
                                      return (
                                        <pre className="my-3 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-100">
                                          <code className={className}>
                                            {children}
                                          </code>
                                        </pre>
                                      );
                                    }

                                    return (
                                      <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-[#1F6F5F]">
                                        {children}
                                      </code>
                                    );
                                  },

                                  table: ({
                                    children,
                                  }) => (
                                    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="min-w-full border-collapse text-left text-sm">
                                        {children}
                                      </table>
                                    </div>
                                  ),

                                  thead: ({
                                    children,
                                  }) => (
                                    <thead className="bg-[#F8F9F8]">
                                      {children}
                                    </thead>
                                  ),

                                  th: ({
                                    children,
                                  }) => (
                                    <th className="border-b border-gray-200 px-4 py-3 font-semibold text-[#1F6F5F]">
                                      {children}
                                    </th>
                                  ),

                                  td: ({
                                    children,
                                  }) => (
                                    <td className="border-b border-gray-100 px-4 py-3 text-gray-700">
                                      {children}
                                    </td>
                                  ),

                                  hr: () => (
                                    <hr className="my-4 border-gray-200" />
                                  ),

                                  a: ({
                                    children,
                                    href,
                                  }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-medium text-[#2FA084] underline decoration-[#6FCF97] underline-offset-2 hover:text-[#1F6F5F]"
                                    >
                                      {children}
                                    </a>
                                  ),

                                }}
                              >
                                {message.content}
                              </ReactMarkdown>

                            </div>

                          </div>

                        )}

                      </div>
                    );
                  }
                )}

                {tutorLoading && (

                  <div className="flex items-start gap-3">

                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                      <Bot size={18} />
                    </div>

                    <div className="max-w-[86%]">

                      <div className="mb-1 ml-1 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#1F6F5F]">
                          EduMind
                        </span>
                      </div>

                      <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">

                        <div className="flex items-center gap-2">

                          <Loader2
                            size={16}
                            className="animate-spin text-[#2FA084]"
                          />

                          <span className="text-sm text-gray-500">
                            EduMind is thinking...
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            </div>

            {tutorError && (

              <div className="border-t border-gray-100 bg-red-50 px-6 py-3">

                <div className="flex items-center gap-2 text-sm text-red-600">

                  <AlertCircle size={17} />

                  <span>
                    {tutorError}
                  </span>

                </div>

              </div>

            )}

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-4">

              <div className="mx-auto flex max-w-3xl items-end gap-3">

                <textarea
                  value={tutorQuestion}
                  onChange={(event) =>
                    setTutorQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={handleTutorKeyDown}
                  placeholder="Ask something about this material..."
                  rows={2}
                  disabled={tutorLoading}
                  className="min-h-[52px] flex-1 resize-none rounded-xl border border-gray-200 bg-[#F8F9F8] px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#6FCF97] focus:ring-2 focus:ring-[#6FCF97]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  onClick={handleAskTutor}
                  disabled={
                    tutorLoading ||
                    !tutorQuestion.trim()
                  }
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#2FA084] text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Send question"
                >

                  {tutorLoading ? (

                    <Loader2
                      size={19}
                      className="animate-spin"
                    />

                  ) : (

                    <Send size={19} />

                  )}

                </button>

              </div>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                Press Enter to send • Shift + Enter for a new line
              </p>

            </div>

          </div>

        )}

        {/* ==================================================
            QUIZ
        ================================================== */}

        {quizOpen && (

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Quiz Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                  <ClipboardCheck size={20} />
                </div>

                <div>

                  <h2 className="font-semibold text-[#1F6F5F]">
                    EduMind Quiz
                  </h2>

                  <p className="text-xs text-gray-400">
                    Test your understanding of {material.title}
                  </p>

                </div>

              </div>

              <button
                onClick={handleCloseQuiz}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                title="Close Quiz"
              >
                <X size={18} />
              </button>

            </div>

            {/* Quiz Loading */}
            {quizLoading && (

              <div className="flex min-h-[420px] items-center justify-center px-6 py-10">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">

                    <Loader2
                      size={30}
                      className="animate-spin"
                    />

                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-gray-700">
                    Generating your quiz...
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                    EduMind is reading the material and creating
                    questions for you.
                  </p>

                </div>

              </div>

            )}

            {/* Quiz Error */}
            {!quizLoading &&
              quizError && (

                <div className="flex min-h-[420px] items-center justify-center px-6 py-10">

                  <div className="max-w-lg text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                      <AlertCircle size={30} />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-gray-700">
                      Unable to generate quiz
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {quizError}
                    </p>

                    <div className="mt-5 flex justify-center gap-3">

                      <button
                        onClick={handleRetryQuiz}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
                      >
                        <RotateCcw size={16} />
                        Try Again
                      </button>

                      <button
                        onClick={handleCloseQuiz}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                      >
                        Close
                      </button>

                    </div>

                  </div>

                </div>

              )}

            {/* Quiz Completed */}
            {!quizLoading &&
              !quizError &&
              quizQuestions.length > 0 &&
              quizCompleted && (

                <div className="flex min-h-[500px] items-center justify-center px-6 py-10">

                  <div className="max-w-lg text-center">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#6FCF97]/20 text-[#1F6F5F]">

                      <Trophy size={38} />

                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Quiz Complete
                    </p>

                    <h3 className="mt-2 text-3xl font-bold text-[#1F6F5F]">
                      {quizScore} / {quizQuestions.length}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {quizScore === quizQuestions.length
                        ? "Perfect score! Excellent work."
                        : quizScore >=
                            Math.ceil(
                              quizQuestions.length * 0.7
                            )
                          ? "Great job! You have a good understanding of the material."
                          : "Good attempt. Review the explanations and try again."}
                    </p>

                    <div className="mt-6 rounded-2xl bg-[#F8F9F8] p-5">

                      <div className="flex items-center justify-between text-sm">

                        <span className="text-gray-500">
                          Score
                        </span>

                        <span className="font-semibold text-[#1F6F5F]">
                          {Math.round(
                            (quizScore /
                              quizQuestions.length) *
                              100
                          )}
                          %
                        </span>

                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">

                        <div
                          className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
                          style={{
                            width: `${
                              (quizScore /
                                quizQuestions.length) *
                              100
                            }%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">

                      <button
                        onClick={handleRetryQuiz}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
                      >
                        <RotateCcw size={17} />
                        Retry Quiz
                      </button>

                      <button
                        onClick={handleCloseQuiz}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                      >
                        Done
                      </button>

                    </div>

                  </div>

                </div>

              )}

            {/* Active Quiz */}
            {!quizLoading &&
              !quizError &&
              quizQuestions.length > 0 &&
              !quizCompleted &&
              currentQuizQuestion && (

                <div>

                  {/* Progress */}
                  <div className="border-b border-gray-100 px-6 py-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Question{" "}
                          {quizCurrentIndex + 1} of{" "}
                          {quizQuestions.length}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Difficulty:{" "}
                          <span className="font-medium capitalize text-[#1F6F5F]">
                            {quizDifficulty}
                          </span>
                        </p>

                      </div>

                      <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-xs font-semibold text-[#1F6F5F]">
                        {Math.round(quizProgress)}%
                      </span>

                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className="h-full rounded-full bg-[#2FA084] transition-all duration-300"
                        style={{
                          width: `${quizProgress}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Question Area */}
                  <div className="px-6 py-7">

                    <div className="mx-auto max-w-3xl">

                      <div className="rounded-2xl bg-[#F8F9F8] p-5">

                        <p className="text-base font-semibold leading-7 text-gray-800">
                          {currentQuizQuestion.question}
                        </p>

                      </div>

                      {/* Options */}
                      <div className="mt-5 space-y-3">

                        {currentQuizQuestion.options.map(
                          (option, index) => {

                            const isSelected =
                              quizSelectedOption ===
                              option;

                            const isCorrect =
                              option ===
                              currentQuizQuestion.correct_answer;

                            let optionClasses =
                              "border-gray-200 bg-white hover:border-[#6FCF97] hover:bg-[#6FCF97]/5";

                            if (
                              quizAnswerSubmitted &&
                              isCorrect
                            ) {
                              optionClasses =
                                "border-green-300 bg-green-50";
                            } else if (
                              quizAnswerSubmitted &&
                              isSelected &&
                              !isCorrect
                            ) {
                              optionClasses =
                                "border-red-300 bg-red-50";
                            } else if (
                              isSelected
                            ) {
                              optionClasses =
                                "border-[#2FA084] bg-[#6FCF97]/10 ring-2 ring-[#6FCF97]/20";
                            }

                            return (
                              <button
                                key={index}
                                onClick={() =>
                                  handleSelectQuizOption(
                                    option
                                  )
                                }
                                disabled={
                                  quizAnswerSubmitted
                                }
                                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${optionClasses} ${
                                  quizAnswerSubmitted
                                    ? "cursor-default"
                                    : "cursor-pointer"
                                }`}
                              >

                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    quizAnswerSubmitted &&
                                    isCorrect
                                      ? "bg-green-500 text-white"
                                      : quizAnswerSubmitted &&
                                          isSelected &&
                                          !isCorrect
                                        ? "bg-red-500 text-white"
                                        : isSelected
                                          ? "bg-[#2FA084] text-white"
                                          : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {quizAnswerSubmitted &&
                                  isCorrect ? (
                                    <Check size={16} />
                                  ) : quizAnswerSubmitted &&
                                    isSelected &&
                                    !isCorrect ? (
                                    <XCircle size={16} />
                                  ) : (
                                    String.fromCharCode(
                                      65 + index
                                    )
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

                      {/* Answer Result */}
                      {quizAnswerSubmitted && (

                        <div
                          className={`mt-5 rounded-2xl border p-5 ${
                            quizSelectedOption ===
                            currentQuizQuestion.correct_answer
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >

                          <div className="flex items-start gap-3">

                            {quizSelectedOption ===
                            currentQuizQuestion.correct_answer ? (

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white">
                                <Check size={18} />
                              </div>

                            ) : (

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
                                <XCircle size={18} />
                              </div>

                            )}

                            <div>

                              <p
                                className={`text-sm font-semibold ${
                                  quizSelectedOption ===
                                  currentQuizQuestion.correct_answer
                                    ? "text-green-700"
                                    : "text-red-700"
                                }`}
                              >
                                {quizSelectedOption ===
                                currentQuizQuestion.correct_answer
                                  ? "Correct!"
                                  : "Not quite."}
                              </p>

                              {quizSelectedOption !==
                                currentQuizQuestion.correct_answer && (

                                <p className="mt-1 text-sm text-gray-600">
                                  <span className="font-semibold">
                                    Correct answer:
                                  </span>{" "}
                                  {
                                    currentQuizQuestion.correct_answer
                                  }
                                </p>

                              )}

                              <div className="mt-3 border-t border-black/5 pt-3">

                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  Explanation
                                </p>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                  {
                                    currentQuizQuestion.explanation
                                  }
                                </p>

                              </div>

                            </div>

                          </div>

                        </div>

                      )}

                      {/* Action */}
                      <div className="mt-6 flex justify-end">

                        {!quizAnswerSubmitted ? (

                          <button
                            onClick={
                              handleSubmitQuizAnswer
                            }
                            disabled={
                              !quizSelectedOption
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={17} />
                            Submit Answer
                          </button>

                        ) : (

                          <button
                            onClick={
                              handleNextQuizQuestion
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
                          >
                            {quizCurrentIndex >=
                            quizQuestions.length - 1
                              ? "Finish Quiz"
                              : "Next Question"}

                            <ChevronRight size={17} />
                          </button>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

              )}

          </div>

        )}

        {/* ==================================================
            FLASHCARDS
        ================================================== */}

        {flashcardsOpen && (

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Flashcard Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                  <Layers3 size={20} />
                </div>

                <div>

                  <h2 className="font-semibold text-[#1F6F5F]">
                    EduMind Flashcards
                  </h2>

                  <p className="text-xs text-gray-400">
                    Revise key concepts from {material.title}
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                {flashcards.length > 0 && !flashcardsLoading && (
                  <button
                    onClick={handleRetryFlashcards}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <RotateCcw size={14} />
                    New Set
                  </button>
                )}

                <button
                  onClick={handleCloseFlashcards}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  title="Close Flashcards"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* Loading */}
            {flashcardsLoading && (

              <div className="flex min-h-[460px] items-center justify-center px-6 py-10">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                    <Loader2 size={30} className="animate-spin" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-gray-700">
                    Creating your flashcards...
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                    EduMind is reading the material and preparing concise revision cards.
                  </p>

                </div>

              </div>

            )}

            {/* Error */}
            {!flashcardsLoading && flashcardsError && (

              <div className="flex min-h-[420px] items-center justify-center px-6 py-10">

                <div className="max-w-lg text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <AlertCircle size={30} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-gray-700">
                    Unable to generate flashcards
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {flashcardsError}
                  </p>

                  <div className="mt-5 flex justify-center gap-3">

                    <button
                      onClick={handleRetryFlashcards}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
                    >
                      <RotateCcw size={16} />
                      Try Again
                    </button>

                    <button
                      onClick={handleCloseFlashcards}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    >
                      Close
                    </button>

                  </div>

                </div>

              </div>

            )}

            {/* Flashcard Content */}
            {!flashcardsLoading &&
              !flashcardsError &&
              currentFlashcard && (

                <div className="px-6 py-7">

                  <div className="mx-auto max-w-3xl">

                    {/* Progress */}
                    <div className="mb-5">

                      <div className="flex items-center justify-between">

                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Card {flashcardCurrentIndex + 1} of {flashcards.length}
                        </p>

                        <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-xs font-semibold text-[#1F6F5F]">
                          {Math.round(flashcardProgress)}%
                        </span>

                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#2FA084] transition-all duration-300"
                          style={{ width: `${flashcardProgress}%` }}
                        />
                      </div>

                    </div>

                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setFlashcardRevealed((previous) => !previous)}
                      className="group block w-full text-left"
                      aria-label={
                        flashcardRevealed
                          ? "Hide flashcard answer"
                          : "Reveal flashcard answer"
                      }
                    >

                      <div className="min-h-[360px] rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-[#F8F9F8] p-7 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-10">

                        {!flashcardRevealed ? (

                          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                            <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1F6F5F]">
                              Question
                            </span>

                            <p className="mt-6 text-xl font-semibold leading-9 text-gray-800 sm:text-2xl">
                              {currentFlashcard.front}
                            </p>

                            <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 shadow-sm transition group-hover:border-[#6FCF97] group-hover:text-[#1F6F5F]">
                              <Eye size={16} />
                              Click to reveal answer
                            </div>

                          </div>

                        ) : (

                          <div className="min-h-[300px]">

                            <div className="flex items-center justify-between">

                              <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1F6F5F]">
                                Answer
                              </span>

                              <EyeOff
                                size={17}
                                className="text-gray-400"
                              />

                            </div>

                            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">

                              <p className="text-lg leading-8 text-gray-700">
                                {currentFlashcard.back}
                              </p>

                            </div>

                            <p className="mt-5 text-center text-xs text-gray-400">
                              Click the card to hide the answer.
                            </p>

                          </div>

                        )}

                      </div>

                    </button>

                    {/* Navigation */}
                    <div className="mt-6 flex items-center justify-between gap-3">

                      <button
                        onClick={handlePreviousFlashcard}
                        disabled={flashcardCurrentIndex === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={17} />
                        Previous
                      </button>

                      <button
                        onClick={() => setFlashcardRevealed((previous) => !previous)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
                      >
                        {flashcardRevealed ? (
                          <>
                            <EyeOff size={17} />
                            Hide Answer
                          </>
                        ) : (
                          <>
                            <Eye size={17} />
                            Reveal Answer
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleNextFlashcard}
                        disabled={flashcardCurrentIndex === flashcards.length - 1}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight size={17} />
                      </button>

                    </div>

                    {flashcardCurrentIndex === flashcards.length - 1 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={handleRetryFlashcards}
                          className="text-xs font-medium text-[#2FA084] transition hover:text-[#1F6F5F]"
                        >
                          Generate a fresh set
                        </button>
                      </div>
                    )}

                  </div>

                </div>

              )}

          </div>

        )}

        {/* ==================================================
            SUMMARY RESULT
        ================================================== */}

        {(summaryLoading ||
          summaryError ||
          summary) && (

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Summary Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">

                  {summaryLoading ? (

                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                  ) : summaryError ? (

                    <AlertCircle size={20} />

                  ) : (

                    <CheckCircle2 size={20} />

                  )}

                </div>

                <div>

                  <h2 className="font-semibold text-[#1F6F5F]">
                    AI Summary
                  </h2>

                  <p className="text-xs text-gray-400">
                    Generated from {material.title}
                  </p>

                </div>

              </div>

              {summary &&
                !summaryLoading && (

                  <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-xs font-semibold text-[#1F6F5F]">
                    Local AI
                  </span>

                )}

            </div>

            {/* Summary Loading */}
            {summaryLoading && (

              <div className="flex items-center gap-3 px-6 py-8">

                <Loader2
                  size={20}
                  className="animate-spin text-[#2FA084]"
                />

                <div>

                  <p className="text-sm font-medium text-gray-700">
                    Generating your summary...
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    EduMind is reading and processing the uploaded
                    material.
                  </p>

                </div>

              </div>

            )}

            {/* Summary Error */}
            {summaryError &&
              !summaryLoading && (

                <div className="flex items-start gap-3 px-6 py-6">

                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <div>

                    <p className="text-sm font-semibold text-red-600">
                      Unable to generate summary
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {summaryError}
                    </p>

                  </div>

                </div>

              )}

            {/* Summary Content */}
            {summary &&
              !summaryLoading &&
              !summaryError && (

                <div className="px-6 py-6">

                  <div className="rounded-xl bg-[#EEEEEE] p-5">

                    <ReactMarkdown
                      components={{

                        h1: ({
                          children,
                        }) => (
                          <h1 className="mb-3 text-xl font-bold text-[#1F6F5F]">
                            {children}
                          </h1>
                        ),

                        h2: ({
                          children,
                        }) => (
                          <h2 className="mb-3 mt-5 text-lg font-bold text-[#1F6F5F] first:mt-0">
                            {children}
                          </h2>
                        ),

                        h3: ({
                          children,
                        }) => (
                          <h3 className="mb-2 mt-4 text-base font-bold text-[#1F6F5F] first:mt-0">
                            {children}
                          </h3>
                        ),

                        p: ({
                          children,
                        }) => (
                          <p className="mb-3 text-sm leading-7 text-gray-700 last:mb-0">
                            {children}
                          </p>
                        ),

                        strong: ({
                          children,
                        }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
                        ),

                        ul: ({
                          children,
                        }) => (
                          <ul className="mb-3 ml-5 list-disc space-y-1.5 text-sm leading-6 text-gray-700">
                            {children}
                          </ul>
                        ),

                        ol: ({
                          children,
                        }) => (
                          <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-gray-700">
                            {children}
                          </ol>
                        ),

                        li: ({
                          children,
                        }) => (
                          <li className="pl-1">
                            {children}
                          </li>
                        ),

                        blockquote: ({
                          children,
                        }) => (
                          <blockquote className="my-3 border-l-4 border-[#6FCF97] bg-white px-4 py-3 text-sm italic leading-6 text-gray-600">
                            {children}
                          </blockquote>
                        ),

                        code: ({
                          className,
                          children,
                        }) => {

                          const isBlock =
                            className &&
                            className.includes(
                              "language-"
                            );

                          if (isBlock) {
                            return (
                              <pre className="my-3 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-100">
                                <code className={className}>
                                  {children}
                                </code>
                              </pre>
                            );
                          }

                          return (
                            <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[13px] text-[#1F6F5F]">
                              {children}
                            </code>
                          );
                        },

                        table: ({
                          children,
                        }) => (
                          <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full border-collapse text-left text-sm">
                              {children}
                            </table>
                          </div>
                        ),

                        thead: ({
                          children,
                        }) => (
                          <thead className="bg-white">
                            {children}
                          </thead>
                        ),

                        th: ({
                          children,
                        }) => (
                          <th className="border-b border-gray-200 px-4 py-3 font-semibold text-[#1F6F5F]">
                            {children}
                          </th>
                        ),

                        td: ({
                          children,
                        }) => (
                          <td className="border-b border-gray-100 px-4 py-3 text-gray-700">
                            {children}
                          </td>
                        ),

                        hr: () => (
                          <hr className="my-4 border-gray-200" />
                        ),

                        a: ({
                          children,
                          href,
                        }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#2FA084] underline decoration-[#6FCF97] underline-offset-2 hover:text-[#1F6F5F]"
                          >
                            {children}
                          </a>
                        ),

                      }}
                    >
                      {summary}
                    </ReactMarkdown>

                  </div>

                </div>

              )}

          </div>

        )}

      </div>

    </div>
  );
}

export default MaterialDetails;