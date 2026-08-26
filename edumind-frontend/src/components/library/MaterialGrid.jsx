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
    <section className="mt-6">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-[#1F6F5F]">
            Your Materials
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {uploadedMaterials.length}{" "}
            {uploadedMaterials.length === 1 ? "material" : "materials"}{" "}
            in your library
          </p>
        </div>

      </div>

      {/* Materials */}
      {hasMaterials ? (

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

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

        /* Empty / No Results State */
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-3xl">
            {hasSearchQuery ? "🔍" : "📚"}
          </div>

          {/* Title */}
          <h3 className="mt-5 text-lg font-semibold text-gray-700">
            {hasSearchQuery
              ? "No materials found"
              : "Your library is empty"}
          </h3>

          {/* Description */}
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            {hasSearchQuery
              ? `We couldn't find any materials matching "${searchQuery}".`
              : "Start building your personal learning library by uploading your first study material."}
          </p>

          {/* Action */}
          {hasSearchQuery && onClearSearch ? (

            <button
              onClick={onClearSearch}
              className="mt-5 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
            >
              Clear Search
            </button>

          ) : (

            <p className="mt-5 text-xs font-medium text-[#1F6F5F]">
              Upload a PDF, PPT, or document to get started.
            </p>

          )}

        </div>

      )}

    </section>
  );
}

export default MaterialGrid;