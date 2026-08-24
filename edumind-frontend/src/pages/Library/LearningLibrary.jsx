import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import MaterialCard from "../../components/library/MaterialCard";

const materials = [
  {
    id: 1,
    title: "Machine Learning Fundamentals",
    type: "PDF",
    size: "2.4 MB",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "DBMS Unit 3",
    type: "PPT",
    size: "4.8 MB",
    time: "Yesterday",
  },
  {
    id: 3,
    title: "Computer Networks Notes",
    type: "PDF",
    size: "1.8 MB",
    time: "2 days ago",
  },
  {
    id: 4,
    title: "Software Engineering Chapter 2",
    type: "DOC",
    size: "950 KB",
    time: "3 days ago",
  },
];

export default function LearningLibrary() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");

  const filteredMaterials = useMemo(() => {
    let result = [...materials];

    // Search
    if (search.trim()) {
      result = result.filter((material) =>
        material.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter
    if (filter !== "All") {
      result = result.filter((material) => material.type === filter);
    }

    // Sort
    if (sort === "A-Z") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sort === "Z-A") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [search, filter, sort]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F6F5F]">
          Learning Library
        </h1>

        <p className="mt-1 text-gray-500">
          Organize and learn from all your study materials.
        </p>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row">

        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search your materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#1F6F5F]" />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#2FA084]"
          >
            <option value="All">All Types</option>
            <option value="PDF">PDF</option>
            <option value="PPT">PPT</option>
            <option value="DOC">DOC</option>
          </select>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-[#2FA084]"
        >
          <option value="Newest">Newest</option>
          <option value="A-Z">A-Z</option>
          <option value="Z-A">Z-A</option>
        </select>

      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Your Materials
        </h2>

        <span className="text-sm text-gray-500">
          {filteredMaterials.length} materials
        </span>
      </div>

      {/* Material Cards */}
      {filteredMaterials.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="font-medium text-gray-700">
            No materials found
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Try changing your search or filter.
          </p>
        </div>
      )}

    </div>
  );
}