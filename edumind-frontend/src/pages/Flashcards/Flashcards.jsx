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
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Flashcards() {
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

  // --------------------------------------------------
  // Load available materials
  // --------------------------------------------------
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setMaterialsLoading(true);
        setMaterialsError("");

        const response = await fetch(
          `${API_BASE_URL}/api/materials/`
        );

        if (!response.ok) {
          throw new Error("Failed to load study materials.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid materials list.");
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
  }, []);

  // --------------------------------------------------
  // Selected material
  // --------------------------------------------------
  const selectedMaterial = useMemo(
    () =>
      materials.find(
        (material) =>
          String(material.id) === String(selectedMaterialId)
      ) || null,
    [materials, selectedMaterialId]
  );

  // --------------------------------------------------
  // Current flashcard
  // --------------------------------------------------
  const currentFlashcard =
    flashcards[currentIndex] || null;

  const progress =
    flashcards.length > 0
      ? ((currentIndex + 1) / flashcards.length) * 100
      : 0;

  // --------------------------------------------------
  // Record completed flashcard session for Analytics
  // --------------------------------------------------
  const recordFlashcardAnalytics = async (cardsReviewed) => {
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

  // --------------------------------------------------
  // Generate flashcards
  // --------------------------------------------------
  const handleGenerateFlashcards = async () => {
    if (!selectedMaterialId || generationLoading) {
      return;
    }

    setGenerationLoading(true);
    setGenerationError("");
    analyticsRecordedRef.current = false;
    setFlashcards([]);
    setCurrentIndex(0);
    setRevealed(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/materials/${selectedMaterialId}/flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

          if (errorData?.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : Array.isArray(errorData.detail)
                  ? errorData.detail
                      .map((item) => item.msg || String(item))
                      .join(", ")
                  : errorMessage;
          }
        } catch {
          // Keep the default message.
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

  // --------------------------------------------------
  // Reveal answer
  // --------------------------------------------------
  const handleReveal = () => {
    if (!currentFlashcard) {
      return;
    }

    setRevealed(true);

    if (currentIndex === flashcards.length - 1) {
      void recordFlashcardAnalytics(
        flashcards.length
      );
    }
  };

  // --------------------------------------------------
  // Next card
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Previous card
  // --------------------------------------------------
  const handlePrevious = () => {
    if (!flashcards.length || currentIndex <= 0) {
      return;
    }

    setCurrentIndex(
      (previousIndex) => previousIndex - 1
    );
    setRevealed(false);
  };

  // --------------------------------------------------
  // Reset / new set
  // --------------------------------------------------
  const handleNewSet = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setRevealed(false);
    setGenerationError("");
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------
  if (materialsLoading) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-[#2FA084]"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading your study materials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Materials load error
  // --------------------------------------------------
  if (materialsError) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
            <AlertCircle
              size={32}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-4 text-lg font-semibold text-red-700">
              Unable to load Flashcards
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {materialsError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // No materials
  // --------------------------------------------------
  if (materials.length === 0) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <BookOpen size={30} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#1F6F5F]">
              No Study Materials Yet
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              Upload a study material in the Learning Library first.
              EduMind will use it to generate revision flashcards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------
  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Layers3 size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#1F6F5F]">
                Flashcards
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Turn your study materials into quick revision cards.
              </p>
            </div>
          </div>
        </div>

        {/* Generation controls */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Sparkles
                size={19}
                className="text-[#2FA084]"
              />
              Create a Flashcard Set
            </h2>

            <p className="text-sm text-gray-500">
              Choose a material and let EduMind generate
              document-grounded revision cards.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Material */}
            <div className="md:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Study Material
              </label>

              <div className="relative">
                <FileText
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2FA084]"
                />

                <select
                  value={selectedMaterialId}
                  onChange={(event) => {
                    setSelectedMaterialId(event.target.value);
                    setFlashcards([]);
                    setCurrentIndex(0);
                    setRevealed(false);
                    setGenerationError("");
                  }}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
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
                <p className="mt-2 text-xs text-gray-400">
                  {selectedMaterial.type || "Material"}{" "}
                  {selectedMaterial.size
                    ? `• ${selectedMaterial.size}`
                    : ""}
                </p>
              )}
            </div>

            {/* Number of cards */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Number of Cards
              </label>

              <select
                value={numCards}
                onChange={(event) =>
                  setNumCards(Number(event.target.value))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
              >
                {[5, 10, 15, 20].map((count) => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count} cards
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Generate */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateFlashcards}
                disabled={
                  generationLoading ||
                  !selectedMaterialId
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generationLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Flashcards
                  </>
                )}
              </button>
            </div>
          </div>

          {generationError && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Flashcard generation failed
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {generationError}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Empty state */}
        {!currentFlashcard && !generationLoading && (
          <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Layers3 size={30} />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-800">
              Ready to revise?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Select your material above and generate a new set of
              flashcards to start studying.
            </p>
          </section>
        )}

        {/* Loading state */}
        {generationLoading && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <Loader2
              size={34}
              className="mx-auto animate-spin text-[#2FA084]"
            />

            <h2 className="mt-5 text-lg font-semibold text-gray-800">
              EduMind is creating your flashcards
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              This can take a little while because each card is
              generated from your study material.
            </p>
          </section>
        )}

        {/* Study area */}
        {currentFlashcard && !generationLoading && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Study header */}
            <div className="border-b border-gray-100 px-5 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                    <Layers3 size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-[#1F6F5F]">
                      EduMind Flashcards
                    </h2>

                    <p className="truncate text-sm text-gray-400">
                      {selectedMaterial?.title ||
                        "Study Material"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNewSet}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] sm:self-auto"
                >
                  <RotateCcw size={16} />
                  New Set
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="px-5 pt-7 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Card {currentIndex + 1} of{" "}
                  {flashcards.length}
                </p>

                <span className="rounded-full bg-[#6FCF97]/20 px-3 py-1 text-xs font-semibold text-[#1F6F5F]">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#2FA084] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div className="px-5 py-7 sm:px-8 sm:py-8">
              <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white px-6 py-12 shadow-sm sm:px-12 sm:py-16">
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <span className="rounded-full bg-[#6FCF97]/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#1F6F5F]">
                    {revealed ? "Answer" : "Question"}
                  </span>

                  <div className="mt-7 max-w-3xl">
                    <p
                      className={`text-xl font-semibold leading-relaxed sm:text-3xl ${
                        revealed
                          ? "text-[#1F6F5F]"
                          : "text-gray-800"
                      }`}
                    >
                      {revealed
                        ? currentFlashcard.back
                        : currentFlashcard.front}
                    </p>
                  </div>

                  {!revealed && (
                    <button
                      onClick={handleReveal}
                      className="mt-10 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
                    >
                      <Eye size={17} />
                      Reveal Answer
                    </button>
                  )}

                  {revealed && (
                    <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#6FCF97]/15 px-4 py-2 text-xs font-medium text-[#1F6F5F]">
                      <Eye size={15} />
                      Answer revealed
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="mx-auto mt-6 flex max-w-4xl items-center justify-between gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-[#6FCF97] hover:text-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <button
                  onClick={
                    revealed
                      ? handleNext
                      : handleReveal
                  }
                  disabled={
                    revealed &&
                    currentIndex >=
                      flashcards.length - 1
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {revealed ? (
                    <>
                      Next
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <Eye size={17} />
                      Reveal Answer
                    </>
                  )}
                </button>
              </div>

              {revealed &&
                currentIndex ===
                  flashcards.length - 1 && (
                  <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-[#1F6F5F]">
                      You reached the end of this set.
                    </p>

                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={generationLoading}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#6FCF97] bg-[#6FCF97]/10 px-4 py-2.5 text-sm font-semibold text-[#1F6F5F] transition hover:bg-[#6FCF97]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Generate Another Set
                    </button>
                  </div>
                )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
