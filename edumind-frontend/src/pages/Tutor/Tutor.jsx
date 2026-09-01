import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  ArrowLeft,
  Bot,
  Send,
  Loader2,
  AlertCircle,
  User,
  Sparkles,
  FileText,
  Trash2,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Tutor() {
  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  // --------------------------------------------------
  // Tutor
  // --------------------------------------------------

  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState("");

  // --------------------------------------------------
  // Load materials
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
    const newMaterialId = event.target.value;

    if (tutorLoading) {
      return;
    }

    setSelectedMaterialId(newMaterialId);

    // A new material should have its own conversation.
    setTutorMessages([]);
    setTutorQuestion("");
    setTutorError("");
  };

  // --------------------------------------------------
  // Ask tutor
  // --------------------------------------------------

  const handleAskTutor = async () => {
    const question = tutorQuestion.trim();

    if (
      !question ||
      tutorLoading ||
      !selectedMaterialId
    ) {
      return;
    }

    setTutorError("");

    // --------------------------------------------------
    // IMPORTANT:
    //
    // Send ONLY the previous conversation.
    // The current question is sent separately.
    //
    // This matches the working MaterialDetails flow.
    // --------------------------------------------------

    const conversationHistory =
      tutorMessages.slice(-10);

    // --------------------------------------------------
    // Optimistically add user message
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
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
            errorMessage = errorData.detail;
          }
        } catch {
          // Keep default error message.
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
      // Add AI response
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
      // Remove optimistic user message
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
  // No PDF materials
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
              using the AI Tutor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Main Tutor UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Bot size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#1F6F5F]">
                AI Tutor
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Ask questions and learn from your study material.
              </p>
            </div>
          </div>
        </div>

        {/* Material Selector */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="tutor-material"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Study Material
              </label>

              <select
                id="tutor-material"
                value={selectedMaterialId}
                onChange={handleMaterialChange}
                disabled={tutorLoading}
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
            </div>

            {selectedMaterial && (
              <div className="rounded-xl bg-[#F8F9F8] px-4 py-3 text-xs text-gray-500">
                <span className="font-semibold text-[#1F6F5F]">
                  PDF
                </span>{" "}
                • {selectedMaterial.size}
              </div>
            )}
          </div>
        </div>

        {/* Tutor Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Tutor Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <Sparkles size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-[#1F6F5F]">
                  {selectedMaterial
                    ? selectedMaterial.title
                    : "AI Tutor"}
                </h2>

                <p className="text-xs text-gray-400">
                  Document-grounded learning assistant
                </p>
              </div>
            </div>

            {tutorMessages.length > 0 && (
              <button
                onClick={handleClearChat}
                disabled={tutorLoading}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Clear Chat
              </button>
            )}
          </div>

          {/* Chat Area */}
          <div className="min-h-[520px] max-h-[680px] overflow-y-auto bg-[#F8F9F8] px-4 py-6 sm:px-6">

            {/* Empty State */}
            {tutorMessages.length === 0 && (
              <div className="mx-auto flex min-h-[420px] max-w-2xl flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                  <Bot size={28} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-700">
                  Hi! I'm your EduMind AI Tutor 👋
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                  Ask me anything about the selected study
                  material. I can explain concepts, definitions,
                  examples, and difficult topics in simple language.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() =>
                      setTutorQuestion(
                        "Explain the main concepts in this material."
                      )
                    }
                    disabled={tutorLoading}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Explain the main concepts
                  </button>

                  <button
                    onClick={() =>
                      setTutorQuestion(
                        "What are the most important topics for an exam?"
                      )
                    }
                    disabled={tutorLoading}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Exam important topics
                  </button>

                  <button
                    onClick={() =>
                      setTutorQuestion(
                        "Explain the difficult concepts in simple terms."
                      )
                    }
                    disabled={tutorLoading}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Explain simply
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {tutorMessages.length > 0 && (
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

                        {/* AI Avatar */}
                        {!isUser && (
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                            <Bot size={18} />
                          </div>
                        )}

                        {/* User */}
                        {isUser ? (
                          <div className="flex max-w-[82%] items-end gap-2">
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
                          /* AI */
                          <div className="max-w-[88%]">
                            <div className="mb-1 ml-1 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-[#1F6F5F]">
                                EduMind
                              </span>
                            </div>

                            <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-5 py-4 shadow-sm">
                              <ReactMarkdown
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="mb-3 mt-1 text-xl font-bold text-[#1F6F5F]">
                                      {children}
                                    </h1>
                                  ),

                                  h2: ({ children }) => (
                                    <h2 className="mb-3 mt-5 text-lg font-bold text-[#1F6F5F] first:mt-0">
                                      {children}
                                    </h2>
                                  ),

                                  h3: ({ children }) => (
                                    <h3 className="mb-2 mt-4 text-base font-bold text-[#1F6F5F] first:mt-0">
                                      {children}
                                    </h3>
                                  ),

                                  p: ({ children }) => (
                                    <p className="mb-3 text-sm leading-7 text-gray-700 last:mb-0">
                                      {children}
                                    </p>
                                  ),

                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-gray-900">
                                      {children}
                                    </strong>
                                  ),

                                  em: ({ children }) => (
                                    <em className="italic text-gray-600">
                                      {children}
                                    </em>
                                  ),

                                  ul: ({ children }) => (
                                    <ul className="mb-3 ml-5 list-disc space-y-1.5 text-sm leading-6 text-gray-700">
                                      {children}
                                    </ul>
                                  ),

                                  ol: ({ children }) => (
                                    <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-sm leading-6 text-gray-700">
                                      {children}
                                    </ol>
                                  ),

                                  li: ({ children }) => (
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

                                  table: ({ children }) => (
                                    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="min-w-full border-collapse text-left text-sm">
                                        {children}
                                      </table>
                                    </div>
                                  ),

                                  thead: ({ children }) => (
                                    <thead className="bg-[#F8F9F8]">
                                      {children}
                                    </thead>
                                  ),

                                  th: ({ children }) => (
                                    <th className="border-b border-gray-200 px-4 py-3 font-semibold text-[#1F6F5F]">
                                      {children}
                                    </th>
                                  ),

                                  td: ({ children }) => (
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

                {/* Loading */}
                {tutorLoading && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                      <Bot size={18} />
                    </div>

                    <div className="max-w-[88%]">
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
            )}
          </div>

          {/* Error */}
          {tutorError && (
            <div className="border-t border-gray-100 bg-red-50 px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={17} />
                <span>{tutorError}</span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 bg-white p-4 sm:p-5">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-3">
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
                    !tutorQuestion.trim() ||
                    !selectedMaterialId
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
        </div>
      </div>
    </div>
  );
}