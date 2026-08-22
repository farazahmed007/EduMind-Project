import {
  FileText,
  FileType,
  Presentation,
  Clock3,
  ArrowRight,
} from "lucide-react";

const materials = [
  {
    title: "Machine Learning Fundamentals",
    type: "PDF",
    size: "2.4 MB",
    time: "2 hours ago",
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Java OOP Concepts",
    type: "PDF",
    size: "1.8 MB",
    time: "Yesterday",
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Computer Networks",
    type: "PPT",
    size: "4.2 MB",
    time: "2 days ago",
    icon: Presentation,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    title: "Database Management Systems",
    type: "DOC",
    size: "1.2 MB",
    time: "3 days ago",
    icon: FileType,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
];

function RecentMaterials() {
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

        <button className="hidden items-center gap-1 text-sm font-semibold text-[#2FA084] transition hover:text-[#1F6F5F] sm:flex">
          View Library
          <ArrowRight size={16} />
        </button>

      </div>

      {/* Materials */}
      <div className="mt-5 divide-y divide-gray-100">

        {materials.map((material) => {
          const Icon = material.icon;

          return (
            <div
              key={material.title}
              className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >

              {/* File Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${material.iconBg}`}
              >
                <Icon
                  size={21}
                  className={material.iconColor}
                />
              </div>

              {/* Material Info */}
              <div className="min-w-0 flex-1">

                <h4 className="truncate text-sm font-semibold text-gray-700 transition group-hover:text-[#1F6F5F]">
                  {material.title}
                </h4>

                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span>{material.type}</span>

                  <span>•</span>

                  <span>{material.size}</span>

                  <span>•</span>

                  <span className="flex items-center gap-1">
                    <Clock3 size={12} />
                    {material.time}
                  </span>
                </div>

              </div>

              {/* Open Button */}
              <button
                className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#2FA084] hover:text-[#1F6F5F] sm:block"
              >
                Open
              </button>

            </div>
          );
        })}

      </div>

      {/* Mobile Library Button */}
      <button className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#2FA084] py-2.5 text-sm font-semibold text-[#1F6F5F] transition hover:bg-[#2FA084] hover:text-white sm:hidden">
        View Library
        <ArrowRight size={16} />
      </button>

    </div>
  );
}

export default RecentMaterials;