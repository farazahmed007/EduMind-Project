import MaterialCard from "./MaterialCard";

function MaterialGrid({ uploadedMaterials = [] }) {
  return (
    <section className="mt-6">

      <div className="mb-4 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-semibold text-[#1F6F5F]">
            Your Materials
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {uploadedMaterials.length} materials in your library
          </p>
        </div>

      </div>

      {uploadedMaterials.length > 0 ? (

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {uploadedMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
            />
          ))}

        </div>

      ) : (

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6FCF97]/20 text-2xl">
            📚
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            No materials found
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Try changing your search or filter.
          </p>

        </div>

      )}

    </section>
  );
}

export default MaterialGrid;