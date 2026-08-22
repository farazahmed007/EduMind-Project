import { Brain } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2FA084] text-white">
        <Brain size={24} strokeWidth={2} />
      </div>

      <div>
        <h1 className="text-xl font-bold text-[#1F6F5F]">
          EduMind
        </h1>

        <p className="text-xs text-gray-500">
          Learn Smarter. Grow Better.
        </p>
      </div>
    </div>
  );
}