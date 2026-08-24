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
} from "lucide-react";

function MaterialDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

      {/* Back */}
      <button
        onClick={() => navigate("/library")}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1F6F5F]"
      >
        <ArrowLeft size={18} />
        Back to Library
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <FileText size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#1F6F5F]">
              Machine Learning Fundamentals
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              PDF • 2.4 MB • Added 2 hours ago
            </p>
          </div>

        </div>

      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* Document Preview */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#2FA084]" />

              <span className="text-sm font-semibold text-gray-700">
                Document Preview
              </span>
            </div>

            <span className="text-xs text-gray-400">
              Preview
            </span>

          </div>

          {/* Fake PDF Preview */}
          <div className="min-h-[600px] bg-gray-100 p-6">

            <div className="mx-auto min-h-[700px] max-w-3xl rounded-md bg-white p-8 shadow-sm">

              <div className="border-b border-gray-200 pb-5">

                <div className="h-5 w-3/4 rounded bg-gray-200" />

                <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />

              </div>

              <div className="mt-8 space-y-4">

                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />

                <div className="mt-8 h-32 rounded-lg bg-[#6FCF97]/10" />

                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-11/12 rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />

              </div>

            </div>

          </div>

        </div>

        {/* Right Panel */}
        <div className="space-y-5">

          {/* Material Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-[#1F6F5F]">
              Material Information
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  File Type
                </span>

                <span className="text-sm font-medium text-gray-700">
                  PDF
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  File Size
                </span>

                <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <HardDrive size={14} />
                  2.4 MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Pages
                </span>

                <span className="text-sm font-medium text-gray-700">
                  24
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Added
                </span>

                <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Clock3 size={14} />
                  2 hours ago
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
              <button className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5">

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
              <button className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5">

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
              <button className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5">

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
              <button className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-[#6FCF97] hover:bg-[#6FCF97]/5">

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
  );
}

export default MaterialDetails;