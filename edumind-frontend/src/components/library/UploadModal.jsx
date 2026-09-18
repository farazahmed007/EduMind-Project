import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Presentation,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";

function UploadModal({
  isOpen,
  onClose,
  onUpload,
}) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  if (!isOpen) {
    return null;
  }

  /*
   * Validate and select file
   */

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        "Please upload a PDF, PPT, PPTX, DOC, DOCX or TXT file."
      );

      return;
    }

    setUploadError("");
    setSelectedFile(file);
  };

  /*
   * File input
   */

  const handleInputChange = (event) => {
    const file =
      event.target.files?.[0];

    handleFile(file);
  };

  /*
   * Drag and drop
   */

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    handleFile(file);
  };

  /*
   * Upload selected file
   */

  const handleUpload = async () => {
    if (
      !selectedFile ||
      isUploading
    ) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      /*
       * UploadModal does not upload directly.
       *
       * It passes the actual File object
       * to Library.jsx.
       */

      const uploadSuccessful =
        await onUpload(selectedFile);

      if (!uploadSuccessful) {
        setUploadError(
          "Upload failed. Please make sure the backend is running."
        );

        return;
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose();
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setUploadError(
        "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * File icon
   */

  const getFileIcon = () => {
    if (!selectedFile) {
      return File;
    }

    if (
      selectedFile.type ===
      "application/pdf"
    ) {
      return FileText;
    }

    if (
      selectedFile.type.includes(
        "presentation"
      )
    ) {
      return Presentation;
    }

    return File;
  };

  const FileIcon =
    getFileIcon();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17211e]/50 p-4 backdrop-blur-md sm:p-6"
      onClick={() => {
        if (!isUploading) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-[580px] overflow-hidden rounded-[28px] border border-[#dce8e3] bg-white shadow-[0_30px_90px_rgba(23,33,30,0.22)]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#6fcf97]/15 blur-3xl" />

        <div className="pointer-events-none absolute -left-24 top-32 h-40 w-40 rounded-full bg-[#cdeee1]/25 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 right-1/3 h-28 w-28 rounded-full bg-[#e8f6f0]/50 blur-3xl" />

        {/* Header */}
        <div className="relative border-b border-[#edf1ef] px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm">
                <Upload
                  size={21}
                  strokeWidth={2.2}
                />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles
                    size={8}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b9b95]">
                    Learning Library
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2fa084]">
                    Add material
                  </span>
                </div>

                <h2 className="text-[20px] font-bold tracking-[-0.025em] text-[#176b5b] sm:text-[21px]">
                  Upload Learning Material
                </h2>

                <p className="mt-1 text-xs font-medium leading-5 text-[#84918c] sm:text-sm">
                  Add study material to your personal library.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              aria-label="Close upload dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8b9994] transition-all duration-200 hover:bg-[#f2f7f5] hover:text-[#53635d] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/35"
            >
              <X
                size={18}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          {!selectedFile ? (
            /* Empty upload state */
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() =>
                setIsDragging(false)
              }
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className={`
                group relative cursor-pointer
                overflow-hidden rounded-[22px]
                border-2 border-dashed
                px-5 py-10 text-center
                transition-all duration-300
                ${
                  isDragging
                    ? "border-[#2fa084] bg-[#e8f6f0] shadow-[inset_0_0_0_4px_rgba(47,160,132,0.06)]"
                    : "border-[#dce8e3] bg-[#fafcfb] hover:border-[#a9dfcc] hover:bg-[#f5faf7] hover:shadow-[inset_0_0_0_1px_rgba(47,160,132,0.04)]"
                }
              `}
            >
              {/* Dropzone glow */}
              <div
                className={`
                  pointer-events-none absolute left-1/2 top-1/2 h-44 w-44
                  -translate-x-1/2 -translate-y-1/2 rounded-full
                  bg-[#6fcf97]/10 blur-3xl
                  transition-opacity duration-300
                  ${
                    isDragging
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }
                `}
              />

              {/* Upload icon */}
              <div
                className={`
                  relative mx-auto flex h-[72px] w-[72px]
                  items-center justify-center rounded-[22px]
                  border transition-all duration-300
                  ${
                    isDragging
                      ? "scale-105 border-[#2fa084] bg-[#2fa084] text-white shadow-[0_12px_28px_rgba(47,160,132,0.25)]"
                      : "border-[#cdeee1] bg-[#e8f6f0] text-[#2fa084] shadow-sm group-hover:scale-105 group-hover:border-[#b9e4d4] group-hover:bg-[#dff3ea] group-hover:shadow-md"
                  }
                `}
              >
                <Upload
                  size={29}
                  strokeWidth={2}
                />

                <span
                  className={`
                    absolute -bottom-2 -right-2
                    flex h-7 w-7 items-center justify-center
                    rounded-full border-2 border-white
                    shadow-sm transition-all duration-300
                    ${
                      isDragging
                        ? "bg-white text-[#2fa084]"
                        : "bg-[#2fa084] text-white"
                    }
                  `}
                >
                  <ArrowUp
                    size={12}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <h3 className="relative mt-6 text-sm font-bold text-[#34433e] sm:text-base">
                {isDragging
                  ? "Drop your file here"
                  : "Drag & drop your file here"}
              </h3>

              <p className="relative mt-1.5 text-xs font-medium text-[#8a9993] sm:text-sm">
                or click anywhere to browse from your computer
              </p>

              {/* Supported formats */}
              <div className="relative mt-6 flex flex-wrap items-center justify-center gap-1.5">
                {[
                  "PDF",
                  "PPT",
                  "PPTX",
                  "DOC",
                  "DOCX",
                  "TXT",
                ].map((format) => (
                  <span
                    key={format}
                    className="rounded-md border border-[#e1eae6] bg-white px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#7f9089] shadow-sm transition-colors duration-200 group-hover:border-[#d5e7df] group-hover:text-[#667870]"
                  >
                    {format}
                  </span>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                onChange={
                  handleInputChange
                }
                className="hidden"
              />
            </div>
          ) : (
            /* Selected file */
            <div className="rounded-[22px] border border-[#cdeee1] bg-gradient-to-br from-[#f5faf7] to-[#eef8f3] p-4 shadow-[inset_0_0_0_1px_rgba(47,160,132,0.025)] sm:p-5">
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#dcebe5] bg-white text-[#2fa084] shadow-sm">
                  <FileIcon
                    size={24}
                    strokeWidth={2}
                  />

                  <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                    <CheckCircle2
                      size={10}
                      strokeWidth={2.7}
                    />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center rounded-full bg-[#e1f3ea] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#2fa084]">
                    Ready to upload
                  </span>

                  <p
                    className="mt-2 truncate text-sm font-bold text-[#34433e]"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-[#899791]">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2fa084] shadow-sm sm:flex">
                  <CheckCircle2
                    size={19}
                    strokeWidth={2.2}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#dceae4] bg-white/75 px-3.5 py-3">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-[#6b9385]"
                  strokeWidth={2}
                />

                <p className="text-[10px] font-medium leading-4 text-[#71817b]">
                  Your material will be added to your personal learning library.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#f0d7d7] bg-[#fff6f6] px-3.5 py-3.5 shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ffeaea] text-[#c96363]">
                <AlertCircle
                  size={15}
                  strokeWidth={2.2}
                />
              </span>

              <p className="pt-1 text-xs font-semibold leading-5 text-[#a85b5b]">
                {uploadError}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#edf1ef] bg-[#fbfcfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f5f3] text-[#80908a]">
              <FileText
                size={13}
                strokeWidth={2}
              />
            </span>

            <span className="text-[10px] font-semibold text-[#899791]">
              PDF, presentation & document files
            </span>
          </div>

          <div className="flex w-full justify-end gap-2.5 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="h-10 flex-1 rounded-xl border border-[#dce5e1] bg-white px-4 text-xs font-bold text-[#65746e] shadow-sm transition-all duration-200 hover:bg-[#f3f7f5] hover:text-[#53635d] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/35 sm:flex-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                isUploading
              }
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 text-xs font-bold text-white shadow-[0_7px_17px_rgba(47,160,132,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f6f5f] hover:shadow-[0_10px_22px_rgba(47,160,132,0.24)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/25 sm:flex-none"
            >
              {isUploading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={14}
                    strokeWidth={2.3}
                  />
                  Upload Material
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;