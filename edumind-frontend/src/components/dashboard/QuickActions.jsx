import {
  Bot,
  ClipboardCheck,
  Layers3,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "AI Tutor",
    description: "Ask questions and learn with your personal AI tutor.",
    icon: Bot,
    to: "/tutor",
  },
  {
    title: "Quiz Intelligence",
    description: "Test your knowledge with personalized quizzes.",
    icon: ClipboardCheck,
    to: "/quiz",
  },
  {
    title: "Flashcards",
    description: "Review important concepts and strengthen your memory.",
    icon: Layers3,
    to: "/flashcards",
  },
  {
    title: "Study Planner",
    description: "Organize your study schedule and learning goals.",
    icon: CalendarDays,
    to: "/planner",
  },
];

function QuickActions() {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#1F6F5F]">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Jump back into your learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.to}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6FCF97] hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F] transition-colors group-hover:bg-[#2FA084] group-hover:text-white">
                  <Icon size={22} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#2FA084]"
                />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#1F6F5F]">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;