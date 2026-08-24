import { BookOpen } from "lucide-react";

function LibraryHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
          <BookOpen size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1F6F5F] sm:text-3xl">
            Learning Library
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Organize, explore, and learn from your study materials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LibraryHeader;