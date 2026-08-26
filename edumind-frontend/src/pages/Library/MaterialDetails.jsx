import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Bot,
  Sparkles,
  ClipboardCheck,
  Layers3,
  Clock3,
  HardDrive,
  Download,
  ExternalLink,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

function MaterialDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Load material information
  // --------------------------------------------------

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/materials/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch materials");
        }

        const materials = await response.json();

        const selectedMaterial = materials.find(
          (item) => String(item.id) === String(id)
        );

        setMaterial(selectedMaterial || null);
      } catch (error) {
        console.error("Error loading material:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading material...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Material not found
  // --------------------------------------------------

  if (!material) {
    return (
      <div className="min-h-full bg-[#EEEEEE] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => navigate("/library")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1F6F5F]"
          >
            <ArrowLeft size={18} />
            Back to Library
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700">
              Material not found
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              This material may have been deleted or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // File URL
  // --------------------------------------------------

  const fileUrl = `${API_BASE_URL}/api/materials/${material.id}/file`;

  const isPDF = material.type === "PDF";

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Back */}
        <button
          onClick={() => navigate("/library")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1F6F5F]"
        >
          <ArrowLeft size={18} />
          Back to Library
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <FileText size={28} />
            </div>

            <div className="min-w-0">

              <h1 className="truncate text-2xl font-bold text-[#1F6F5F]">
                {material.title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {material.type} • {material.size} • {material.time}
              </p>

            </div>

          </div>

          {/* File actions */}
          <div className="flex flex-wrap gap-2">

            <a
              href={fileUrl}
              download={material.title}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-[#6FCF97] hover:text-[#1F6F5F]"
            >
              <Download size={17} />
              Download
            </a>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F]"
            >
              <ExternalLink size={17} />
              Open in New Tab
            </a>

          </div>

        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ================================================== */}
          {/* REAL DOCUMENT VIEWER */}
          {/* ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Viewer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">

              <div className="flex items-center gap-2">

                <FileText
                  size={18}
                  className="text-[#2FA084]"
                />

                <span className="text-sm font-semibold text-gray-700">
                  Document Viewer
                </span>

              </div>

              <span className="text-xs text-gray-400">
                {material.type}
              </span>

            </div>

            {/* Actual PDF */}
            {isPDF ? (
              <div className="h-[calc(100vh-260px)] min-h-[650px] bg-gray-200">

                <iframe
                  src={fileUrl}
                  title={material.title}
                  className="h-full w-full border-0"
                />

              </div>
            ) : (
              <div className="flex min-h-[650px] items-center justify-center bg-gray-100 p-8">

                <div className="max-w-md text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">
                    <FileText
                      size={30}
                      className="text-gray-500"
                    />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-gray-700">
                    Preview not available
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Browser preview is currently available for PDF files.
                    You can download this material to open it with the
                    appropriate application.
                  </p>

                  <a
                    href={fileUrl}
                    download={material.title}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
                  >
                    <Download size={17} />
                    Download File
                  </a>

                </div>

              </div>
            )}

          </div>

          {/* ================================================== */}
          {/* RIGHT PANEL */}
          {/* ================================================== */}

          <div className="space-y-5">

            {/* Material Information */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold text-[#1F6F5F]">
                Material Information
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    File Name
                  </span>

                  <span
                    className="max-w-[190px] truncate text-right text-sm font-medium text-gray-700"
                    title={material.title}
                  >
                    {material.title}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    File Type
                  </span>

                  <span className="text-sm font-medium text-gray-700">
                    {material.type}
                  </span>
                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    File Size
                  </span>

                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <HardDrive size={14} />
                    {material.size}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Added
                  </span>

                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <Clock3 size={14} />
                    {material.time}
                  </span>

                </div>

              </div>

            </div>

            {/* AI Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="font-semibold text-[#1F6F5F]">
                Learn with EduMind
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Use AI-powered tools to learn from this material.
              </p>

              <div className="mt-5 space-y-3">

                {/* AI Tutor */}
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <Bot size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Ask AI Tutor
                    </p>

                    <p className="text-xs text-gray-400">
                      Ask questions about this material
                    </p>
                  </div>

                </button>

                {/* Summary */}
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Generate Summary
                    </p>

                    <p className="text-xs text-gray-400">
                      Get a concise explanation
                    </p>
                  </div>

                </button>

                {/* Quiz */}
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <ClipboardCheck size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Generate Quiz
                    </p>

                    <p className="text-xs text-gray-400">
                      Test your understanding
                    </p>
                  </div>

                </button>

                {/* Flashcards */}
                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6FCF97]/20 text-[#1F6F5F] transition group-hover:bg-[#2FA084] group-hover:text-white">
                    <Layers3 size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Create Flashcards
                    </p>

                    <p className="text-xs text-gray-400">
                      Generate cards for revision
                    </p>
                  </div>

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default MaterialDetails;