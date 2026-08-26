cat > src/pages/Library/LearningLibrary.jsx <<'EOF'
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Upload,
  Loader2,
} from "lucide-react";
import MaterialCard from "../../components/library/MaterialCard";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function LearningLibrary() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // --------------------------------------------------
  // LOAD MATERIALS FROM FASTAPI
  // --------------------------------------------------

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/materials/`
      );

      if (!response.ok) {
        throw new Error("Failed to load materials.");
      }

      const data = await response.json();

      setMaterials(data);
    } catch (err) {
      console.error("Error loading materials:", err);
      setError(
        "Unable to load your materials. Make sure the FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // --------------------------------------------------
  // UPLOAD MATERIAL
  // --------------------------------------------------

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/materials/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      // Clear file input so the same file can be selected again
      event.target.value = "";

      // Reload materials from backend
      await fetchMaterials();

    } catch (err) {
      console.error("Upload error:", err);
      setError("Unable to upload the material.");
    } finally {
      setUploading(false);
    }
  };

  // --------------------------------------------------
  // SEARCH / FILTER / SORT
  // --------------------------------------------------

  const filteredMaterials = useMemo(() => {
    let result = [...materials];

    // Search
    if (search.trim()) {
      const searchTerm = search.toLowerCase();

      result = result.filter((material) =>
        material.title?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter
    if (filter !== "All") {
      result = result.filter(
        (material) =>
          material.type?.toUpperCase() === filter.toUpperCase()
      );
    }

    // Sort
    if (sort === "A-Z") {
      result.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    }

    if (sort === "Z-A") {
      result.sort((a, b) =>
        (b.title || "").localeCompare(a.title || "")
      );
    }

    if (sort === "Newest") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [materials, search, filter, sort]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
          <SlidersHorizontal
            size={18}
            className="text-[#1F6F5F]"
          />

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
          <option value="Newest">Recently Added</option>
          <option value="A-Z">A-Z</option>
          <option value="Z-A">Z-A</option>
        </select>

        {/* Upload */}
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#258b72] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload Material
            </>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
          onChange={handleFileUpload}
        />

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Your Materials
        </h2>

        <span className="text-sm text-gray-500">
          {materials.length}{" "}
          {materials.length === 1 ? "material" : "materials"} in your library
        </span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2
              size={22}
              className="animate-spin text-[#2FA084]"
            />
            Loading your materials...
          </div>
        </div>
      ) : filteredMaterials.length > 0 ? (

        /* Material Cards */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
            />
          ))}
        </div>

      ) : (

        /* Empty State */
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="font-medium text-gray-700">
            {materials.length === 0
              ? "Your library is empty"
              : "No materials found"}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            {materials.length === 0
              ? "Upload your first study material to get started."
              : "Try changing your search or filter."}
          </p>
        </div>

      )}

    </div>
  );
}
EOF