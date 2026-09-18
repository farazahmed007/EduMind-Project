import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  ClipboardCheck,
  Layers3,
} from "lucide-react";
import { Link } from "react-router-dom";


const actions = [
  {
    title: "AI Tutor",
    description:
      "Ask questions and learn with your personal AI tutor.",
    icon: Bot,
    to: "/tutor",
    eyebrow: "Learn",
    iconBg: "bg-[#e5f5ee]",
    iconColor: "text-[#2fa084]",
    hoverBg: "group-hover:bg-[#2fa084]",
    glow: "bg-[#6fcf97]/10",
  },
  {
    title: "Quiz Intelligence",
    description:
      "Test your knowledge with personalized quizzes.",
    icon: ClipboardCheck,
    to: "/quiz",
    eyebrow: "Practice",
    iconBg: "bg-[#eef4ff]",
    iconColor: "text-[#5478c8]",
    hoverBg: "group-hover:bg-[#5478c8]",
    glow: "bg-[#8eafff]/10",
  },
  {
    title: "Flashcards",
    description:
      "Review important concepts and strengthen your memory.",
    icon: Layers3,
    to: "/flashcards",
    eyebrow: "Review",
    iconBg: "bg-[#f4edff]",
    iconColor: "text-[#8565c2]",
    hoverBg: "group-hover:bg-[#8565c2]",
    glow: "bg-[#c1a7ee]/10",
  },
  {
    title: "Study Planner",
    description:
      "Organize your study schedule and learning goals.",
    icon: CalendarDays,
    to: "/planner",
    eyebrow: "Organize",
    iconBg: "bg-[#fff5e8]",
    iconColor: "text-[#d58b32]",
    hoverBg: "group-hover:bg-[#d58b32]",
    glow: "bg-[#f4c77b]/10",
  },
];


function QuickActions() {
  return (
    <section className="mt-8">

      {/* Section heading */}

      <div className="mb-4 flex items-end justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
              Shortcuts
            </span>
          </div>

          <h2 className="mt-1.5 text-[21px] font-bold tracking-[-0.02em] text-[#17211e]">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-[#71817b]">
            Jump straight into your next learning activity.
          </p>
        </div>

      </div>


      {/* Action cards */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.to}
              className="group relative min-h-[190px] overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cfe5dc] hover:shadow-[0_16px_38px_rgba(23,33,30,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/15"
            >

              {/* Background glow */}

              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full ${action.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
              />


              {/* Top row */}

              <div className="relative flex items-start justify-between">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.iconBg} ${action.iconColor} shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:text-white ${action.hoverBg}`}
                >
                  <Icon
                    size={21}
                    strokeWidth={2}
                  />
                </div>


                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f7faf9] text-[#9aa7a2] transition-all duration-300 group-hover:bg-[#edf7f3] group-hover:text-[#2fa084]">
                  <ArrowUpRight
                    size={17}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>

              </div>


              {/* Content */}

              <div className="relative mt-5">

                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa7a2]">
                  {action.eyebrow}
                </span>

                <h3 className="mt-1.5 text-[16px] font-bold tracking-[-0.015em] text-[#25322e] transition-colors duration-200 group-hover:text-[#1f6f5f]">
                  {action.title}
                </h3>

                <p className="mt-2 text-[12px] leading-5 text-[#7b8984]">
                  {action.description}
                </p>

              </div>


              {/* Bottom interaction line */}

              <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-[#f0f4f2]">

                <div
                  className={`h-full w-0 ${action.hoverBg.replace(
                    "group-hover:",
                    ""
                  )} transition-all duration-500 group-hover:w-full`}
                />

              </div>

            </Link>
          );
        })}

      </div>

    </section>
  );
}


export default QuickActions;