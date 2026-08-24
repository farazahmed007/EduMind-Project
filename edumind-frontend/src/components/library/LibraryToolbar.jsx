import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Upload,
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
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* Search */}
        <div className="relative w-full lg:max-w-md">

          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your materials..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
          />

        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">

          {/* Filter */}
          <div className="relative">

            <SlidersHorizontal
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-gray-600 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
            >
              <option value="ALL">All Types</option>
              <option value="PDF">PDF</option>
              <option value="PPT">PPT</option>
              <option value="DOC">DOC</option>
            </select>

          </div>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
          >
            <option value="recent">Recently Added</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>

          {/* Upload */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1F6F5F] sm:flex-none"
          >
            <Upload size={17} />
            Upload Material
          </button>

        </div>

      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={onUpload}
      />
    </>
  );
}

export default LibraryToolbar;