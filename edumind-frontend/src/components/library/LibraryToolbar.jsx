import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Upload,
  ArrowUpDown,
} from "lucide-react";

import UploadModal from "./UploadModal";

function LibraryToolbar({
  onUpload,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  sortOption,
  setSortOption,
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      <section className="mt-5 rounded-[22px] border border-[#dfe9e5] bg-white p-3 shadow-[0_5px_24px_rgba(23,33,30,0.045)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {/* Search */}
          <div className="relative min-w-0 flex-1 xl:max-w-[540px]">
            <Search
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c9b95]"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your materials..."
              aria-label="Search your materials"
              className="h-11.5 w-full rounded-xl border border-[#e1e9e5] bg-[#f7faf9] pl-11 pr-4 text-sm font-medium text-[#25322e] outline-none transition-all duration-200 placeholder:text-[#9aa7a2] hover:border-[#cddbd5] hover:bg-white focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
            {/* Type Filter */}
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <SlidersHorizontal
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9089]"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter materials by type"
                className="h-11.5 w-full appearance-none rounded-xl border border-[#e1e9e5] bg-[#f7faf9] pl-10 pr-10 text-sm font-semibold text-[#53635d] outline-none transition-all duration-200 hover:border-[#cddbd5] hover:bg-white focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10 sm:w-[150px]"
              >
                <option value="ALL">All Types</option>
                <option value="PDF">PDF</option>
                <option value="PPT">PPT</option>
                <option value="DOC">DOC</option>
              </select>

              <span className="pointer-events-none absolute right-3.5 top-1/2 h-0 w-0 -translate-y-[35%] border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#8a9993]" />
            </div>

            {/* Sort */}
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <ArrowUpDown
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9089]"
              />

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                aria-label="Sort materials"
                className="h-11.5 w-full appearance-none rounded-xl border border-[#e1e9e5] bg-[#f7faf9] pl-10 pr-10 text-sm font-semibold text-[#53635d] outline-none transition-all duration-200 hover:border-[#cddbd5] hover:bg-white focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10 sm:w-[180px]"
              >
                <option value="recent">Recently Added</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
              </select>

              <span className="pointer-events-none absolute right-3.5 top-1/2 h-0 w-0 -translate-y-[35%] border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#8a9993]" />
            </div>

            {/* Upload */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="group flex h-11.5 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(47,160,132,0.20)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#1f6f5f] hover:shadow-[0_9px_22px_rgba(47,160,132,0.25)] active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/25 sm:flex-none"
            >
              <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-white/15 transition-transform duration-200 group-hover:scale-105">
                <Upload
                  size={15}
                  strokeWidth={2.3}
                />
              </span>

              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </section>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={onUpload}
      />
    </>
  );
}

export default LibraryToolbar;