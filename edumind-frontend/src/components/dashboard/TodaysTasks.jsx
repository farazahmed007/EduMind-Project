import { Check, Clock3, Circle } from "lucide-react";

const tasks = [
  {
    title: "Review Java OOP concepts",
    time: "9:00 AM",
    duration: "45 min",
    completed: true,
  },
  {
    title: "Complete Machine Learning quiz",
    time: "11:30 AM",
    duration: "30 min",
    completed: true,
  },
  {
    title: "Study Computer Networks",
    time: "4:00 PM",
    duration: "60 min",
    completed: false,
  },
  {
    title: "Review today's flashcards",
    time: "7:00 PM",
    duration: "20 min",
    completed: false,
  },
];

function TodaysTasks() {
  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const progress = Math.round(
    (completedTasks / tasks.length) * 100
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">

        <div>
          <h3 className="text-lg font-semibold text-[#1F6F5F]">
            Today's Tasks
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Stay on track with your study plan.
          </p>
        </div>

        <div className="rounded-lg bg-[#6FCF97]/20 px-2.5 py-1 text-xs font-semibold text-[#1F6F5F]">
          {completedTasks}/{tasks.length}
        </div>

      </div>

      {/* Progress */}
      <div className="mt-5">

        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            Today's progress
          </span>

          <span className="text-xs font-semibold text-[#2FA084]">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#EEEEEE]">
          <div
            className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* Tasks */}
      <div className="mt-5 space-y-1">

        {tasks.map((task) => (
          <div
            key={task.title}
            className={`flex items-center gap-3 rounded-xl p-3 transition ${
              task.completed
                ? "bg-[#6FCF97]/10"
                : "hover:bg-[#EEEEEE]"
            }`}
          >

            {/* Checkbox */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                task.completed
                  ? "bg-[#2FA084] text-white"
                  : "border-2 border-gray-200 text-gray-300"
              }`}
            >
              {task.completed ? (
                <Check size={16} />
              ) : (
                <Circle size={14} />
              )}
            </div>

            {/* Task Details */}
            <div className="min-w-0 flex-1">

              <p
                className={`truncate text-sm font-medium ${
                  task.completed
                    ? "text-gray-400 line-through"
                    : "text-gray-700"
                }`}
              >
                {task.title}
              </p>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span>{task.time}</span>

                <span>•</span>

                <span className="flex items-center gap-1">
                  <Clock3 size={12} />
                  {task.duration}
                </span>
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* Planner Button */}
      <button className="mt-5 w-full rounded-xl bg-[#2FA084] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]">
        Open Study Planner
      </button>

    </div>
  );
}

export default TodaysTasks;