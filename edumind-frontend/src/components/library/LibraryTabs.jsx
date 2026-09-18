import { useState } from "react";
import {
  BookOpen,
  FileText,
  Presentation,
  NotebookPen,
  Clock3,
} from "lucide-react";

const tabs = [
  {
    label: "All Materials",
    icon: BookOpen,
  },
  {
    label: "PDFs",
    icon: FileText,
  },
  {
    label: "Presentations",
    icon: Presentation,
  },
  {
    label: "Notes",
    icon: NotebookPen,
  },
  {
    label: "Recent",
    icon: Clock3,
  },
];

function LibraryTabs() {
  const [activeTab, setActiveTab] = useState("All Materials");

  return (
    <div className="mt-5 overflow-x-auto pb-1">
      <div className="inline-flex min-w-max rounded-2xl border border-[#dfe9e5] bg-white p-1.5 shadow-[0_4px_18px_rgba(23,33,30,0.045)]">
        {tabs.map((tab) => {
          const active = activeTab === tab.label;
          const Icon = tab.icon;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              aria-pressed={active}
              className={`
                group relative flex items-center gap-2
                rounded-xl px-3.5 py-2.5
                text-xs font-semibold
                transition-all duration-200 ease-out
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#6fcf97]/35
                sm:px-4 sm:text-sm
                ${
                  active
                    ? `
                      bg-[#e8f6f0]
                      text-[#176b5b]
                      shadow-[inset_0_0_0_1px_rgba(47,160,132,0.08)]
                    `
                    : `
                      text-[#71817b]
                      hover:bg-[#f5f8f7]
                      hover:text-[#1f6f5f]
                    `
                }
              `}
            >
              {/* Active indicator */}
              <span
                className={`
                  absolute bottom-1 left-1/2 h-0.5
                  -translate-x-1/2 rounded-full
                  bg-[#2fa084]
                  transition-all duration-200
                  ${
                    active
                      ? "w-5 opacity-100"
                      : "w-0 opacity-0"
                  }
                `}
              />

              {/* Icon */}
              <span
                className={`
                  flex h-7 w-7 shrink-0 items-center justify-center
                  rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? "bg-white text-[#2fa084] shadow-sm"
                      : "bg-transparent text-[#8a9993] group-hover:bg-white group-hover:text-[#2fa084] group-hover:shadow-sm"
                  }
                `}
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2.2 : 2}
                  className="transition-transform duration-200 group-hover:scale-[1.04]"
                />
              </span>

              {/* Label */}
              <span className="whitespace-nowrap">
                {tab.label}
              </span>

              {/* Active dot */}
              <span
                className={`
                  h-1.5 w-1.5 shrink-0 rounded-full
                  bg-[#2fa084]
                  transition-all duration-200
                  ${
                    active
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LibraryTabs;