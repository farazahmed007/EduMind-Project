import { BookOpen, Sparkles, ArrowUpRight } from "lucide-react";

function LibraryHeader() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#f1faf6] px-5 py-5 shadow-[0_6px_28px_rgba(23,33,30,0.045)] sm:px-6 sm:py-6 lg:px-7 lg:py-7">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#6fcf97]/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#cdeee1]/25 blur-3xl" />

      <div className="pointer-events-none absolute right-1/4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#e8f6f0]/50 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Title */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm transition-transform duration-300 hover:scale-[1.03]">
            <BookOpen
              size={25}
              strokeWidth={2}
            />

            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
              <Sparkles
                size={9}
                strokeWidth={2.5}
              />
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c938a]">
                Your workspace
              </span>

              <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

              <span className="text-[10px] font-semibold text-[#2fa084]">
                Study materials
              </span>
            </div>

            <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#176b5b] sm:text-[28px] lg:text-[30px]">
              Learning Library
            </h1>

            <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#7b8984] sm:text-[13px]">
              Organize, explore, and learn from everything you’ve uploaded.
            </p>
          </div>
        </div>

        {/* Right-side context */}
        <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-[#dfeae5] bg-white/85 px-3.5 py-3 shadow-sm backdrop-blur-sm md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dceee6] bg-[#e8f6f0] text-[#2fa084]">
            <BookOpen
              size={15}
              strokeWidth={2.2}
            />
          </span>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#98a6a1]">
              Workspace
            </p>

            <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
              Keep learning organized
            </p>
          </div>

          <span className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3f8f5] text-[#789087]">
            <ArrowUpRight
              size={14}
              strokeWidth={2}
            />
          </span>
        </div>
      </div>
    </section>
  );
}

export default LibraryHeader;