import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FileText,
  Presentation,
  File,
  MoreVertical,
  Clock3,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
  X,
  Sparkles,
} from "lucide-react";

const iconMap = {
  PDF: {
    icon: FileText,
    bg: "bg-[#fff1f1]",
    color: "text-[#d85b5b]",
    accent: "#d85b5b",
    label: "PDF",
    softBorder: "border-[#f4d7d7]",
  },

  PPT: {
    icon: Presentation,
    bg: "bg-[#fff5ea]",
    color: "text-[#d88432]",
    accent: "#d88432",
    label: "PPT",
    softBorder: "border-[#f1dfc9]",
  },

  DOC: {
    icon: File,
    bg: "bg-[#eef5ff]",
    color: "text-[#4f7fc7]",
    accent: "#4f7fc7",
    label: "DOC",
    softBorder: "border-[#d9e5f7]",
  },
};

function formatRelativeTime(createdAt, fallbackTime) {
  if (!createdAt) {
    return fallbackTime || "Recently uploaded";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return fallbackTime || "Recently uploaded";
  }

  const now = new Date();
  const differenceInSeconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - createdDate.getTime()) / 1000
    )
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(
    differenceInSeconds / 60
  );

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(
    days / 30
  );

  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  const years = Math.floor(
    days / 365
  );

  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function MaterialCard({
  material,
  onDelete,
  onRename,
}) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(material.title);

  const config =
    iconMap[material.type] ||
    iconMap.DOC;

  const Icon = config.icon;

  const displayTime = formatRelativeTime(
    material.created_at,
    material.time
  );

  /*
   * Open Material Details page
   */

  const handleOpen = () => {
    navigate(`/library/${material.id}`);
  };

  /*
   * Save renamed material
   */

  const handleRenameSave = () => {
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    onRename(
      material.id,
      trimmedTitle
    );

    setIsRenaming(false);
  };

  /*
   * Cancel rename
   */

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewTitle(material.title);
  };

  return (
    <article
      className="
        group relative overflow-hidden
        rounded-[22px]
        border border-[#dfe8e4]
        bg-white
        shadow-[0_4px_18px_rgba(23,33,30,0.045)]
        transition-all duration-300 ease-out
        hover:-translate-y-1
        hover:border-[#b9dfd0]
        hover:shadow-[0_16px_36px_rgba(23,33,30,0.10)]
      "
    >
      {/* Top accent */}
      <div
        className="
          absolute left-0 top-0 h-1 w-full
          origin-left scale-x-0
          transition-transform duration-300 ease-out
          group-hover:scale-x-100
        "
        style={{
          backgroundColor: config.accent,
        }}
      />

      {/* Subtle hover glow */}
      <div
        className="
          pointer-events-none absolute -right-12 -top-12
          h-32 w-32 rounded-full blur-3xl
          opacity-0 transition-opacity duration-300
          group-hover:opacity-100
        "
        style={{
          backgroundColor: `${config.accent}18`,
        }}
      />

      <div className="relative p-5">
        {/* Top Row */}
        <div className="flex items-start justify-between">
          {/* File Identity */}
          <div className="relative">
            <div
              className={`
                relative flex h-14 w-14
                items-center justify-center
                rounded-2xl
                border
                ${config.bg}
                ${config.color}
                ${config.softBorder}
                shadow-sm
                transition-all duration-300
                group-hover:scale-[1.04]
                group-hover:shadow-md
              `}
            >
              <Icon
                size={25}
                strokeWidth={1.9}
              />

              {/* File type badge */}
              <span
                className="
                  absolute -bottom-1.5 -right-1.5
                  rounded-md border-2 border-white
                  bg-white px-1.5 py-0.5
                  text-[8px] font-extrabold
                  tracking-wide shadow-sm
                "
              >
                {config.label}
              </span>
            </div>
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (previous) =>
                    !previous
                )
              }
              aria-label={`Actions for ${material.title}`}
              aria-expanded={menuOpen}
              className={`
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                transition-all duration-200
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#6fcf97]/35
                ${
                  menuOpen
                    ? "bg-[#e8f6f0] text-[#1f6f5f] shadow-sm"
                    : "text-[#9aa7a2] hover:bg-[#f3f7f5] hover:text-[#53635d]"
                }
              `}
            >
              <MoreVertical
                size={18}
                strokeWidth={2}
              />
            </button>

            {menuOpen && (
              <div
                className="
                  absolute right-0 top-11 z-30
                  w-44 overflow-hidden
                  rounded-2xl
                  border border-[#dfe8e4]
                  bg-white p-1.5
                  shadow-[0_16px_40px_rgba(23,33,30,0.14)]
                "
              >
                {/* Rename */}
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(
                      material.title
                    );
                    setIsRenaming(true);
                    setMenuOpen(false);
                  }}
                  className="
                    group/menu flex w-full
                    items-center gap-2.5
                    rounded-xl px-2.5 py-2.5
                    text-left text-xs font-semibold
                    text-[#66756f]
                    transition-colors duration-150
                    hover:bg-[#f2f7f5]
                    hover:text-[#1f6f5f]
                  "
                >
                  <span
                    className="
                      flex h-7 w-7 items-center
                      justify-center rounded-lg
                      bg-[#f5f8f7] text-[#82908a]
                      transition-colors
                      group-hover/menu:bg-[#e5f5ee]
                      group-hover/menu:text-[#2fa084]
                    "
                  >
                    <Pencil size={14} />
                  </span>

                  Rename
                </button>

                {/* Open */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpen();
                  }}
                  className="
                    group/menu flex w-full
                    items-center gap-2.5
                    rounded-xl px-2.5 py-2.5
                    text-left text-xs font-semibold
                    text-[#66756f]
                    transition-colors duration-150
                    hover:bg-[#f2f7f5]
                    hover:text-[#1f6f5f]
                  "
                >
                  <span
                    className="
                      flex h-7 w-7 items-center
                      justify-center rounded-lg
                      bg-[#f5f8f7] text-[#82908a]
                      transition-colors
                      group-hover/menu:bg-[#e5f5ee]
                      group-hover/menu:text-[#2fa084]
                    "
                  >
                    <ExternalLink size={14} />
                  </span>

                  Open material
                </button>

                <div className="my-1.5 border-t border-[#edf1ef]" />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);

                    const confirmed =
                      window.confirm(
                        `Delete "${material.title}"?`
                      );

                    if (confirmed) {
                      onDelete(
                        material.id
                      );
                    }
                  }}
                  className="
                    group/menu flex w-full
                    items-center gap-2.5
                    rounded-xl px-2.5 py-2.5
                    text-left text-xs font-semibold
                    text-[#c96363]
                    transition-colors duration-150
                    hover:bg-[#fff3f3]
                  "
                >
                  <span
                    className="
                      flex h-7 w-7 items-center
                      justify-center rounded-lg
                      bg-[#fff5f5] text-[#c96363]
                      transition-colors
                      group-hover/menu:bg-[#ffeaea]
                    "
                  >
                    <Trash2 size={14} />
                  </span>

                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Material Information */}
        <div className="mt-6 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`
                rounded-md
                border
                ${config.softBorder}
                ${config.bg}
                ${config.color}
                px-2 py-1
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.08em]
              `}
            >
              {material.type}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#c6d2cd]" />

            <span className="truncate text-[11px] font-medium text-[#9aa7a2]">
              {material.size}
            </span>
          </div>

          <h3
            className="
              mt-3 truncate
              text-[16px] font-bold
              tracking-[-0.015em]
              text-[#25322e]
              transition-colors duration-200
              group-hover:text-[#176b5b]
            "
            title={material.title}
          >
            {material.title}
          </h3>

          <p className="mt-1 truncate text-[11px] font-medium text-[#a0aaa6]">
            Ready for focused learning
          </p>
        </div>

        {/* Rename Panel */}
        {isRenaming && (
          <div
            className="
              mt-4 rounded-2xl
              border border-[#cdeee1]
              bg-[#f5faf7]
              p-3.5
              shadow-[inset_0_0_0_1px_rgba(47,160,132,0.04)]
            "
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
                <Pencil size={12} />
              </span>

              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#789088]">
                Rename material
              </label>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) =>
                setNewTitle(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSave();
                }

                if (e.key === "Escape") {
                  handleRenameCancel();
                }
              }}
              autoFocus
              className="
                h-10 w-full rounded-xl
                border border-[#dce8e3]
                bg-white px-3
                text-sm font-medium
                text-[#25322e]
                outline-none
                transition-all
                focus:border-[#6fcf97]
                focus:ring-4
                focus:ring-[#6fcf97]/10
              "
            />

            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleRenameCancel}
                className="
                  flex h-8 items-center gap-1.5
                  rounded-lg px-2.5
                  text-xs font-semibold
                  text-[#71817b]
                  transition-colors
                  hover:bg-white
                  hover:text-[#53635d]
                "
              >
                <X size={13} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRenameSave}
                className="
                  flex h-8 items-center gap-1.5
                  rounded-lg
                  bg-[#2fa084]
                  px-3
                  text-xs font-bold
                  text-white
                  shadow-sm
                  transition-all
                  hover:bg-[#1f6f5f]
                  active:scale-[0.98]
                "
              >
                <Check size={13} />
                Save
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-[#edf1ef] pt-4">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-[#96a29e]">
            <Clock3
              size={13}
              strokeWidth={2}
            />

            <span className="truncate">
              {displayTime}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="
              group/open flex items-center gap-1.5
              rounded-xl
              bg-[#e8f6f0]
              px-3.5 py-2
              text-xs font-bold
              text-[#1f6f5f]
              transition-all duration-200
              hover:bg-[#2fa084]
              hover:text-white
              hover:shadow-[0_6px_14px_rgba(47,160,132,0.20)]
              active:scale-[0.98]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#6fcf97]/35
            "
          >
            Open

            <ExternalLink
              size={13}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover/open:translate-x-0.5"
            />
          </button>
        </div>

        {/* Tiny learning indicator */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-1 text-[9px] font-semibold text-[#a3aea9] opacity-0 transition-opacity duration-300 group-hover:flex group-hover:opacity-100">
          <Sparkles
            size={10}
            className="text-[#6fcf97]"
          />
          Ready to study
        </div>
      </div>
    </article>
  );
}

export default MaterialCard;