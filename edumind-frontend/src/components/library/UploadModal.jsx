import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Presentation,
  File,
  X,
  CheckCircle2,
} from "lucide-react";

function UploadModal({ isOpen, onClose, onUpload }) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file) return;

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

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    try {
      setIsUploading(true);
      setUploadError("");

      /*
       * IMPORTANT:
       * UploadModal does NOT upload directly anymore.
       *
       * It sends the actual File object to Library.jsx.
       *
       * Library.jsx is responsible for:
       * File -> FormData -> FastAPI -> PostgreSQL
       */
      const uploadSuccessful = await onUpload(selectedFile);

      if (!uploadSuccessful) {
        setUploadError(
          "Upload failed. Please make sure the backend is running."
        );
        return;
      }

      // Upload was successful
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose();
    } catch (error) {
      console.error("Upload error:", error);

      setUploadError(
        "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return File;

    if (selectedFile.type === "application/pdf") {
      return FileText;
    }

    if (selectedFile.type.includes("presentation")) {
      return Presentation;
    }

    return File;
  };

  const FileIcon = getFileIcon();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between">

          <div>
            <h2 className="text-xl font-bold text-[#1F6F5F]">
              Upload Learning Material
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add study material to your personal library.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-[#EEEEEE] hover:text-[#1F6F5F] disabled:opacity-40"
          >
            <X size={20} />
          </button>

        </div>

        {/* Upload Area */}
        {!selectedFile ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
              isDragging
                ? "border-[#2FA084] bg-[#6FCF97]/10"
                : "border-gray-200 hover:border-[#6FCF97] hover:bg-[#6FCF97]/5"
            }`}
          >

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#6FCF97]/20 text-[#1F6F5F]">
              <Upload size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-700">
              Drag & drop your file here
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              or click to browse from your computer
            </p>

            <p className="mt-4 text-xs text-gray-400">
              PDF • PPT • PPTX • DOC • DOCX • TXT
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
              onChange={handleInputChange}
              className="hidden"
            />

          </div>
        ) : (
          /* Selected File */
          <div className="mt-6 rounded-2xl border border-[#6FCF97] bg-[#6FCF97]/10 p-4">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F6F5F] shadow-sm">
                <FileIcon size={23} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate font-semibold text-gray-700">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>

              </div>

              <CheckCircle2
                size={22}
                className="shrink-0 text-[#2FA084]"
              />

            </div>

          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {uploadError}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-[#EEEEEE] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading ? "Uploading..." : "Upload Material"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default UploadModal;