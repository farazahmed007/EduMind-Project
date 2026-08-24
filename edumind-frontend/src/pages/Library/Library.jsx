import { useMemo, useState } from "react";

import LibraryHeader from "../../components/library/LibraryHeader";
import LibraryToolbar from "../../components/library/LibraryToolbar";
import LibraryTabs from "../../components/library/LibraryTabs";
import MaterialGrid from "../../components/library/MaterialGrid";

const initialMaterials = [
  {
    id: 1,
    title: "Machine Learning Fundamentals",
    type: "PDF",
    size: "2.4 MB",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Computer Networks",
    type: "PPT",
    size: "4.2 MB",
    time: "Yesterday",
  },
  {
    id: 3,
    title: "Java OOP Concepts",
    type: "PDF",
    size: "1.8 MB",
    time: "Yesterday",
  },
  {
    id: 4,
    title: "Database Management Systems",
    type: "DOC",
    size: "1.2 MB",
    time: "2 days ago",
  },
  {
    id: 5,
    title: "Cloud Computing",
    type: "PDF",
    size: "3.6 MB",
    time: "3 days ago",
  },
  {
    id: 6,
    title: "Cyber Security Notes",
    type: "PDF",
    size: "2.1 MB",
    time: "4 days ago",
  },
];

function Library() {
  const [uploadedMaterials, setUploadedMaterials] = useState(initialMaterials);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("recent");

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

  const displayedMaterials = useMemo(() => {
    let result = [...uploadedMaterials];

    // 🔍 Search
    if (searchQuery.trim()) {
      result = result.filter((material) =>
        material.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // 📁 Filter
    if (typeFilter !== "ALL") {
      result = result.filter(
        (material) => material.type === typeFilter
      );
    }

    // ↕️ Sort
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

      <MaterialGrid
        uploadedMaterials={displayedMaterials}
      />

    </div>
  );
}

export default Library;