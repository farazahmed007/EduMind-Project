import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Circle,
  ListChecks,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  notifyPlannerUpdated,
  subscribeToPlannerUpdates,
} from "../../utils/plannerEvents";


const API_BASE_URL = "http://127.0.0.1:8000";


function TodaysTasks() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ==================================================
  // FETCH TODAY'S TASKS
  // ==================================================

  const fetchTodayTasks = async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/planner/today`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load today's study tasks."
        );
      }

      const data = await response.json();

      setTasks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Error loading today's tasks:",
        err
      );

      setTasks([]);

      setError(
        "Unable to load today's tasks."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // INITIAL FETCH + PLANNER SYNCHRONIZATION
  // ==================================================

  useEffect(() => {
    fetchTodayTasks();

    const unsubscribe =
      subscribeToPlannerUpdates(() => {
        fetchTodayTasks();
      });

    return unsubscribe;
  }, [token]);


  // ==================================================
  // TOGGLE TASK COMPLETION
  // ==================================================

  const handleToggleComplete = async (task) => {
    if (!token) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/planner/${task.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update task."
        );
      }

      const updatedTask =
        await response.json();

      setTasks((previous) =>
        previous.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      notifyPlannerUpdated();
    } catch (err) {
      console.error(
        "Error updating task:",
        err
      );

      setError(
        "Unable to update task."
      );
    }
  };


  // ==================================================
  // TASK STATISTICS
  // ==================================================

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;


  const progress =
    tasks.length > 0
      ? Math.round(
          (completedTasks /
            tasks.length) *
            100
        )
      : 0;


  const remainingTasks =
    Math.max(
      0,
      tasks.length - completedTasks
    );


  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e1ebe6] bg-white p-6 shadow-[0_6px_24px_rgba(23,33,30,0.045)]">

      {/* Decorative glow */}

      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#6fcf97]/8 blur-3xl" />


      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <div className="relative flex items-start justify-between gap-4">

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
              Today
            </span>

          </div>

          <h3 className="mt-1.5 text-[18px] font-bold tracking-[-0.02em] text-[#25322e]">
            Today's Tasks
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#899690]">
            Stay focused and keep your study plan moving.
          </p>

        </div>


        {/* Completion indicator */}

        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">

          <svg
            viewBox="0 0 40 40"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#edf2ef"
              strokeWidth="3"
            />

            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#2fa084"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100.53"
              strokeDashoffset={
                100.53 -
                (100.53 * progress) /
                  100
              }
              className="transition-all duration-700"
            />
          </svg>

          <div className="relative text-center">
            <p className="text-xs font-bold leading-none text-[#1f6f5f]">
              {progress}%
            </p>

            <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-[#9aa7a2]">
              Done
            </p>
          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* Progress Summary */}
      {/* ================================================= */}

      <div className="relative mt-6 rounded-2xl border border-[#e2ece8] bg-[#f8fbfa] p-4">

        <div className="flex items-center justify-between gap-3">

          <div className="flex items-center gap-2.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2fa084] shadow-sm">
              <ListChecks
                size={16}
                strokeWidth={2}
              />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a39d]">
                Daily progress
              </p>

              <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                {completedTasks} of {tasks.length} tasks completed
              </p>
            </div>

          </div>


          <span className="rounded-lg bg-[#e5f5ee] px-2 py-1 text-[9px] font-bold text-[#2fa084]">
            {remainingTasks === 0 && tasks.length > 0
              ? "Complete"
              : `${remainingTasks} left`}
          </span>

        </div>


        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8efec]">

          <div
            className="h-full rounded-full bg-[#2fa084] transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>


      {/* ================================================= */}
      {/* Error */}
      {/* ================================================= */}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f2d4d4] bg-[#fff5f5] px-3 py-2.5">

          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d66a6a]" />

          <p className="text-[11px] font-medium text-[#b65353]">
            {error}
          </p>

        </div>
      )}


      {/* ================================================= */}
      {/* Loading */}
      {/* ================================================= */}

      {loading && (
        <div className="mt-5 space-y-2">

          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-3"
            >

              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#edf3f0]" />

              <div className="min-w-0 flex-1">
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#e7eeeb]" />

                <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded bg-[#f0f4f2]" />
              </div>

            </div>
          ))}

          <div className="flex items-center justify-center gap-2 pt-2">
            <Loader2
              size={14}
              className="animate-spin text-[#2fa084]"
            />

            <span className="text-[10px] font-medium text-[#9aa7a2]">
              Loading today's tasks...
            </span>
          </div>

        </div>
      )}


      {/* ================================================= */}
      {/* Empty State */}
      {/* ================================================= */}

      {!loading && tasks.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[#dce7e2] bg-[#f8fbfa] px-5 py-9 text-center">

          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#aab8b2] shadow-sm">
            <CalendarDays
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <p className="mt-3 text-xs font-semibold text-[#697873]">
            No tasks planned for today.
          </p>

          <p className="mx-auto mt-1 max-w-[240px] text-[10px] leading-5 text-[#9aa7a2]">
            Add a study task to keep your day structured and focused.
          </p>

        </div>
      )}


      {/* ================================================= */}
      {/* Task List */}
      {/* ================================================= */}

      {!loading && tasks.length > 0 && (
        <div className="relative mt-5 space-y-1">

          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 rounded-xl border px-2.5 py-3 transition-all duration-200 ${
                task.completed
                  ? "border-[#dceee6] bg-[#f3faf7]"
                  : "border-transparent hover:border-[#e2ece8] hover:bg-[#f8fbfa]"
              }`}
            >

              {/* Completion button */}

              <button
                type="button"
                onClick={() =>
                  handleToggleComplete(task)
                }
                title={
                  task.completed
                    ? "Mark as incomplete"
                    : "Mark as complete"
                }
                aria-label={
                  task.completed
                    ? `Mark ${task.title} as incomplete`
                    : `Mark ${task.title} as complete`
                }
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/20 ${
                  task.completed
                    ? "bg-[#2fa084] text-white shadow-sm hover:bg-[#1f6f5f]"
                    : "border-2 border-[#d9e3df] bg-white text-transparent hover:border-[#2fa084] hover:text-[#2fa084]"
                }`}
              >
                {task.completed ? (
                  <Check
                    size={15}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Circle
                    size={13}
                    strokeWidth={2}
                  />
                )}
              </button>


              {/* Task content */}

              <div className="min-w-0 flex-1">

                <p
                  className={`truncate text-xs font-semibold transition-colors duration-200 sm:text-[13px] ${
                    task.completed
                      ? "text-[#9aa7a2] line-through"
                      : "text-[#53635d] group-hover:text-[#1f6f5f]"
                  }`}
                >
                  {task.title}
                </p>


                {(task.task_time ||
                  task.duration) && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-[#9aa7a2]">

                    {task.task_time && (
                      <span className="flex items-center gap-1">
                        <Clock3
                          size={10}
                          strokeWidth={2}
                        />

                        {task.task_time}
                      </span>
                    )}

                    {task.task_time &&
                      task.duration && (
                        <span className="text-[#c7d0cc]">
                          •
                        </span>
                      )}

                    {task.duration && (
                      <span>
                        {task.duration} min
                      </span>
                    )}

                  </div>
                )}

              </div>


              {/* Completed badge */}

              {task.completed && (
                <span className="hidden shrink-0 rounded-md bg-[#e5f5ee] px-1.5 py-1 text-[9px] font-bold text-[#2fa084] sm:block">
                  Done
                </span>
              )}

            </div>
          ))}

        </div>
      )}


      {/* ================================================= */}
      {/* More Tasks */}
      {/* ================================================= */}

      {!loading && tasks.length > 4 && (
        <div className="mt-3 rounded-lg bg-[#f8fbfa] px-3 py-2 text-center">

          <p className="text-[10px] font-medium text-[#899690]">
            + {tasks.length - 4} more task
            {tasks.length - 4 === 1
              ? ""
              : "s"}{" "}
            in your planner
          </p>

        </div>
      )}


      {/* ================================================= */}
      {/* Open Planner */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() => navigate("/planner")}
        className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1f6f5f] py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(31,111,95,0.15)] transition-all duration-200 hover:bg-[#19594d] hover:shadow-[0_10px_24px_rgba(31,111,95,0.21)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6fcf97]/20"
      >
        <span>
          Open Study Planner
        </span>

        <ArrowRight
          size={15}
          strokeWidth={2.2}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>

    </div>
  );
}


export default TodaysTasks;