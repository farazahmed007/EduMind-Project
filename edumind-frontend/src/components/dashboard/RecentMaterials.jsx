import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  FileText,
  FileType,
  Presentation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const API_BASE_URL = "http://127.0.0.1:8000";


const formatFileSize = (size) => {
  if (size === null || size === undefined || size === "") {
    return "Unknown size";
  }

  if (typeof size === "string") {
    return size;
  }

  const sizeInBytes = Number(size);

  if (Number.isNaN(sizeInBytes) || sizeInBytes < 0) {
    return "Unknown size";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    sizeInBytes /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
};


const formatRelativeDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  const hours = Math.floor(
    difference / 3600000
  );

  const days = Math.floor(
    difference / 86400000
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


const getMaterialIcon = (material) => {
  const type = String(
    material?.type ||
      material?.file_type ||
      ""
  ).toUpperCase();

  if (
    type.includes("PPT") ||
    type.includes("PRESENTATION")
  ) {
    return {
      icon: Presentation,
      iconBg: "bg-[#fff4e7]",
      iconColor: "text-[#d58b32]",
      typeLabel: "Presentation",
    };
  }

  if (
    type.includes("DOC") ||
    type.includes("WORD")
  ) {
    return {
      icon: FileType,
      iconBg: "bg-[#eef4ff]",
      iconColor: "text-[#5478c8]",
      typeLabel: "Document",
    };
  }

  return {
    icon: FileText,
    iconBg: "bg-[#fff0f0]",
    iconColor: "text-[#c96363]",
    typeLabel: "File",
  };
};


function RecentMaterials() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!token) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    const fetchMaterials = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/materials/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load recent materials."
          );
        }

        const data = await response.json();

        setMaterials(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Error loading recent materials:",
          error
        );

        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [token]);


  const recentMaterials = useMemo(() => {
    return [...materials]
      .sort((a, b) => {
        const dateA = new Date(
          a.created_at ||
            a.updated_at ||
            0
        ).getTime();

        const dateB = new Date(
          b.created_at ||
            b.updated_at ||
            0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);
  }, [materials]);


  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.045)]">

      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <div className="relative flex items-start justify-between gap-4">

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
              Library
            </span>

          </div>

          <h3 className="mt-1.5 text-[18px] font-bold tracking-[-0.02em] text-[#25322e]">
            Recent Learning Materials
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#899690]">
            Continue learning from your most recently added materials.
          </p>

        </div>


        <button
          type="button"
          onClick={() => navigate("/library")}
          className="group hidden shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#2fa084] transition-all duration-200 hover:bg-[#f2f8f5] hover:text-[#1f6f5f] sm:flex"
        >
          View Library

          <ArrowRight
            size={15}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>

      </div>


      {/* ================================================= */}
      {/* Loading State */}
      {/* ================================================= */}

      {loading && (
        <div className="mt-6 space-y-1">

          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl px-2 py-3"
            >

              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-[#edf3f0]" />

              <div className="min-w-0 flex-1">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#e7eeeb]" />

                <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-[#f0f4f2]" />
              </div>

              <div className="hidden h-8 w-14 animate-pulse rounded-lg bg-[#edf3f0] sm:block" />

            </div>
          ))}

        </div>
      )}


      {/* ================================================= */}
      {/* Empty State */}
      {/* ================================================= */}

      {!loading && recentMaterials.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8fbfa] px-6 py-11 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#aab8b2] shadow-sm">
            <FileText
              size={23}
              strokeWidth={1.8}
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#596862]">
            Your learning library is waiting.
          </p>

          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#9aa7a2]">
            Upload your first study material and start building your personalized learning space.
          </p>

          <button
            type="button"
            onClick={() => navigate("/library")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1f6f5f] px-4 py-2.5 text-xs font-bold text-white shadow-[0_7px_18px_rgba(31,111,95,0.15)] transition-all duration-200 hover:bg-[#19594d] hover:shadow-[0_9px_22px_rgba(31,111,95,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/20"
          >
            Go to Library

            <ArrowUpRight
              size={14}
              strokeWidth={2.2}
            />
          </button>

        </div>
      )}


      {/* ================================================= */}
      {/* Materials */}
      {/* ================================================= */}

      {!loading && recentMaterials.length > 0 && (
        <div className="relative mt-6 space-y-1">

          {recentMaterials.map((material) => {

            const {
              icon: Icon,
              iconBg,
              iconColor,
              typeLabel,
            } = getMaterialIcon(material);


            const materialType =
              material.type ||
              material.file_type ||
              "FILE";


            const materialSize = formatFileSize(
              material.size ??
                material.file_size
            );


            const materialDate =
              material.created_at ||
              material.updated_at;


            return (
              <div
                key={material.id}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-3 transition-all duration-200 hover:border-[#e2ece8] hover:bg-[#f8fbfa] sm:gap-4"
              >

                {/* File icon */}

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-sm transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.9}
                  />
                </div>


                {/* Material information */}

                <div className="min-w-0 flex-1">

                  <h4 className="truncate text-xs font-bold text-[#4f5e58] transition-colors duration-200 group-hover:text-[#1f6f5f] sm:text-sm">
                    {material.title}
                  </h4>


                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">

                    <span className="rounded-md bg-[#f1f5f3] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#788781]">
                      {String(materialType).toUpperCase()}
                    </span>

                    <span className="hidden text-[#c4cdc9] sm:inline">
                      •
                    </span>

                    <span className="text-[10px] font-medium text-[#9aa7a2]">
                      {materialSize}
                    </span>

                    <span className="hidden text-[#c4cdc9] sm:inline">
                      •
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#9aa7a2]">
                      <Clock3
                        size={11}
                        strokeWidth={2}
                      />

                      {formatRelativeDate(materialDate)}
                    </span>

                  </div>

                </div>


                {/* Type label */}

                <span className="hidden shrink-0 rounded-lg bg-[#f8faf9] px-2 py-1 text-[9px] font-semibold text-[#98a49f] lg:block">
                  {typeLabel}
                </span>


                {/* Open button */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/library/${material.id}`
                    )
                  }
                  className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-[#dfe8e4] bg-white px-3 py-2 text-[10px] font-bold text-[#66756e] shadow-sm transition-all duration-200 hover:border-[#bcded0] hover:bg-[#f3faf7] hover:text-[#1f6f5f] sm:flex"
                >
                  Open

                  <ArrowUpRight
                    size={12}
                    strokeWidth={2.2}
                  />
                </button>


                {/* Mobile arrow */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/library/${material.id}`
                    )
                  }
                  aria-label={`Open ${material.title}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a2aea9] transition-colors duration-200 hover:bg-[#eaf6f1] hover:text-[#2fa084] sm:hidden"
                >
                  <ArrowUpRight
                    size={16}
                    strokeWidth={2}
                  />
                </button>

              </div>
            );
          })}

        </div>
      )}


      {/* ================================================= */}
      {/* Mobile Library Button */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() => navigate("/library")}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#cfe3da] bg-[#f8fbfa] py-2.5 text-xs font-bold text-[#1f6f5f] transition-all duration-200 hover:border-[#2fa084] hover:bg-[#2fa084] hover:text-white sm:hidden"
      >
        View Library

        <ArrowRight
          size={15}
          strokeWidth={2}
        />
      </button>

    </div>
  );
}


export default RecentMaterials;