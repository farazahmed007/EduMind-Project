import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

    // --------------------------------------------------
    // IMPORTANT:
    //
    // Save the existing conversation BEFORE adding the
    // current question.
    //
    // The backend receives:
    //
    // conversation_history = previous messages
    // question             = current question
    //
    // This allows the backend to resolve follow-ups like:
    //
    // "Why is it useful?"
    //
    // using the previous message:
    //
    // "Explain propositional logic."
    // --------------------------------------------------

    const conversationHistory = tutorMessages.slice(-10);

    // --------------------------------------------------
    // Add user's question immediately to the UI
    // --------------------------------------------------

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

            // --------------------------------------------------
            // THIS IS THE FIX
            // --------------------------------------------------
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

      // --------------------------------------------------
      // Add AI response to conversation
      // --------------------------------------------------

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

      // --------------------------------------------------
      // Remove the user's optimistic message if the
      // request failed so the UI does not show a question
      // with no answer.
      // --------------------------------------------------

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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAskTutor();
    }
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
              This material may have been deleted or is no longer
              available.
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
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <ClipboardCheck size={19} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      Generate Quiz
                    </p>

                    <p className="text-xs text-gray-400">
                      Test your understanding
                    </p>

                  </div>

                </button>

                {/* Flashcards */}
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <Layers3 size={19} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-700">
                      Create Flashcards
                    </p>

                    <p className="text-xs text-gray-400">
                      Generate cards for revision
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

              {/* Initial Tutor Message */}
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

              {/* Conversation */}
              <div className="mx-auto max-w-3xl space-y-5">

                {tutorMessages.map(
                  (message, index) => (

                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      {/* AI Avatar */}
                      {message.role === "assistant" && (

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
                          <Bot size={18} />
                        </div>

                      )}

                      {/* Message */}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-[#2FA084] text-white"
                            : "border border-gray-200 bg-white text-gray-700"
                        }`}
                      >

                        <div className="whitespace-pre-wrap text-sm leading-7">
                          {message.content}
                        </div>

                      </div>

                      {/* User Avatar */}
                      {message.role === "user" && (

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
                          <User size={17} />
                        </div>

                      )}

                    </div>

                  )
                )}

                {/* AI Loading */}
                {tutorLoading && (

                  <div className="flex gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F]">
                      <Bot size={18} />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">

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

                )}

              </div>

            </div>

            {/* Tutor Error */}
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
                    setTutorQuestion(event.target.value)
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
            SUMMARY RESULT
        ================================================== */}

        {(summaryLoading || summaryError || summary) && (

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

              {summary && !summaryLoading && (

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
            {summaryError && !summaryLoading && (

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

                    <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {summary}
                    </div>

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