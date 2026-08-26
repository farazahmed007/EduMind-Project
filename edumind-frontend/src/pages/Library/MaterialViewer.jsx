import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

function MaterialViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fileUrl = `http://127.0.0.1:8000/api/materials/${id}/file`;

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/api/materials/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch material information.");
        }

        const materials = await response.json();

        const currentMaterial = materials.find(
          (item) => String(item.id) === String(id)
        );

        if (!currentMaterial) {
          throw new Error("Material not found.");
        }

        setMaterial(currentMaterial);
      } catch (err) {
        console.error("Error loading material:", err);
        setError(err.message || "Unable to load material.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  const handleBack = () => {
    navigate("/library");
  };

  const handleDownload = () => {
    const link = document.createElement("a");

    link.href = fileUrl;

    if (material?.title) {
      link.download = material.title;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex min-h-[70vh] items-center justify-center rounded-2xl bg-white">
          <div className="text-center">
            <Loader2
              size={36}
              className="mx-auto animate-spin text-[#2FA084]"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading your document...
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center">
          <AlertCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-semibold text-red-600">
            Unable to open material
          </h2>

          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>

          <button
            onClick={handleBack}
            className="mt-6 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
          >
            Back to Library
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#EEEEEE]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={handleBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/10 hover:text-[#1F6F5F]"
              title="Back to Library"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <FileText size={21} />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-[#1F6F5F]">
                  {material?.title || "Document"}
                </h1>

                <p className="text-xs text-gray-400">
                  {material?.type} • {material?.size}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/10 hover:text-[#1F6F5F]"
            >
              <ExternalLink size={17} />
              Open in New Tab
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
            >
              <Download size={17} />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 px-3 py-4 sm:px-5 lg:px-8">
        <div className="mx-auto h-[calc(100vh-150px)] max-w-7xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-700 shadow-lg">
          {material?.type === "PDF" ? (
            <iframe
              src={fileUrl}
              title={material.title}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-white px-6 text-center">
              <div>
                <FileText
                  size={50}
                  className="mx-auto text-gray-300"
                />

                <h2 className="mt-4 text-xl font-semibold text-gray-700">
                  Preview not available
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  Your {material?.type} file has been uploaded successfully,
                  but browser-based preview for this file type is not
                  available yet.
                </p>

                <button
                  onClick={handleDownload}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
                >
                  <Download size={17} />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialViewer;