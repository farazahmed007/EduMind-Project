import { useEffect, useMemo, useState } from "react";

import LibraryHeader from "../../components/library/LibraryHeader";
import LibraryToolbar from "../../components/library/LibraryToolbar";
import LibraryTabs from "../../components/library/LibraryTabs";
import MaterialGrid from "../../components/library/MaterialGrid";

const API_URL = "http://127.0.0.1:8000/api/materials";

function Library() {
  const [uploadedMaterials, setUploadedMaterials] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("recent");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH MATERIALS
  // =========================

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/`);

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

  // =========================
  // UPLOAD MATERIAL
  // =========================

  const handleUpload = async (file) => {
    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload material");
      }

      const newMaterial = await response.json();

      setUploadedMaterials((previous) => [
        newMaterial,
        ...previous,
      ]);
    } catch (err) {
      console.error("Error uploading material:", err);
      alert("Unable to upload material.");
    }
  };

  // =========================
  // DELETE MATERIAL
  // =========================

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete material");
      }

      setUploadedMaterials((previous) =>
        previous.filter(
          (material) => material.id !== id
        )
      );
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Unable to delete material.");
    }
  };

  // =========================
  // RENAME MATERIAL
  // =========================

  const handleRename = async (id, newTitle) => {
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      alert("Material title cannot be empty.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title: trimmedTitle,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to rename material");
      }

      const updatedMaterial = await response.json();

      setUploadedMaterials((previous) =>
        previous.map((material) =>
          material.id === id
            ? updatedMaterial
            : material
        )
      );

    } catch (err) {
      console.error("Error renaming material:", err);
      alert("Unable to rename material.");
    }
  };

  // =========================
  // SEARCH / FILTER / SORT
  // =========================

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

  // =========================
  // UI
  // =========================

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