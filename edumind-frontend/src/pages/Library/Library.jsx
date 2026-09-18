import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import LibraryHeader from "../../components/library/LibraryHeader";
import LibraryToolbar from "../../components/library/LibraryToolbar";
import LibraryTabs from "../../components/library/LibraryTabs";
import MaterialGrid from "../../components/library/MaterialGrid";
import { useAuth } from "../../context/AuthContext";

function Library() {
  const { token } = useAuth();

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
    if (!token) {
      return;
    }

    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/materials/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch materials"
          );
        }

        const data = await response.json();

        setUploadedMaterials(data);
      } catch (err) {
        console.error(
          "Error fetching materials:",
          err
        );

        setError(
          "Unable to load materials from the backend."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [token]);

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

      if (!token) {
        setError(
          "You must be logged in to upload materials."
        );

        return false;
      }

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/materials/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to upload material.";

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

      const newMaterial =
        await response.json();

      console.log(
        "Material uploaded successfully:",
        newMaterial
      );

      setUploadedMaterials((previous) => [
        newMaterial,
        ...previous,
      ]);

      return true;
    } catch (err) {
      console.error(
        "Error uploading material:",
        err
      );

      setError(
        err.message ||
          "Unable to upload material."
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

      if (!token) {
        setError(
          "You must be logged in to delete materials."
        );

        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/materials/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete material"
        );
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

  const handleRename = async (
    id,
    newTitle
  ) => {
    try {
      setError("");

      if (!token) {
        setError(
          "You must be logged in to rename materials."
        );

        return;
      }

      const params = new URLSearchParams({
        new_title: newTitle,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/api/materials/${id}?${params.toString()}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    if (searchQuery.trim()) {
      result = result.filter((material) =>
        material.title
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
      );
    }

    if (typeFilter !== "ALL") {
      result = result.filter(
        (material) =>
          material.type === typeFilter
      );
    }

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
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-5 sm:px-6 sm:pb-14 lg:px-8 lg:pt-6 xl:px-10">
        {/* Page Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
        >
          <LibraryHeader />
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.05,
            ease: "easeOut",
          }}
          className="mt-5"
        >
          <LibraryToolbar
            onUpload={handleUpload}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: 0.1,
            ease: "easeOut",
          }}
          className="mt-1"
        >
          <LibraryTabs />
        </motion.div>

        {/* Error State */}
        {error && !isLoading && (
          <motion.section
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 overflow-hidden rounded-[22px] border border-[#f0d7d7] bg-white shadow-[0_6px_24px_rgba(23,33,30,0.045)]"
          >
            <div className="relative flex items-start gap-3.5 p-4 sm:p-5">
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[#fde8e8]/60 blur-2xl" />

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f2d6d6] bg-[#fff0f0] text-[#c96363]">
                <AlertCircle
                  size={18}
                  strokeWidth={2.2}
                />
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#8f4545]">
                    Something went wrong
                  </p>

                  <span className="hidden h-1 w-1 rounded-full bg-[#e4b1b1] sm:block" />

                  <span className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#b47a7a] sm:block">
                    Library
                  </span>
                </div>

                <p className="mt-1 text-xs font-medium leading-5 text-[#9b6868] sm:text-sm">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a77a7a] transition-all duration-150 hover:bg-[#fff3f3] hover:text-[#c96363] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0baba]/50"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          </motion.section>
        )}

        {/* Content */}
        {isLoading ? (
          <motion.section
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mt-6 overflow-hidden rounded-[26px] border border-[#e2ebe7] bg-white shadow-[0_7px_28px_rgba(23,33,30,0.04)]"
          >
            <div className="relative flex min-h-[360px] items-center justify-center px-6 py-16">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6fcf97]/8 blur-3xl" />

              <div className="relative flex max-w-sm flex-col items-center text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                  <Loader2
                    size={25}
                    strokeWidth={2.2}
                    className="animate-spin"
                  />

                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                    <Sparkles
                      size={8}
                      strokeWidth={2.5}
                    />
                  </span>
                </div>

                <h3 className="mt-6 text-base font-bold tracking-[-0.015em] text-[#25322e]">
                  Loading your library
                </h3>

                <p className="mt-1.5 text-sm font-medium leading-6 text-[#84918c]">
                  We’re getting your study materials ready.
                </p>

                <div className="mt-5 flex items-center gap-1.5">
                  <span className="h-1.5 w-5 rounded-full bg-[#2fa084]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#a9dfcc]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#cdeee1]" />
                </div>
              </div>
            </div>
          </motion.section>
        ) : !error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: 0.12,
              ease: "easeOut",
            }}
            className="mt-1"
          >
            <MaterialGrid
              uploadedMaterials={
                displayedMaterials
              }
              onDelete={handleDelete}
              onRename={handleRename}
              searchQuery={searchQuery}
              onClearSearch={() =>
                setSearchQuery("")
              }
            />
          </motion.div>
        ) : null}

        {/* Bottom breathing space */}
        <div className="h-2 sm:h-4" />
      </div>
    </div>
  );
}

export default Library;