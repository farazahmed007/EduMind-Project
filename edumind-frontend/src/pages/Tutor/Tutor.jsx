import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Loader2,
  AlertCircle,
  User,
  Sparkles,
  FileText,
  Trash2,
  ChevronDown,
  MessageCircle,
  Brain,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  "http://127.0.0.1:8000";

export default function Tutor() {
  const { token } = useAuth();

  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  const [materials, setMaterials] =
    useState([]);

  const [materialsLoading, setMaterialsLoading] =
    useState(true);

  const [materialsError, setMaterialsError] =
    useState("");

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  // --------------------------------------------------
  // Tutor
  // --------------------------------------------------

  const [tutorQuestion, setTutorQuestion] =
    useState("");

  const [tutorMessages, setTutorMessages] =
    useState([]);

  const [tutorLoading, setTutorLoading] =
    useState(false);

  const [tutorError, setTutorError] =
    useState("");

  // --------------------------------------------------
  // Load materials
  // --------------------------------------------------

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      setMaterialsError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/materials/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          let errorMessage =
            "Failed to load study materials.";

          try {
            const errorData =
              await response.json();

            if (errorData?.detail) {
              errorMessage = Array.isArray(
                errorData.detail
              )
                ? errorData.detail
                    .map((item) => item.msg)
                    .join(", ")
                : errorData.detail;
            }
          } catch {
            // Keep default error message.
          }

          throw new Error(errorMessage);
        }

        const data =
          await response.json();

        const supportedMaterials =
          Array.isArray(data)
            ? data.filter((material) =>
                ["PDF", "PPT", "DOC", "TXT"].includes(
                  String(material.type).toUpperCase()
                )
              )
            : [];

        setMaterials(supportedMaterials);

        if (supportedMaterials.length > 0) {
          setSelectedMaterialId(
            String(supportedMaterials[0].id)
          );
        }
      } catch (error) {
        console.error(
          "Error loading tutor materials:",
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
  }, [token]);

  // --------------------------------------------------
  // Selected material
  // --------------------------------------------------

  const selectedMaterial =
    materials.find(
      (material) =>
        String(material.id) ===
        String(selectedMaterialId)
    );

  // --------------------------------------------------
  // Clear conversation
  // --------------------------------------------------

  const handleClearChat = () => {
    if (tutorLoading) {
      return;
    }

    setTutorMessages([]);
    setTutorQuestion("");
    setTutorError("");
  };

  // --------------------------------------------------
  // Change material
  // --------------------------------------------------

  const handleMaterialChange = (event) => {
    const newMaterialId =
      event.target.value;

    if (tutorLoading) {
      return;
    }

    setSelectedMaterialId(
      newMaterialId
    );

    setTutorMessages([]);
    setTutorQuestion("");
    setTutorError("");
  };

  // --------------------------------------------------
  // Ask tutor
  // --------------------------------------------------

  const handleAskTutor = async () => {
    const question =
      tutorQuestion.trim();

    if (
      !question ||
      tutorLoading ||
      !selectedMaterialId
    ) {
      return;
    }

    if (!token) {
      setTutorError(
        "You must be logged in to use the AI Tutor."
      );
      return;
    }

    setTutorError("");

    const conversationHistory =
      tutorMessages.slice(-10);

    setTutorMessages(
      (previousMessages) => [
        ...previousMessages,
        {
          role: "user",
          content: question,
        },
      ]
    );

    setTutorQuestion("");
    setTutorLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            conversation_history:
              conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to get a response from AI Tutor.";

        try {
          const errorData =
            await response.json();

          if (errorData.detail) {
            errorMessage = Array.isArray(
              errorData.detail
            )
              ? errorData.detail
                  .map((item) => item.msg)
                  .join(", ")
              : errorData.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(errorMessage);
      }

      const data =
        await response.json();

      if (!data.answer) {
        throw new Error(
          "The server returned an empty AI response."
        );
      }

      setTutorMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            role: "assistant",
            content: data.answer,
          },
        ]
      );
    } catch (error) {
      console.error(
        "Error asking AI Tutor:",
        error
      );

      setTutorMessages(
        (previousMessages) => {
          if (
            previousMessages.length >
              0 &&
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
        }
      );

      setTutorError(
        error.message ||
          "Something went wrong while contacting AI Tutor."
      );
    } finally {
      setTutorLoading(false);
    }
  };

  // --------------------------------------------------
  // Enter to send
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
  // Loading page
  // --------------------------------------------------

  if (materialsLoading) {
    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[620px] items-center justify-center rounded-[26px] border border-[#e1ebe6] bg-white shadow-[0_7px_28px_rgba(23,33,30,0.04)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                <Loader2
                  size={25}
                  strokeWidth={2.2}
                  className="animate-spin"
                />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles
                    size={8}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <h2 className="mt-6 text-lg font-bold tracking-[-0.02em] text-[#25322e]">
                Loading your AI Tutor
              </h2>

              <p className="mt-1.5 text-sm font-medium text-[#84918c]">
                Preparing your study workspace...
              </p>
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
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="overflow-hidden rounded-[26px] border border-[#f0d7d7] bg-white shadow-[0_7px_28px_rgba(23,33,30,0.04)]">
            <div className="relative flex min-h-[420px] items-center justify-center px-6 py-12">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#fde8e8]/60 blur-3xl" />

              <div className="relative max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f0d7d7] bg-[#fff0f0] text-[#c96363]">
                  <AlertCircle
                    size={28}
                    strokeWidth={2}
                  />
                </div>

                <h2 className="mt-6 text-xl font-bold tracking-[-0.02em] text-[#8f4545]">
                  Unable to load study materials
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#9b6868]">
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
  // No supported study materials
  // --------------------------------------------------

  if (materials.length === 0) {
    return (
      <div className="min-h-full bg-[#f4f7f6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative overflow-hidden rounded-[28px] border border-[#dfe9e5] bg-white shadow-[0_7px_28px_rgba(23,33,30,0.04)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#6fcf97]/10 blur-3xl" />

            <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-[#cdeee1]/20 blur-3xl" />

            <div className="relative flex min-h-[560px] items-center justify-center px-6 py-14">
              <div className="max-w-lg text-center">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                  <FileText
                    size={31}
                    strokeWidth={1.9}
                  />

                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                    <Sparkles
                      size={9}
                      strokeWidth={2.5}
                    />
                  </span>
                </div>

                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9b95]">
                  AI Tutor
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#176b5b] sm:text-3xl">
                  Your tutor needs a study source
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#7c8b86]">
                  Upload study material to your Learning Library
                  before starting a grounded tutoring
                  session.
                </p>

                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d8e8e1] bg-[#f7faf9] px-4 py-2.5 text-xs font-semibold text-[#5b6b65]">
                  <BookOpen
                    size={14}
                    className="text-[#2fa084]"
                  />
                  Add study material from your Library
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Main Tutor UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8 lg:pt-6 xl:px-10">
        {/* Page Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className="relative mb-5 overflow-hidden rounded-[24px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#f1faf6] px-5 py-5 shadow-[0_6px_28px_rgba(23,33,30,0.045)] sm:px-6 sm:py-6 lg:px-7"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#6fcf97]/12 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-[#cdeee1]/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                <Bot
                  size={26}
                  strokeWidth={2}
                />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles
                    size={8}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c938a]">
                    Intelligent learning
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[10px] font-semibold text-[#2fa084]">
                    AI Tutor
                  </span>
                </div>

                <h1 className="text-[25px] font-bold tracking-[-0.03em] text-[#176b5b] sm:text-[28px]">
                  Learn with your material
                </h1>

                <p className="mt-1 text-sm font-medium text-[#7b8984]">
                  Ask questions, clarify concepts, and
                  study with context from your documents.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2.5 rounded-2xl border border-[#dfeae5] bg-white/80 px-3.5 py-3 shadow-sm backdrop-blur-sm lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Brain
                  size={17}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#98a6a1]">
                  Powered by your material
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                  Grounded study assistance
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Material Selector */}
        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.05,
            ease: "easeOut",
          }}
          className="mb-5 rounded-[22px] border border-[#dfe9e5] bg-white p-3.5 shadow-[0_5px_24px_rgba(23,33,30,0.045)] sm:p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <BookOpen
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#97a59f]">
                  Study source
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                  Choose the material your tutor should use
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-[720px]">
              <div className="relative min-w-0 flex-1">
                <select
                  id="tutor-material"
                  value={selectedMaterialId}
                  onChange={
                    handleMaterialChange
                  }
                  disabled={tutorLoading}
                  className="h-11 w-full appearance-none rounded-xl border border-[#dfe8e4] bg-[#f7faf9] px-4 pr-10 text-sm font-semibold text-[#53635d] outline-none transition-all duration-200 hover:border-[#cddbd5] hover:bg-white focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {materials.map(
                    (material) => (
                      <option
                        key={material.id}
                        value={material.id}
                      >
                        {material.title}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9993]"
                />
              </div>

              {selectedMaterial && (
                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#dfe9e5] bg-[#f7faf9] px-3.5 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fff1f1] text-[#d85b5b]">
                    <FileText size={13} />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9aa7a2]">
                      {String(
                        selectedMaterial.type || "FILE"
                      ).toUpperCase()}
                    </p>

                    <p className="text-[10px] font-semibold text-[#65746e]">
                      {selectedMaterial.size}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Tutor Workspace */}
        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.1,
            ease: "easeOut",
          }}
          className="overflow-hidden rounded-[26px] border border-[#dfe8e4] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.055)]"
        >
          {/* Tutor Header */}
          <div className="flex items-center justify-between gap-4 border-b border-[#edf1ef] bg-white px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Sparkles
                  size={19}
                  strokeWidth={2}
                />

                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#6fcf97]" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-[#176b5b] sm:text-base">
                  {selectedMaterial
                    ? selectedMaterial.title
                    : "AI Tutor"}
                </h2>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6fcf97]" />

                  <p className="text-[10px] font-medium text-[#899791]">
                    Document-grounded learning assistant
                  </p>
                </div>
              </div>
            </div>

            {tutorMessages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                disabled={tutorLoading}
                className="group flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#e5ebe8] bg-white px-3 text-xs font-semibold text-[#7d8b85] shadow-sm transition-all duration-200 hover:border-[#f0d7d7] hover:bg-[#fff7f7] hover:text-[#c96363] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/35"
              >
                <Trash2
                  size={14}
                  strokeWidth={2}
                  className="transition-transform duration-200 group-hover:scale-105"
                />

                <span className="hidden sm:inline">
                  Clear Chat
                </span>
              </button>
            )}
          </div>

          {/* Chat Area */}
          <div className="min-h-[500px] max-h-[680px] overflow-y-auto bg-[#f7faf9] px-4 py-6 sm:px-6 sm:py-7">
            {/* Empty State */}
            {tutorMessages.length === 0 && (
              <div className="mx-auto flex min-h-[420px] max-w-2xl flex-col items-center justify-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#cdeee1] bg-white text-[#2fa084] shadow-[0_8px_24px_rgba(23,33,30,0.07)]">
                  <div className="absolute inset-2 rounded-[18px] border border-[#e5f3ed]" />

                  <Bot
                    size={30}
                    strokeWidth={1.9}
                  />

                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                    <Sparkles
                      size={10}
                      strokeWidth={2.5}
                    />
                  </span>
                </div>

                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9b95]">
                  Ready when you are
                </p>

                <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-[#25322e] sm:text-2xl">
                  Ask your AI study companion
                </h3>

                <p className="mt-2.5 max-w-lg text-sm leading-7 text-[#7c8b86]">
                  Ask anything about your selected material.
                  EduMind can explain concepts, simplify
                  difficult topics, and help you prepare for
                  exams.
                </p>

                <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    {
                      icon: Brain,
                      label: "Explain concepts",
                      question:
                        "Explain the main concepts in this material.",
                    },
                    {
                      icon: BookOpen,
                      label: "Exam topics",
                      question:
                        "What are the most important topics for an exam?",
                    },
                    {
                      icon: MessageCircle,
                      label: "Simplify a topic",
                      question:
                        "Explain the difficult concepts in simple terms.",
                    },
                  ].map(
                    ({
                      icon: Icon,
                      label,
                      question,
                    }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setTutorQuestion(
                            question
                          )
                        }
                        disabled={
                          tutorLoading
                        }
                        className="group flex items-center gap-2.5 rounded-xl border border-[#dfe8e4] bg-white px-3.5 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9dfd0] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084] transition-colors duration-200 group-hover:bg-[#dff3ea]">
                          <Icon
                            size={15}
                            strokeWidth={2}
                          />
                        </span>

                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold text-[#53635d]">
                            {label}
                          </span>

                          <span className="mt-0.5 block text-[9px] font-medium text-[#a0aaa6]">
                            Start with this
                          </span>
                        </span>
                      </button>
                    )
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-full border border-[#dceae4] bg-white px-3.5 py-2 text-[10px] font-semibold text-[#7c8d86] shadow-sm">
                  <ShieldCheck
                    size={13}
                    className="text-[#6b9385]"
                  />
                  Answers are grounded in your selected material
                </div>
              </div>
            )}

            {/* Messages */}
            {tutorMessages.length > 0 && (
              <div className="mx-auto max-w-4xl space-y-5">
                {tutorMessages.map(
                  (message, index) => {
                    const isUser =
                      message.role ===
                      "user";

                    return (
                      <motion.div
                        key={`${message.role}-${index}`}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className={`flex items-start gap-3 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                            <Bot
                              size={17}
                              strokeWidth={2}
                            />
                          </div>
                        )}

                        {isUser ? (
                          <div className="flex max-w-[86%] items-end gap-2 sm:max-w-[78%]">
                            <div className="rounded-[20px] rounded-br-md bg-[#2fa084] px-4 py-3 text-white shadow-[0_6px_18px_rgba(47,160,132,0.15)]">
                              <div className="whitespace-pre-wrap text-sm leading-6">
                                {message.content}
                              </div>
                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dfe8e4] bg-white text-[#71817b] shadow-sm">
                              <User
                                size={16}
                                strokeWidth={2}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-0 max-w-[90%] sm:max-w-[84%]">
                            <div className="mb-1.5 ml-1 flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#176b5b]">
                                EduMind
                              </span>

                              <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9aa7a2]">
                                AI Tutor
                              </span>
                            </div>

                            <div className="rounded-[20px] rounded-tl-md border border-[#dfe8e4] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(23,33,30,0.045)] sm:px-5 sm:py-4">
                              <ReactMarkdown
                                components={{
                                  h1: ({
                                    children,
                                  }) => (
                                    <h1 className="mb-3 mt-1 text-xl font-bold tracking-[-0.02em] text-[#176b5b]">
                                      {children}
                                    </h1>
                                  ),

                                  h2: ({
                                    children,
                                  }) => (
                                    <h2 className="mb-3 mt-5 text-lg font-bold tracking-[-0.015em] text-[#176b5b] first:mt-0">
                                      {children}
                                    </h2>
                                  ),

                                  h3: ({
                                    children,
                                  }) => (
                                    <h3 className="mb-2 mt-4 text-base font-bold text-[#176b5b] first:mt-0">
                                      {children}
                                    </h3>
                                  ),

                                  p: ({
                                    children,
                                  }) => (
                                    <p className="mb-3 text-sm leading-7 text-[#53635d] last:mb-0">
                                      {children}
                                    </p>
                                  ),

                                  strong: ({
                                    children,
                                  }) => (
                                    <strong className="font-bold text-[#25322e]">
                                      {children}
                                    </strong>
                                  ),

                                  em: ({
                                    children,
                                  }) => (
                                    <em className="italic text-[#667870]">
                                      {children}
                                    </em>
                                  ),

                                  ul: ({
                                    children,
                                  }) => (
                                    <ul className="mb-3 ml-5 list-disc space-y-1.5 text-sm leading-6 text-[#53635d]">
                                      {children}
                                    </ul>
                                  ),

                                  ol: ({
                                    children,
                                  }) => (
                                    <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-[#53635d]">
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
                                    <blockquote className="my-4 rounded-r-xl border-l-4 border-[#6fcf97] bg-[#f5faf7] px-4 py-3 text-sm italic leading-6 text-[#667870]">
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

                                    if (
                                      isBlock
                                    ) {
                                      return (
                                        <pre className="my-4 overflow-x-auto rounded-xl bg-[#17211e] p-4 text-sm leading-6 text-[#eef5f2]">
                                          <code
                                            className={
                                              className
                                            }
                                          >
                                            {
                                              children
                                            }
                                          </code>
                                        </pre>
                                      );
                                    }

                                    return (
                                      <code className="rounded-md bg-[#edf5f1] px-1.5 py-0.5 font-mono text-[13px] text-[#1f6f5f]">
                                        {
                                          children
                                        }
                                      </code>
                                    );
                                  },

                                  table: ({
                                    children,
                                  }) => (
                                    <div className="my-4 overflow-x-auto rounded-xl border border-[#dfe8e4]">
                                      <table className="min-w-full border-collapse text-left text-sm">
                                        {
                                          children
                                        }
                                      </table>
                                    </div>
                                  ),

                                  thead: ({
                                    children,
                                  }) => (
                                    <thead className="bg-[#f5faf7]">
                                      {children}
                                    </thead>
                                  ),

                                  th: ({
                                    children,
                                  }) => (
                                    <th className="border-b border-[#dfe8e4] px-4 py-3 font-bold text-[#1f6f5f]">
                                      {
                                        children
                                      }
                                    </th>
                                  ),

                                  td: ({
                                    children,
                                  }) => (
                                    <td className="border-b border-[#edf1ef] px-4 py-3 text-[#53635d]">
                                      {
                                        children
                                      }
                                    </td>
                                  ),

                                  hr: () => (
                                    <hr className="my-4 border-[#e3ebe7]" />
                                  ),

                                  a: ({
                                    children,
                                    href,
                                  }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-semibold text-[#2fa084] underline decoration-[#a9dfcc] underline-offset-2 transition-colors hover:text-[#1f6f5f]"
                                    >
                                      {
                                        children
                                      }
                                    </a>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  }
                )}

                {/* Thinking indicator */}
                {tutorLoading && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                      <Bot
                        size={17}
                        strokeWidth={2}
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 ml-1 flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#176b5b]">
                          EduMind
                        </span>

                        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9aa7a2]">
                          Thinking
                        </span>
                      </div>

                      <div className="rounded-[20px] rounded-tl-md border border-[#dfe8e4] bg-white px-4 py-3.5 shadow-[0_4px_16px_rgba(23,33,30,0.045)]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          </div>

                          <span className="text-xs font-medium text-[#7b8984]">
                            EduMind is thinking...
                          </span>

                          <div className="ml-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6fcf97]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a9dfcc] [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#cdeee1] [animation-delay:300ms]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Tutor Error */}
          {tutorError && (
            <div className="border-t border-[#f0d7d7] bg-[#fff7f7] px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-4xl items-center gap-2.5 text-xs font-semibold text-[#a85b5b]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ffeaea] text-[#c96363]">
                  <AlertCircle
                    size={14}
                    strokeWidth={2.2}
                  />
                </span>

                <span>{tutorError}</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[#edf1ef] bg-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-[20px] border border-[#dfe8e4] bg-[#f7faf9] p-2 shadow-[inset_0_0_0_1px_rgba(47,160,132,0.02)] transition-all duration-200 focus-within:border-[#b9dfd0] focus-within:bg-white focus-within:shadow-[0_6px_20px_rgba(23,33,30,0.05)]">
                <div className="flex items-end gap-2">
                  <textarea
                    value={tutorQuestion}
                    onChange={(event) =>
                      setTutorQuestion(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleTutorKeyDown
                    }
                    placeholder="Ask something about this material..."
                    rows={2}
                    disabled={tutorLoading}
                    className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-medium text-[#34433e] outline-none placeholder:text-[#9aa7a2] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handleAskTutor}
                    disabled={
                      tutorLoading ||
                      !tutorQuestion.trim() ||
                      !selectedMaterialId
                    }
                    className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2fa084] text-white shadow-[0_6px_15px_rgba(47,160,132,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_8px_18px_rgba(47,160,132,0.24)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/25"
                    title="Send question"
                    aria-label="Send question"
                  >
                    {tutorLoading ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex flex-col items-center justify-between gap-1.5 px-1 sm:flex-row">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#9aa7a2]">
                  <ShieldCheck
                    size={12}
                    className="text-[#7c9b90]"
                  />
                  Grounded in your selected material
                </div>

                <p className="text-[10px] font-medium text-[#a0aaa6]">
                  Enter to send • Shift + Enter for a new line
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}