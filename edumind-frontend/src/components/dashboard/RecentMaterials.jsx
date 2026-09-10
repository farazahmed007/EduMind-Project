import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  FileType,
  Presentation,
  Clock3,
  ArrowRight,
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
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    };
  }

  if (
    type.includes("DOC") ||
    type.includes("WORD")
  ) {
    return {
      icon: FileType,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    };
  }

  return {
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
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
          a.created_at || a.updated_at || 0
        ).getTime();

        const dateB = new Date(
          b.created_at || b.updated_at || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);
  }, [materials]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-lg font-semibold text-[#1F6F5F]">
            Recent Learning Materials
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Continue learning from your recent materials.
          </p>
        </div>

        <button
          onClick={() => navigate("/library")}
          className="hidden items-center gap-1 text-sm font-semibold text-[#2FA084] transition hover:text-[#1F6F5F] sm:flex"
        >
          View Library
          <ArrowRight size={16} />
        </button>

      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 py-4"
            >
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-100" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />

                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recentMaterials.length === 0 && (
        <div className="mt-5 rounded-xl bg-[#F8F9F8] px-6 py-10 text-center">
          <FileText
            size={30}
            className="mx-auto text-gray-300"
          />

          <p className="mt-3 text-sm font-medium text-gray-500">
            You haven't uploaded any learning materials yet.
          </p>

          <button
            onClick={() => navigate("/library")}
            className="mt-4 rounded-xl bg-[#2FA084] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
          >
            Go to Library
          </button>
        </div>
      )}

      {/* Materials */}
      {!loading && recentMaterials.length > 0 && (
        <div className="mt-5 divide-y divide-gray-100">

          {recentMaterials.map((material) => {
            const {
              icon: Icon,
              iconBg,
              iconColor,
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
                className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >

                {/* File Icon */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon
                    size={21}
                    className={iconColor}
                  />
                </div>

                {/* Material Info */}
                <div className="min-w-0 flex-1">

                  <h4 className="truncate text-sm font-semibold text-gray-700 transition group-hover:text-[#1F6F5F]">
                    {material.title}
                  </h4>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">

                    <span>
                      {String(materialType).toUpperCase()}
                    </span>

                    <span>•</span>

                    <span>
                      {materialSize}
                    </span>

                    <span>•</span>

                    <span className="flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatRelativeDate(materialDate)}
                    </span>

                  </div>

                </div>

                {/* Open Button */}
                <button
                  onClick={() =>
                    navigate(
                      `/library/${material.id}`
                    )
                  }
                  className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#2FA084] hover:text-[#1F6F5F] sm:block"
                >
                  Open
                </button>

              </div>
            );
          })}

        </div>
      )}

      {/* Mobile Library Button */}
      <button
        onClick={() => navigate("/library")}
        className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#2FA084] py-2.5 text-sm font-semibold text-[#1F6F5F] transition hover:bg-[#2FA084] hover:text-white sm:hidden"
      >
        View Library
        <ArrowRight size={16} />
      </button>

    </div>
  );
}

export default RecentMaterials;