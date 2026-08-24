import { useState } from "react";

const tabs = [
  "All Materials",
  "PDFs",
  "Presentations",
  "Notes",
  "Recent",
];

function LibraryTabs() {
  const [activeTab, setActiveTab] = useState("All Materials");

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-xl bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const active = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#2FA084] text-white shadow-sm"
                  : "text-gray-500 hover:bg-[#EEEEEE] hover:text-[#1F6F5F]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LibraryTabs;