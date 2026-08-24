import { useNavigate } from "react-router-dom";

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

function MaterialCard({ material }) {
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

        <button className="rounded-lg p-2 text-gray-400 transition hover:bg-[#EEEEEE] hover:text-[#1F6F5F]">
          <MoreVertical size={18} />
        </button>

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