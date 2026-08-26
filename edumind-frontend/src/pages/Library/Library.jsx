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

  /*
   * Fetch materials from FastAPI
   */
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

        setError(
          "Unable to load materials from the backend."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  /*
   * Upload material to FastAPI
   *
   * IMPORTANT:
   * This function receives the actual File object
   * from UploadModal.
   */
  const handleUpload = async (file) => {
    try {
      setError("");

      if (!(file instanceof File)) {
        console.error(
          "handleUpload expected a File but received:",
          file
        );

        setError(
          "No valid file was received from the upload component."
        );

        return false;
      }

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/materials/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to upload material.";

        try {
          const errorData = await response.json();

          console.error(
            "Upload API error:",
            errorData
          );

          if (errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail
                .map((item) => item.msg)
                .join(", ");
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(errorMessage);
      }

      const newMaterial = await response.json();

      console.log(
        "Material uploaded successfully:",
        newMaterial
      );

      /*
       * Add the material returned by FastAPI
       * to the React library immediately.
       */
      setUploadedMaterials((previous) => [
        newMaterial,
        ...previous,
      ]);

      /*
       * Tell UploadModal that everything succeeded.
       */
      return true;

    } catch (err) {
      console.error(
        "Error uploading material:",
        err
      );

      setError(
        err.message || "Unable to upload material."
      );

      return false;
    }
  };

  /*
   * Delete material from FastAPI
   */
  const handleDelete = async (id) => {
    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/materials/${id}`,
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
      console.error(
        "Error deleting material:",
        err
      );

      setError(
        "Unable to delete material."
      );
    }
  };

  /*
   * Rename material through FastAPI
   */
  const handleRename = async (id, newTitle) => {
    try {
      setError("");

      const params = new URLSearchParams({
        new_title: newTitle,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/api/materials/${id}?${params.toString()}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to rename material"
        );
      }

      const updatedMaterial =
        await response.json();

      setUploadedMaterials((previous) =>
        previous.map((material) =>
          material.id === id
            ? updatedMaterial
            : material
        )
      );

    } catch (err) {
      console.error(
        "Error renaming material:",
        err
      );

      setError(
        "Unable to rename material."
      );
    }
  };

  /*
   * Search, filter and sort
   */
  const displayedMaterials = useMemo(() => {
    let result = [...uploadedMaterials];

    // Search
    if (searchQuery.trim()) {
      result = result.filter((material) =>
        material.title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
      );
    }

    // Filter
    if (typeFilter !== "ALL") {
      result = result.filter(
        (material) =>
          material.type === typeFilter
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
            Upload failed
          </h3>

          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>

          <button
            onClick={() => setError("")}
            className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-100"
          >
            Dismiss
          </button>

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