import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layers3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CARD_OPTIONS = [5, 10, 15, 20];

const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    description: "Quick recall",
    icon: Zap,
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced review",
    icon: Target,
  },
  {
    value: "hard",
    label: "Hard",
    description: "Deep recall",
    icon: Brain,
  },
];

export default function Flashcards() {
  const { token } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");

  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  const analyticsRecordedRef = useRef(false);

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchMaterials = async () => {
      try {
        setMaterialsLoading(true);
        setMaterialsError("");

        const response = await fetch(
          `${API_BASE_URL}/api/materials/`,
          {
            headers: authHeaders,
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          throw new Error("Failed to load study materials.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an invalid materials list."
          );
        }

        setMaterials(data);

        if (data.length > 0) {
          setSelectedMaterialId(String(data[0].id));
        }
      } catch (error) {
        console.error("Error loading materials:", error);

        setMaterialsError(
          error.message ||
            "Unable to load your study materials."
        );
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMaterials();
  }, [token, authHeaders]);

  const selectedMaterial = useMemo(
    () =>
      materials.find(
        (material) =>
          String(material.id) ===
          String(selectedMaterialId)
      ) || null,
    [materials, selectedMaterialId]
  );

  const currentFlashcard =
    flashcards[currentIndex] || null;

  const progress =
    flashcards.length > 0
      ? ((currentIndex + 1) / flashcards.length) * 100
      : 0;

  const isLastCard =
    flashcards.length > 0 &&
    currentIndex === flashcards.length - 1;

  const resetStudyState = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setRevealed(false);
  };

  const recordFlashcardAnalytics = async (
    cardsReviewed
  ) => {
    if (analyticsRecordedRef.current) {
      return;
    }

    analyticsRecordedRef.current = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/flashcard-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            material_id: Number(selectedMaterialId),
            cards_reviewed: Number(cardsReviewed),
            difficulty,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to record flashcard analytics."
        );
      }

      console.log(
        "Flashcard analytics recorded successfully."
      );
    } catch (error) {
      console.error(
        "Error recording flashcard analytics:",
        error
      );

      analyticsRecordedRef.current = false;
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedMaterialId || generationLoading) {
      return;
    }

    setGenerationLoading(true);
    setGenerationError("");
    analyticsRecordedRef.current = false;
    resetStudyState();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            num_cards: Number(numCards),
            difficulty,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to generate flashcards.";

        try {
          const errorData = await response.json();

          if (response.status === 401) {
            errorMessage =
              "Your session has expired. Please log in again.";
          } else if (errorData?.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : Array.isArray(errorData.detail)
                ? errorData.detail
                    .map(
                      (item) =>
                        item.msg || String(item)
                    )
                    .join(", ")
                : errorMessage;
          }
        } catch {
          if (response.status === 401) {
            errorMessage =
              "Your session has expired. Please log in again.";
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (
        !data?.flashcards ||
        !Array.isArray(data.flashcards) ||
        data.flashcards.length === 0
      ) {
        throw new Error(
          "The server returned an empty flashcard set."
        );
      }

      setFlashcards(data.flashcards);
      setCurrentIndex(0);
      setRevealed(false);
    } catch (error) {
      console.error(
        "Error generating flashcards:",
        error
      );

      setGenerationError(
        error.message ||
          "Something went wrong while generating flashcards."
      );
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleReveal = () => {
    if (!currentFlashcard) {
      return;
    }

    setRevealed(true);

    if (isLastCard) {
      void recordFlashcardAnalytics(
        flashcards.length
      );
    }
  };

  const handleNext = () => {
    if (
      !flashcards.length ||
      currentIndex >= flashcards.length - 1
    ) {
      return;
    }

    setCurrentIndex(
      (previousIndex) => previousIndex + 1
    );
    setRevealed(false);
  };

  const handlePrevious = () => {
    if (
      !flashcards.length ||
      currentIndex <= 0
    ) {
      return;
    }

    setCurrentIndex(
      (previousIndex) => previousIndex - 1
    );
    setRevealed(false);
  };

  const handleNewSet = () => {
    resetStudyState();
    setGenerationError("");
    analyticsRecordedRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!currentFlashcard || generationLoading) {
        return;
      }

      if (
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();

        if (!revealed) {
          handleReveal();
        }
      }

      if (
        event.key === "ArrowRight" &&
        revealed &&
        !isLastCard
      ) {
        handleNext();
      }

      if (
        event.key === "ArrowLeft" &&
        currentIndex > 0
      ) {
        handlePrevious();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    currentFlashcard,
    generationLoading,
    revealed,
    currentIndex,
    isLastCard,
  ]);

  if (materialsLoading) {
    return (
      <div className="min-h-full bg-[#f4f7f6]">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[620px] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md rounded-[28px] border border-[#dfeae5] bg-white p-10 text-center shadow-[0_12px_40px_rgba(23,33,30,0.05)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#2fa084]">
                <Loader2
                  size={28}
                  className="animate-spin"
                />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#23453d]">
                Loading your library
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-[#84918c]">
                Preparing your study materials for
                flashcard generation.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (materialsError) {
    return (
      <div className="min-h-full bg-[#f4f7f6]">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[620px] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg rounded-[28px] border border-[#f0d8d8] bg-white p-10 text-center shadow-[0_12px_40px_rgba(23,33,30,0.05)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#c96363]">
                <AlertCircle size={30} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#8f4c4c]">
                Unable to load Flashcards
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-[#a86868]">
                {materialsError}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="min-h-full bg-[#f4f7f6]">
        <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="flex min-h-[620px] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl rounded-[30px] border border-[#dfeae5] bg-white p-10 text-center shadow-[0_12px_40px_rgba(23,33,30,0.05)] sm:p-14"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f]">
                <Layers3 size={34} />
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white">
                  <Sparkles
                    size={10}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ba097]">
                Start your revision
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#176b5b] sm:text-3xl">
                No study materials yet
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-[#7d8b86]">
                Upload a study material in the Learning
                Library first. EduMind will use it to
                generate document-grounded revision
                flashcards.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-5 sm:px-6 sm:pt-6 lg:px-8 xl:px-10">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#f0faf6] px-5 py-6 shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:px-7 sm:py-7 lg:px-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#cdeee1]/25 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                <Layers3
                  size={25}
                  strokeWidth={2}
                />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles
                    size={9}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c938a]">
                    Active learning
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[10px] font-semibold text-[#2fa084]">
                    AI-generated revision
                  </span>
                </div>

                <h1 className="text-[26px] font-bold tracking-[-0.035em] text-[#176b5b] sm:text-[30px]">
                  Flashcards
                </h1>

                <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#7b8984]">
                  Turn your study material into focused
                  recall practice that helps concepts stick.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-[#dfeae5] bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                <Brain size={17} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#98a6a1]">
                  Learning mode
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                  Active recall
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mt-6 overflow-hidden rounded-[28px] border border-[#dfeae5] bg-white shadow-[0_8px_32px_rgba(23,33,30,0.045)]"
        >
          <div className="border-b border-[#edf2ef] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                  <Sparkles
                    size={15}
                    strokeWidth={2.2}
                  />
                </div>

                <h2 className="text-base font-bold text-[#30443e]">
                  Create a flashcard set
                </h2>
              </div>

              <p className="pl-10 text-xs font-medium leading-5 text-[#89958f]">
                Configure your revision session and let
                EduMind generate cards directly from your
                material.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#71827b]">
                  Study material
                </label>

                {selectedMaterial && (
                  <span className="max-w-[55%] truncate rounded-full bg-[#f1f7f4] px-2.5 py-1 text-[10px] font-semibold text-[#658078]">
                    {selectedMaterial.type ||
                      "Material"}
                  </span>
                )}
              </div>

              <div className="relative">
                <FileText
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2fa084]"
                />

                <select
                  value={selectedMaterialId}
                  onChange={(event) => {
                    setSelectedMaterialId(
                      event.target.value
                    );
                    resetStudyState();
                    setGenerationError("");
                    analyticsRecordedRef.current =
                      false;
                  }}
                  className="w-full appearance-none rounded-xl border border-[#dfe8e4] bg-[#fbfcfc] px-11 py-3.5 pr-11 text-sm font-medium text-[#43534d] outline-none transition-all duration-200 hover:border-[#c7dcd4] focus:border-[#2fa084] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/15"
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

                <ChevronRight
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#8b9b95]"
                />
              </div>

              {selectedMaterial && (
                <p className="mt-2 text-[11px] font-medium text-[#9aa6a1]">
                  {selectedMaterial.title}
                  {selectedMaterial.size
                    ? ` • ${selectedMaterial.size}`
                    : ""}
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#71827b]">
                    Number of cards
                  </label>

                  <span className="rounded-full bg-[#e8f6f0] px-2.5 py-1 text-[10px] font-bold text-[#2fa084]">
                    {numCards} cards
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CARD_OPTIONS.map((count) => {
                    const active =
                      numCards === count;

                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() =>
                          setNumCards(count)
                        }
                        className={`
                          rounded-xl border px-2 py-3
                          text-sm font-bold
                          transition-all duration-200
                          ${
                            active
                              ? "border-[#9bd9c2] bg-[#e8f6f0] text-[#1f6f5f] shadow-[inset_0_0_0_1px_rgba(47,160,132,0.08)]"
                              : "border-[#e4ebe8] bg-white text-[#788781] hover:border-[#c9ddd5] hover:bg-[#f8fbfa] hover:text-[#1f6f5f]"
                          }
                        `}
                      >
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#71827b]">
                    Difficulty
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map(
                    (option) => {
                      const Icon = option.icon;
                      const active =
                        difficulty === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setDifficulty(
                              option.value
                            )
                          }
                          className={`
                            group rounded-xl border p-3 text-left
                            transition-all duration-200
                            ${
                              active
                                ? "border-[#9bd9c2] bg-[#e8f6f0] shadow-[inset_0_0_0_1px_rgba(47,160,132,0.08)]"
                                : "border-[#e4ebe8] bg-white hover:border-[#c9ddd5] hover:bg-[#f8fbfa]"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                transition-colors
                                ${
                                  active
                                    ? "bg-white text-[#2fa084] shadow-sm"
                                    : "bg-[#f3f7f5] text-[#899892] group-hover:text-[#2fa084]"
                                }
                              `}
                            >
                              <Icon size={15} />
                            </span>

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold ${
                                  active
                                    ? "text-[#1f6f5f]"
                                    : "text-[#52625c]"
                                }`}
                              >
                                {option.label}
                              </p>

                              <p className="mt-0.5 truncate text-[9px] font-medium text-[#96a19d]">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[#edf2ef] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#89958f]">
                <CheckCircle2
                  size={14}
                  className="text-[#2fa084]"
                />
                Generated from your selected material
              </div>

              <button
                onClick={handleGenerateFlashcards}
                disabled={
                  generationLoading ||
                  !selectedMaterialId
                }
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_10px_24px_rgba(31,111,95,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {generationLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Generating cards...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Generate Flashcards
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>

            {generationError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-start gap-3 rounded-xl border border-[#f0d8d8] bg-[#fff7f7] p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fde8e8] text-[#c96363]">
                  <AlertCircle size={16} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#9a5555]">
                    Flashcard generation failed
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-[#a86868]">
                    {generationError}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {!currentFlashcard &&
          !generationLoading && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="relative mt-6 overflow-hidden rounded-[28px] border border-dashed border-[#ccdcd5] bg-white px-6 py-16 text-center shadow-[0_6px_24px_rgba(23,33,30,0.025)] sm:py-20"
            >
              <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f6f0] text-[#1f6f5f]">
                  <Layers3 size={29} />
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#94a39d]">
                  Your next revision session
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#30443e] sm:text-2xl">
                  Ready to test your memory?
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-[#89958f]">
                  Generate a set above and use active
                  recall to turn your notes into knowledge.
                </p>
              </div>
            </motion.section>
          )}

        {generationLoading && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-6 overflow-hidden rounded-[28px] border border-[#dfeae5] bg-white px-6 py-16 text-center shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:py-20"
          >
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.04, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mx-auto flex h-18 w-18 items-center justify-center rounded-[22px] border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084]"
              >
                <Sparkles size={30} />
              </motion.div>

              <h2 className="mt-6 text-xl font-bold text-[#30443e]">
                EduMind is creating your flashcards
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#89958f]">
                Your material is being transformed into
                focused revision cards.
              </p>

              <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#edf3f0]">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-full w-1/2 rounded-full bg-[#2fa084]"
                />
              </div>
            </div>
          </motion.section>
        )}

        {currentFlashcard &&
          !generationLoading && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 overflow-hidden rounded-[28px] border border-[#dfeae5] bg-white shadow-[0_8px_32px_rgba(23,33,30,0.045)]"
            >
              <div className="border-b border-[#edf2ef] px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                      <Layers3 size={21} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-bold text-[#30443e]">
                          Flashcard Session
                        </h2>

                        <span className="hidden rounded-full bg-[#e8f6f0] px-2 py-0.5 text-[9px] font-bold text-[#2fa084] sm:inline-flex">
                          ACTIVE RECALL
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs font-medium text-[#98a39f]">
                        {selectedMaterial?.title ||
                          "Study Material"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleNewSet}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#dfe8e4] bg-white px-4 py-2.5 text-xs font-bold text-[#65756e] transition-all duration-200 hover:border-[#bcd8cd] hover:bg-[#f8fbfa] hover:text-[#1f6f5f] sm:self-auto"
                  >
                    <RotateCcw size={15} />
                    New Set
                  </button>
                </div>
              </div>

              <div className="px-5 pt-6 sm:px-8 sm:pt-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c9994]">
                      Progress
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#52635c]">
                      Card {currentIndex + 1}
                      <span className="px-1 font-medium text-[#a1aca8]">
                        /
                      </span>
                      {flashcards.length}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold tracking-tight text-[#1f6f5f]">
                      {Math.round(progress)}%
                    </p>

                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#a0aba6]">
                      Complete
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf3f0]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: 0.45,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-[#2fa084] to-[#6fcf97]"
                  />
                </div>
              </div>

              <div className="px-5 py-7 sm:px-8 sm:py-9">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dceee6] bg-[#f4faf7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#2fa084]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />
                      {revealed
                        ? "Answer"
                        : "Question"}
                    </span>

                    <span className="text-[10px] font-semibold text-[#a0aba6]">
                      Space / Enter to reveal
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-x-6 bottom-[-10px] top-4 rounded-[28px] border border-[#e8efec] bg-[#f7faf9]" />

                    <div className="relative min-h-[350px] overflow-hidden rounded-[28px] border border-[#dfe9e4] bg-gradient-to-br from-white via-white to-[#f5faf8] p-7 shadow-[0_18px_45px_rgba(23,33,30,0.08)] sm:min-h-[390px] sm:p-12">
                      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#6fcf97]/10 blur-3xl" />

                      <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-[#cdeee1]/20 blur-3xl" />

                      <div className="relative flex min-h-[290px] flex-col items-center justify-center text-center sm:min-h-[320px]">
                        <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-[#dceee6] bg-[#f3faf7] text-[#2fa084]">
                          {revealed ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Brain size={20} />
                          )}
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${currentIndex}-${revealed}`}
                            initial={{
                              opacity: 0,
                              y: 10,
                              scale: 0.985,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -8,
                              scale: 0.985,
                            }}
                            transition={{
                              duration: 0.22,
                            }}
                            className="max-w-3xl"
                          >
                            <p
                              className={`text-lg font-semibold leading-relaxed sm:text-[28px] ${
                                revealed
                                  ? "text-[#1f6f5f]"
                                  : "text-[#30443e]"
                              }`}
                            >
                              {revealed
                                ? currentFlashcard.back
                                : currentFlashcard.front}
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {!revealed && (
                          <motion.button
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay: 0.1,
                            }}
                            onClick={handleReveal}
                            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_10px_24px_rgba(31,111,95,0.22)]"
                          >
                            <Eye size={17} />
                            Reveal Answer
                          </motion.button>
                        )}

                        {revealed && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#dceee6] bg-[#f3faf7] px-4 py-2.5 text-[11px] font-bold text-[#2fa084]"
                          >
                            <CheckCircle2 size={14} />
                            Answer revealed
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#dfe8e4] bg-white px-4 py-3 text-xs font-bold text-[#66766f] shadow-sm transition-all duration-200 hover:border-[#bfd9cf] hover:bg-[#f8fbfa] hover:text-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronLeft size={17} />
                      <span className="hidden sm:inline">
                        Previous
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {flashcards
                        .slice(0, 10)
                        .map((_, index) => (
                          <span
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              index === currentIndex
                                ? "w-5 bg-[#2fa084]"
                                : index <
                                  currentIndex
                                ? "w-1.5 bg-[#9bd9c2]"
                                : "w-1.5 bg-[#dfe8e4]"
                            }`}
                          />
                        ))}

                      {flashcards.length > 10 && (
                        <span className="ml-1 text-[9px] font-bold text-[#a0aba6]">
                          +{flashcards.length - 10}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={
                        revealed
                          ? handleNext
                          : handleReveal
                      }
                      disabled={
                        revealed && isLastCard
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
                    >
                      {revealed ? (
                        <>
                          <span className="hidden sm:inline">
                            Next Card
                          </span>
                          <span className="sm:hidden">
                            Next
                          </span>
                          <ChevronRight size={17} />
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Reveal
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-[#9aa6a1]">
                    <span className="hidden sm:inline">
                      ← Previous
                    </span>

                    <span className="hidden h-1 w-1 rounded-full bg-[#c7d5cf] sm:block" />

                    <span>
                      Use your keyboard to navigate
                    </span>

                    <span className="hidden h-1 w-1 rounded-full bg-[#c7d5cf] sm:block" />

                    <span className="hidden sm:inline">
                      Next →
                    </span>
                  </div>

                  {revealed && isLastCard && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mt-7 rounded-2xl border border-[#cdeee1] bg-gradient-to-r from-[#f3faf7] to-[#edf8f3] p-5 text-center"
                    >
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2fa084] shadow-sm">
                        <CheckCircle2 size={19} />
                      </div>

                      <p className="mt-3 text-sm font-bold text-[#1f6f5f]">
                        You completed this set
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#769088]">
                        Nice work. Keep the momentum going
                        with another focused revision set.
                      </p>

                      <button
                        onClick={
                          handleGenerateFlashcards
                        }
                        disabled={generationLoading}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#9bd9c2] bg-white px-4 py-2.5 text-xs font-bold text-[#1f6f5f] shadow-sm transition-all duration-200 hover:bg-[#e8f6f0] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw size={15} />
                        Generate Another Set
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-[#9aa6a1]">
          <BookOpen size={12} />
          EduMind • Learn from your own materials
        </div>
      </div>
    </div>
  );
}