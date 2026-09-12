import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Circle,
  CalendarDays,
  ArrowRight,
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

  const handleToggleComplete = async (
    task
  ) => {
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            completed:
              !task.completed,
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

      // Tell Planner and other dashboard
      // components that the task changed.
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

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* ==================================================
          HEADER
          ================================================== */}

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

      {/* ==================================================
          PROGRESS
          ================================================== */}

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
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <div className="mt-5 flex items-center justify-center rounded-xl bg-[#F8F9F8] py-10">
          <div className="text-center">
            <Loader2
              size={24}
              className="mx-auto animate-spin text-[#2FA084]"
            />

            <p className="mt-3 text-sm text-gray-500">
              Loading today's tasks...
            </p>
          </div>
        </div>
      )}

      {/* ==================================================
          EMPTY STATE
          ================================================== */}

      {!loading && tasks.length === 0 && (
        <div className="mt-5 rounded-xl bg-[#F8F9F8] px-5 py-8 text-center">
          <CalendarDays
            size={28}
            className="mx-auto text-gray-300"
          />

          <p className="mt-3 text-sm font-medium text-gray-500">
            No tasks planned for today.
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-400">
            Add a study task to keep your day organized.
          </p>
        </div>
      )}

      {/* ==================================================
          TASK LIST
          ================================================== */}

      {!loading && tasks.length > 0 && (
        <div className="mt-5 space-y-1">
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-xl p-3 transition ${
                task.completed
                  ? "bg-[#6FCF97]/10"
                  : "hover:bg-[#EEEEEE]"
              }`}
            >
              <button
                onClick={() =>
                  handleToggleComplete(
                    task
                  )
                }
                title={
                  task.completed
                    ? "Mark as incomplete"
                    : "Mark as complete"
                }
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                  task.completed
                    ? "bg-[#2FA084] text-white"
                    : "border-2 border-gray-200 text-gray-300 hover:border-[#2FA084] hover:text-[#2FA084]"
                }`}
              >
                {task.completed ? (
                  <Check size={16} />
                ) : (
                  <Circle size={14} />
                )}
              </button>

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
                  {task.task_time && (
                    <>
                      <span>
                        {task.task_time}
                      </span>

                      {task.duration && (
                        <span>•</span>
                      )}
                    </>
                  )}

                  {task.duration && (
                    <span className="flex items-center gap-1">
                      <Clock3 size={12} />
                      {task.duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================
          MORE TASKS INDICATOR
          ================================================== */}

      {!loading && tasks.length > 4 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          + {tasks.length - 4} more task
          {tasks.length - 4 === 1
            ? ""
            : "s"}{" "}
          in your planner
        </p>
      )}

      {/* ==================================================
          OPEN PLANNER
          ================================================== */}

      <button
        onClick={() => navigate("/planner")}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA084] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
      >
        Open Study Planner
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default TodaysTasks;