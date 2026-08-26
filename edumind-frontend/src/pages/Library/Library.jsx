import { useEffect, useMemo, useState } from "react";

import LibraryHeader from "../../components/library/LibraryHeader";
import LibraryToolbar from "../../components/library/LibraryToolbar";
import LibraryTabs from "../../components/library/LibraryTabs";
import MaterialGrid from "../../components/library/MaterialGrid";

function Library() {
  const [uploadedMaterials, setUploadedMaterials] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("recent");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch materials from FastAPI
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/materials/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch materials");
        }

        const data = await response.json();

        setUploadedMaterials(data);
      } catch (err) {
        console.error("Error fetching materials:", err);
        setError("Unable to load materials from the backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleUpload = (file) => {
    const extension = file.name.split(".").pop().toUpperCase();

    const newMaterial = {
      id: Date.now(),
      title: file.name,
      type: extension === "PPTX" ? "PPT" : extension,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      time: "Just now",
    };

    setUploadedMaterials((previous) => [
      newMaterial,
      ...previous,
    ]);
  };

  const handleDelete = (id) => {
    setUploadedMaterials((previous) =>
      previous.filter((material) => material.id !== id)
    );
  };

  const handleRename = (id, newTitle) => {
    setUploadedMaterials((previous) =>
      previous.map((material) =>
        material.id === id
          ? { ...material, title: newTitle }
          : material
      )
    );
  };

  const displayedMaterials = useMemo(() => {
    let result = [...uploadedMaterials];

    // Search
    if (searchQuery.trim()) {
      result = result.filter((material) =>
        material.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Filter
    if (typeFilter !== "ALL") {
      result = result.filter(
        (material) => material.type === typeFilter
      );
    }

    // Sort
    if (sortOption === "name-asc") {
      result.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    if (sortOption === "name-desc") {
      result.sort((a, b) =>
        b.title.localeCompare(a.title)
      );
    }

    return result;
  }, [
    uploadedMaterials,
    searchQuery,
    typeFilter,
    sortOption,
  ]);

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

      <LibraryHeader />

      <LibraryToolbar
        onUpload={handleUpload}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      <LibraryTabs />

      {isLoading ? (
        <section className="mt-6 rounded-2xl bg-white px-6 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#2FA084]" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your materials...
          </p>
        </section>
      ) : error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-red-600">
            Failed to load materials
          </h3>

          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        </section>
      ) : (
        <MaterialGrid
          uploadedMaterials={displayedMaterials}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      )}

    </div>
  );
}

export default Library;