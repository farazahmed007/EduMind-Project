import {
  BookOpen,
  FolderOpen,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import MaterialCard from "./MaterialCard";

function MaterialGrid({
  uploadedMaterials = [],
  onDelete,
  onRename,
  searchQuery = "",
  onClearSearch,
}) {
  const hasMaterials = uploadedMaterials.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <section className="mt-7">
      {/* Section Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#90a19b]">
              Library collection
            </span>

            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e8f6f0] text-[#6fcf97]">
              <Sparkles size={11} />
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-[-0.025em] text-[#176b5b]">
            Your Materials
          </h2>

          <p className="mt-1 text-sm font-medium text-[#7c8b86]">
            {uploadedMaterials.length}{" "}
            {uploadedMaterials.length === 1
              ? "material"
              : "materials"}{" "}
            available for learning
          </p>
        </div>

        {hasMaterials && (
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-[#dfe9e5] bg-white px-3.5 py-2.5 shadow-[0_3px_14px_rgba(23,33,30,0.035)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#dceee6] bg-[#e8f6f0] text-[#2fa084]">
              <FolderOpen
                size={16}
                strokeWidth={2}
              />
            </span>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa7a2]">
                Collection
              </p>

              <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                Organized learning workspace
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Material Cards */}
      {hasMaterials ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
          {uploadedMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      ) : (
        /* Premium Empty State */
        <div className="overflow-hidden rounded-[26px] border border-dashed border-[#d8e5df] bg-white shadow-[0_7px_28px_rgba(23,33,30,0.04)]">
          <div className="relative px-6 py-16 text-center sm:px-8 sm:py-20">
            {/* Decorative background */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-16 right-1/4 h-32 w-32 rounded-full bg-[#cdeee1]/20 blur-3xl" />

            {/* Icon */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
              <div className="absolute inset-2 rounded-[18px] border border-[#d7eee4]" />

              {hasSearchQuery ? (
                <Search
                  size={32}
                  strokeWidth={1.9}
                />
              ) : (
                <BookOpen
                  size={32}
                  strokeWidth={1.9}
                />
              )}
            </div>

            {/* Title */}
            <h3 className="relative mt-6 text-2xl font-bold tracking-[-0.025em] text-[#25322e]">
              {hasSearchQuery
                ? "No materials found"
                : "Your learning library is empty"}
            </h3>

            {/* Description */}
            <p className="relative mx-auto mt-3 max-w-lg text-sm leading-7 text-[#7c8b86]">
              {hasSearchQuery
                ? `We couldn't find anything matching "${searchQuery}". Try a different keyword or clear the search.`
                : "Build your personal AI-powered learning workspace by uploading PDFs, presentations, and study documents."}
            </p>

            {/* Action */}
            {hasSearchQuery && onClearSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="group relative mt-7 inline-flex items-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_10px_22px_rgba(47,160,132,0.22)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/25"
              >
                Clear Search

                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            ) : (
              <div className="relative mt-7 inline-flex items-center gap-2 rounded-full border border-[#d8e8e1] bg-[#f7faf9] px-4 py-2.5 text-xs font-semibold text-[#5b6b65]">
                <BookOpen
                  size={14}
                  className="text-[#2fa084]"
                />

                Upload your first PDF, PPT, or DOC
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default MaterialGrid;