import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  Presentation,
} from "lucide-react";

function MaterialViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [error, setError] = useState("");

  const fileUrl = `${import.meta.env.VITE_API_URL}/api/materials/${id}/file`;
  const contentUrl = `${import.meta.env.VITE_API_URL}/api/materials/${id}/content`;

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials/`
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

  useEffect(() => {
    const fetchContent = async () => {
      if (!material) {
        return;
      }

      if (material.type === "PDF") {
        return;
      }

      try {
        setIsContentLoading(true);

        const response = await fetch(contentUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.detail ||
              "Failed to extract readable content from this material."
          );
        }

        const data = await response.json();

        setContent(data.content || "");
      } catch (err) {
        console.error("Error loading extracted content:", err);

        setContent("");
        setError(
          err.message || "Unable to load the document content."
        );
      } finally {
        setIsContentLoading(false);
      }
    };

    fetchContent();
  }, [material, contentUrl]);

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

  const renderExtractedContent = () => {
    if (isContentLoading) {
      return (
        <div className="flex h-full items-center justify-center bg-white">
          <div className="text-center">
            <Loader2
              size={36}
              className="mx-auto animate-spin text-[#2FA084]"
            />

            <p className="mt-4 text-sm text-gray-500">
              Preparing your document preview...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Image-based presentations may take a little longer.
            </p>
          </div>
        </div>
      );
    }

    if (!content.trim()) {
      return (
        <div className="flex h-full items-center justify-center bg-white px-6 text-center">
          <div>
            <FileText
              size={50}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              Preview content unavailable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              We could not extract readable content from this file.
              You can still download the original document.
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
      );
    }

    const isPresentation = material?.type === "PPT";

    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10 lg:px-14">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6FCF97]/15 text-[#1F6F5F]">
              {isPresentation ? (
                <Presentation size={22} />
              ) : (
                <FileText size={22} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#1F6F5F]">
                {isPresentation
                  ? "Presentation Preview"
                  : "Document Preview"}
              </h2>

              <p className="text-xs text-gray-400">
                Extracted content from {material?.title}
              </p>
            </div>
          </div>

          <article className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-700">
            {content}
          </article>
        </div>
      </div>
    );
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

  if (error && !material) {
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
                {material?.type === "PPT" ? (
                  <Presentation size={21} />
                ) : (
                  <FileText size={21} />
                )}
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
            renderExtractedContent()
          )}
        </div>
      </div>
    </div>
  );
}
export default MaterialViewer;