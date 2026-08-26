import { useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  FileText,
  Presentation,
  File,
  MoreVertical,
  Clock3,
} from "lucide-react";

const iconMap = {
  PDF: {
    icon: FileText,
    bg: "bg-red-50",
    color: "text-red-500",
  },

  PPT: {
    icon: Presentation,
    bg: "bg-orange-50",
    color: "text-orange-500",
  },

  DOC: {
    icon: File,
    bg: "bg-blue-50",
    color: "text-blue-500",
  },
};

function MaterialCard({ material , onDelete,
  onRename,}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(material.title);
  const navigate = useNavigate();

  const config = iconMap[material.type] || iconMap.DOC;
  const Icon = config.icon;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#6FCF97] hover:shadow-lg">

      {/* Top */}
      <div className="flex items-start justify-between">

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg}`}
        >
          <Icon size={23} className={config.color} />
        </div>

        <div className="relative">
  <button
    onClick={() => setMenuOpen((previous) => !previous)}
    className="rounded-lg p-2 text-gray-400 transition hover:bg-[#EEEEEE] hover:text-[#1F6F5F]"
  >
    <MoreVertical size={18} />
  </button>

  {menuOpen && (
    <div className="absolute right-0 top-11 z-20 w-36 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">

      <button
        onClick={() => {
          setNewTitle(material.title);
          setIsRenaming(true);
          setMenuOpen(false);
        }}
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-[#EEEEEE] hover:text-[#1F6F5F]"
      >
        Rename
      </button>

      <button
        onClick={() => {
          setMenuOpen(false);

          const confirmed = window.confirm(
            `Delete "${material.title}"?`
          );

          if (confirmed) {
            onDelete(material.id);
          }
        }}
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
      >
        Delete
      </button>

    </div>
  )}
</div>

      </div>

      {/* Content */}
      <div className="mt-5">

        <h3 className="truncate font-semibold text-gray-700 group-hover:text-[#1F6F5F]">
          {material.title}
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          {material.type} • {material.size}
        </p>

      </div>

      {isRenaming && (
  <div className="mt-4 rounded-xl border border-[#6FCF97] bg-[#EEEEEE] p-3">

    <input
      type="text"
      value={newTitle}
      onChange={(e) => setNewTitle(e.target.value)}
      autoFocus
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
    />

    <div className="mt-2 flex justify-end gap-2">

      <button
        onClick={() => {
          setIsRenaming(false);
          setNewTitle(material.title);
        }}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-white"
      >
        Cancel
      </button>

      <button
        onClick={() => {
          const trimmedTitle = newTitle.trim();

          if (!trimmedTitle) return;

          onRename(material.id, trimmedTitle);
          setIsRenaming(false);
        }}
        className="rounded-lg bg-[#2FA084] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1F6F5F]"
      >
        Save
      </button>

    </div>
  </div>
)}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock3 size={13} />
          {material.time}
        </div>

        <button
          onClick={() => navigate(`/library/material/${material.id}`)}
          className="rounded-lg bg-[#6FCF97]/20 px-3 py-1.5 text-xs font-semibold text-[#1F6F5F] transition hover:bg-[#2FA084] hover:text-white"
        >
          Open
        </button>

      </div>

    </div>
  );
}

export default MaterialCard;