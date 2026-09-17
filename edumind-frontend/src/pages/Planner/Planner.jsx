import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  notifyPlannerUpdated,
  subscribeToPlannerUpdates,
} from "../../utils/plannerEvents";
import AdaptiveInsights from "./AdaptiveInsights";

const API_BASE_URL = "http://127.0.0.1:8000";

// ==================================================
// DATE HELPERS
// ==================================================

const formatDateInput = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  return formatDateInput(new Date());
};

const parseDate = (dateString) => {
  if (!dateString) {
    return new Date();
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const formatDisplayDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = parseDate(dateString);

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTaskDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = parseDate(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonthYear = (dateString) => {
  const date = parseDate(dateString);

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getStartOfWeek = (dateString) => {
  const date = parseDate(dateString);

  const day = date.getDay();

  // Monday = 0, Sunday = 6
  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + mondayOffset
  );

  return date;
};

const getWeekDates = (dateString) => {
  const startOfWeek =
    getStartOfWeek(dateString);

  return Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(
        startOfWeek
      );

      date.setDate(
        startOfWeek.getDate() + index
      );

      return formatDateInput(date);
    }
  );
};

const shiftDateByDays = (
  dateString,
  days
) => {
  const date = parseDate(dateString);

  date.setDate(
    date.getDate() + days
  );

  return formatDateInput(date);
};

const createEmptyForm = (date) => ({
  title: "",
  description: "",
  task_date: date,
  task_time: "",
  duration: "",
});

const getDayName = (dateString) => {
  const date = parseDate(dateString);

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
    }
  );
};

const getDayNumber = (dateString) => {
  const date = parseDate(dateString);

  return date.getDate();
};

// ==================================================
// ADAPTIVE PLAN MODE HELPERS
// ==================================================

const getAdaptiveModeLabel = (mode) => {
  switch (mode) {
    case "performance_declining":
      return "Performance Declining";

    case "performance_improving":
      return "Performance Improving";

    case "low_planner_adherence":
      return "Low Planner Adherence";

    case "no_duplicate_tasks":
      return "Plan Already Covered";

    case "no_data":
      return "Not Enough Learning Data";

    case "priority_based":
      return "Priority Based";

    default:
      return "Adaptive Update";
  }
};

const getAdaptiveModeClasses = (mode) => {
  switch (mode) {
    case "performance_declining":
      return {
        container:
          "border-red-200 bg-red-50",
        icon:
          "bg-red-100 text-red-600",
        title:
          "text-red-700",
        text:
          "text-red-600",
      };

    case "performance_improving":
      return {
        container:
          "border-[#6FCF97]/40 bg-[#6FCF97]/10",
        icon:
          "bg-[#6FCF97]/20 text-[#1F6F5F]",
        title:
          "text-[#1F6F5F]",
        text:
          "text-gray-600",
      };

    case "low_planner_adherence":
      return {
        container:
          "border-orange-200 bg-orange-50",
        icon:
          "bg-orange-100 text-orange-600",
        title:
          "text-orange-700",
        text:
          "text-orange-600",
      };

    case "no_duplicate_tasks":
      return {
        container:
          "border-blue-200 bg-blue-50",
        icon:
          "bg-blue-100 text-blue-600",
        title:
          "text-blue-700",
        text:
          "text-blue-600",
      };

    case "no_data":
      return {
        container:
          "border-gray-200 bg-gray-50",
        icon:
          "bg-gray-100 text-gray-500",
        title:
          "text-gray-700",
        text:
          "text-gray-500",
      };

    default:
      return {
        container:
          "border-[#6FCF97]/30 bg-[#F8F9F8]",
        icon:
          "bg-[#6FCF97]/20 text-[#1F6F5F]",
        title:
          "text-[#1F6F5F]",
        text:
          "text-gray-600",
      };
  }
};

// ==================================================
// PLANNER COMPONENT
// ==================================================

function Planner() {
  const { token } = useAuth();

  const today = useMemo(
    () => getTodayDate(),
    []
  );

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [tasks, setTasks] = useState([]);

  const [allTasks, setAllTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [calendarLoading, setCalendarLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingTaskId, setEditingTaskId] =
    useState(null);

  const [formData, setFormData] =
    useState(
      createEmptyForm(today)
    );

  const [saving, setSaving] =
    useState(false);

  const [generatingPlan, setGeneratingPlan] =
    useState(false);

  // ==================================================
  // ADAPTIVE PLAN RESULT
  // ==================================================

  const [adaptivePlanResult, setAdaptivePlanResult] =
    useState(null);

  // ==================================================
  // WEEK DATES
  // ==================================================

  const weekDates = useMemo(
    () => getWeekDates(selectedDate),
    [selectedDate]
  );

  // ==================================================
  // FETCH SELECTED DAY TASKS
  // ==================================================

  const fetchTasks = async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams({
          task_date: selectedDate,
        });

      const response = await fetch(
        `${API_BASE_URL}/api/planner/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load study tasks."
        );
      }

      const data =
        await response.json();

      setTasks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Error loading planner tasks:",
        err
      );

      setTasks([]);

      setError(
        "Unable to load your study tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH ALL USER TASKS
  // Used for calendar task indicators
  // ==================================================

  const fetchAllTasks = async () => {
    if (!token) {
      setAllTasks([]);
      setCalendarLoading(false);
      return;
    }

    try {
      setCalendarLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/planner/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load calendar tasks."
        );
      }

      const data =
        await response.json();

      setAllTasks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Error loading calendar tasks:",
        err
      );

      setAllTasks([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token, selectedDate]);

  useEffect(() => {
    fetchAllTasks();
  }, [token]);

  // ==================================================
  // CROSS-PAGE SYNCHRONIZATION
  // ==================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const unsubscribe =
      subscribeToPlannerUpdates(() => {
        fetchTasks();
        fetchAllTasks();
      });

    return unsubscribe;
  }, [token, selectedDate]);

  // ==================================================
  // REFRESH CALENDAR AFTER CHANGES
  // ==================================================

  const refreshPlannerData = async () => {
    await Promise.all([
      fetchTasks(),
      fetchAllTasks(),
    ]);
  };

  // ==================================================
  // GENERATE ADAPTIVE STUDY PLAN
  // ==================================================

  const handleGenerateAdaptivePlan = async () => {
    if (!token) {
      setError(
        "You must be logged in to generate an adaptive study plan."
      );
      return;
    }

    try {
      setGeneratingPlan(true);
      setError("");

      // Clear the previous generation result so
      // the UI reflects the latest generation only.
      setAdaptivePlanResult(null);

      const response = await fetch(
        `${API_BASE_URL}/api/adaptive/generate-plan`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        // Keep response handling safe if
        // the backend returns no JSON body.
      }

      if (!response.ok) {
        let message =
          "Failed to generate adaptive study plan.";

        if (data?.detail) {
          if (
            Array.isArray(data.detail)
          ) {
            message =
              data.detail
                .map(
                  (item) =>
                    item.msg
                )
                .join(", ");
          } else {
            message =
              data.detail;
          }
        }

        throw new Error(message);
      }

      // Store the complete backend result.
      // This powers the "why did my plan change?"
      // explanation shown in the UI.
      setAdaptivePlanResult(data);

      // Refresh planner immediately so newly-created
      // tasks appear in the calendar and task list.
      await refreshPlannerData();

      // Notify Dashboard and other planner components.
      notifyPlannerUpdated();
    } catch (err) {
      console.error(
        "Error generating adaptive study plan:",
        err
      );

      setError(
        err.message ||
          "Unable to generate the adaptive study plan."
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  // ==================================================
  // CALENDAR TASK COUNTS
  // ==================================================

  const taskCountsByDate = useMemo(() => {
    const counts = {};

    allTasks.forEach((task) => {
      if (!task.task_date) {
        return;
      }

      if (!counts[task.task_date]) {
        counts[task.task_date] = {
          total: 0,
          completed: 0,
        };
      }

      counts[task.task_date].total += 1;

      if (task.completed) {
        counts[
          task.task_date
        ].completed += 1;
      }
    });

    return counts;
  }, [allTasks]);

  // ==================================================
  // FORM HANDLERS
  // ==================================================

  const handleFormChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingTaskId(null);

    setFormData(
      createEmptyForm(selectedDate)
    );

    setError("");
    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTaskId(task.id);

    setFormData({
      title: task.title || "",
      description:
        task.description || "",
      task_date:
        task.task_date ||
        selectedDate,
      task_time:
        task.task_time || "",
      duration:
        task.duration
          ? String(task.duration)
          : "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingTaskId(null);

    setFormData(
      createEmptyForm(selectedDate)
    );
  };

  // ==================================================
  // DATE NAVIGATION
  // ==================================================

  const handlePreviousWeek = () => {
    const newDate = shiftDateByDays(
      selectedDate,
      -7
    );

    setSelectedDate(newDate);

    if (showForm) {
      setFormData(
        createEmptyForm(newDate)
      );
    }
  };

  const handleNextWeek = () => {
    const newDate = shiftDateByDays(
      selectedDate,
      7
    );

    setSelectedDate(newDate);

    if (showForm) {
      setFormData(
        createEmptyForm(newDate)
      );
    }
  };

  const handleToday = () => {
    setSelectedDate(today);

    if (showForm) {
      setFormData(
        createEmptyForm(today)
      );
    }
  };

  const handleDateSelect = (
    dateString
  ) => {
    setSelectedDate(dateString);

    if (showForm) {
      setFormData(
        createEmptyForm(dateString)
      );
    }
  };

  // ==================================================
  // CREATE / UPDATE TASK
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "You must be logged in to manage study tasks."
      );
      return;
    }

    const title =
      formData.title.trim();

    if (!title) {
      setError(
        "Please enter a task title."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title,
        description:
          formData.description.trim() ||
          null,
        task_date:
          formData.task_date,
        task_time:
          formData.task_time.trim() ||
          null,
        duration:
          formData.duration
            ? Number(
                formData.duration
              )
            : null,
      };

      let response;

      if (editingTaskId) {
        response = await fetch(
          `${API_BASE_URL}/api/planner/${editingTaskId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/planner/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      if (!response.ok) {
        let message =
          editingTaskId
            ? "Failed to update task."
            : "Failed to create task.";

        try {
          const data =
            await response.json();

          if (data?.detail) {
            if (
              Array.isArray(
                data.detail
              )
            ) {
              message =
                data.detail
                  .map(
                    (item) =>
                      item.msg
                  )
                  .join(", ");
            } else {
              message =
                data.detail;
            }
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      await response.json();

      setShowForm(false);
      setEditingTaskId(null);

      setFormData(
        createEmptyForm(
          selectedDate
        )
      );

      await refreshPlannerData();

      // Notify Dashboard and other
      // planner components.
      notifyPlannerUpdated();
    } catch (err) {
      console.error(
        "Error saving planner task:",
        err
      );

      setError(
        err.message ||
          "Unable to save the task."
      );
    } finally {
      setSaving(false);
    }
  };

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
          "Failed to update task status."
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

      setAllTasks((previous) =>
        previous.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );

      // Notify Dashboard.
      notifyPlannerUpdated();
    } catch (err) {
      console.error(
        "Error updating task status:",
        err
      );

      setError(
        "Unable to update task status."
      );
    }
  };

  // ==================================================
  // DELETE TASK
  // ==================================================

  const handleDelete = async (
    taskId
  ) => {
    if (!token) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this study task?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/planner/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete task."
        );
      }

      setTasks((previous) =>
        previous.filter(
          (task) =>
            task.id !== taskId
        )
      );

      setAllTasks((previous) =>
        previous.filter(
          (task) =>
            task.id !== taskId
        )
      );

      // Notify Dashboard.
      notifyPlannerUpdated();
    } catch (err) {
      console.error(
        "Error deleting task:",
        err
      );

      setError(
        "Unable to delete the task."
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

  const pendingTasks =
    tasks.length -
    completedTasks;

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
    <div className="min-h-full bg-[#EEEEEE] px-4 py-5 sm:px-6 lg:px-8">

      {/* ==================================================
          HEADER
          ================================================== */}

      <section className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FCF97]/20 text-[#1F6F5F]">
                <CalendarDays
                  size={24}
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-[#1F6F5F]">
                  Study Planner
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Organize your study sessions and
                  stay on track.
                </p>
              </div>

            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <button
              onClick={
                handleGenerateAdaptivePlan
              }
              disabled={
                generatingPlan ||
                saving
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-[#2FA084] bg-white px-5 py-3 text-sm font-semibold text-[#1F6F5F] shadow-sm transition hover:bg-[#6FCF97]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingPlan ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2FA084] border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Adaptive Plan
                </>
              )}
            </button>

            <button
              onClick={openCreateForm}
              disabled={generatingPlan}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              Add Study Task
            </button>

          </div>
        </div>
      </section>

      {/* ==================================================
          WEEKLY CALENDAR
          ================================================== */}

      <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Study Calendar
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#1F6F5F]">
              {formatMonthYear(
                selectedDate
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={handleToday}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedDate === today
                  ? "bg-[#2FA084] text-white"
                  : "border border-gray-200 text-gray-600 hover:border-[#2FA084] hover:text-[#1F6F5F]"
              }`}
            >
              Today
            </button>

            <button
              onClick={
                handlePreviousWeek
              }
              title="Previous week"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#2FA084] hover:text-[#1F6F5F]"
            >
              <ChevronLeft
                size={19}
              />
            </button>

            <button
              onClick={
                handleNextWeek
              }
              title="Next week"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#2FA084] hover:text-[#1F6F5F]"
            >
              <ChevronRight
                size={19}
              />
            </button>

          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">

          {weekDates.map(
            (dateString) => {
              const isSelected =
                dateString ===
                selectedDate;

              const isToday =
                dateString === today;

              const dateStats =
                taskCountsByDate[
                  dateString
                ];

              const totalTasks =
                dateStats?.total || 0;

              const completed =
                dateStats?.completed ||
                0;

              return (
                <button
                  key={dateString}
                  onClick={() =>
                    handleDateSelect(
                      dateString
                    )
                  }
                  className={`relative flex min-h-[82px] flex-col items-center justify-center rounded-xl border p-2 transition sm:min-h-[94px] ${
                    isSelected
                      ? "border-[#2FA084] bg-[#2FA084] text-white shadow-sm"
                      : isToday
                      ? "border-[#2FA084]/50 bg-[#6FCF97]/10 text-[#1F6F5F]"
                      : "border-gray-100 bg-white text-gray-600 hover:border-[#2FA084]/40 hover:bg-[#F8F9F8]"
                  }`}
                >

                  <span
                    className={`text-xs font-medium ${
                      isSelected
                        ? "text-white/80"
                        : "text-gray-400"
                    }`}
                  >
                    {getDayName(
                      dateString
                    )}
                  </span>

                  <span
                    className={`mt-1 text-xl font-bold ${
                      isSelected
                        ? "text-white"
                        : "text-[#1F6F5F]"
                    }`}
                  >
                    {getDayNumber(
                      dateString
                    )}
                  </span>

                  {totalTasks > 0 && (
                    <div
                      className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${
                        isSelected
                          ? "text-white/90"
                          : "text-[#2FA084]"
                      }`}
                    >
                      <span>
                        {completed}/
                        {totalTasks}
                      </span>

                      <span className="hidden sm:inline">
                        tasks
                      </span>
                    </div>
                  )}

                  {isToday && (
                    <span
                      className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : "bg-[#2FA084]"
                      }`}
                    />
                  )}

                </button>
              );
            }
          )}

        </div>

        {calendarLoading && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Updating calendar...
          </p>
        )}

      </section>

      {/* ==================================================
          SELECTED DATE
          ================================================== */}

      <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Selected Day
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#1F6F5F]">
              {formatDisplayDate(
                selectedDate
              )}
            </h2>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              const newDate =
                event.target.value;

              setSelectedDate(
                newDate
              );

              if (showForm) {
                setFormData(
                  createEmptyForm(
                    newDate
                  )
                );
              }
            }}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
          />

        </div>

      </section>

      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              setError("")
            }
            className="shrink-0 text-red-400 transition hover:text-red-600"
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* ==================================================
          ADAPTIVE PLAN UPDATE
          ================================================== */}

      {adaptivePlanResult && (
        <section
          className={`mb-5 rounded-2xl border p-5 shadow-sm ${
            getAdaptiveModeClasses(
              adaptivePlanResult?.adaptation?.mode
            ).container
          }`}
        >

          <div className="flex items-start gap-3">

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                getAdaptiveModeClasses(
                  adaptivePlanResult?.adaptation?.mode
                ).icon
              }`}
            >
              <Sparkles size={21} />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      getAdaptiveModeClasses(
                        adaptivePlanResult?.adaptation?.mode
                      ).title
                    }`}
                  >
                    Adaptive Plan Update
                  </p>

                  <h3
                    className={`mt-1 text-lg font-bold ${
                      getAdaptiveModeClasses(
                        adaptivePlanResult?.adaptation?.mode
                      ).title
                    }`}
                  >
                    {adaptivePlanResult.count > 0
                      ? "Your study plan was adapted"
                      : "Your study plan is already up to date"}
                  </h3>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-bold ${
                    getAdaptiveModeClasses(
                      adaptivePlanResult?.adaptation?.mode
                    ).title
                  }`}
                >
                  {getAdaptiveModeLabel(
                    adaptivePlanResult?.adaptation?.mode
                  )}
                </span>

              </div>

              {/* ==================================================
                  COUNT
                  ================================================== */}

              <div className="mt-4 rounded-xl bg-white/80 p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Plan Result
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {adaptivePlanResult.count === 0
                        ? "No new study tasks were created."
                        : `${adaptivePlanResult.count} new study task${
                            adaptivePlanResult.count === 1
                              ? ""
                              : "s"
                          } created.`}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2FA084] text-lg font-bold text-white">
                    {adaptivePlanResult.count || 0}
                  </div>

                </div>

              </div>

              {/* ==================================================
                  WHY DID THE PLAN CHANGE?
                  ================================================== */}

              {adaptivePlanResult?.adaptation?.reason && (
                <div className="mt-4">

                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      getAdaptiveModeClasses(
                        adaptivePlanResult?.adaptation?.mode
                      ).title
                    }`}
                  >
                    Why did my plan change?
                  </p>

                  <p
                    className={`mt-1 text-sm leading-6 ${
                      getAdaptiveModeClasses(
                        adaptivePlanResult?.adaptation?.mode
                      ).text
                    }`}
                  >
                    {
                      adaptivePlanResult
                        .adaptation
                        .reason
                    }
                  </p>

                </div>
              )}

              {/* ==================================================
                  BACKEND MESSAGE
                  ================================================== */}

              {adaptivePlanResult.message && (
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  {adaptivePlanResult.message}
                </p>
              )}

              {/* ==================================================
                  GENERATED TASKS
                  ================================================== */}

              {adaptivePlanResult.count > 0 &&
                Array.isArray(
                  adaptivePlanResult.tasks
                ) &&
                adaptivePlanResult.tasks.length > 0 && (
                  <div className="mt-5">

                    <p className="text-xs font-bold uppercase tracking-wide text-[#1F6F5F]">
                      Generated Study Tasks
                    </p>

                    <div className="mt-3 space-y-2">

                      {adaptivePlanResult.tasks.map(
                        (task) => (
                          <div
                            key={
                              task.id ||
                              `${task.material_id}-${task.task_date}`
                            }
                            className="rounded-xl border border-white bg-white/80 p-4"
                          >

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                              <div className="min-w-0">

                                <h4 className="text-sm font-bold text-gray-700">
                                  {task.material_title}
                                </h4>

                                <p className="mt-1 text-xs text-gray-400">
                                  Material ID:{" "}
                                  {task.material_id}
                                </p>

                              </div>

                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                  task.priority ===
                                  "high"
                                    ? "bg-red-50 text-red-600"
                                    : task.priority ===
                                      "medium"
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-[#6FCF97]/15 text-[#1F6F5F]"
                                }`}
                              >
                                {task.priority ||
                                  "medium"}
                              </span>

                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">

                              <span className="flex items-center gap-1.5">
                                <CalendarDays
                                  size={13}
                                />
                                {formatTaskDate(
                                  task.task_date
                                )}
                              </span>

                              <span className="flex items-center gap-1.5">
                                <Clock3
                                  size={13}
                                />
                                {task.duration}{" "}
                                minutes
                              </span>

                              {task.quiz_score_trend &&
                                task.quiz_score_trend !==
                                  "insufficient_data" && (
                                  <span>
                                    Trend:{" "}
                                    <strong className="font-semibold text-gray-600">
                                      {
                                        task.quiz_score_trend
                                      }
                                    </strong>
                                  </span>
                                )}

                              {task.average_quiz_score !==
                                null &&
                                task.average_quiz_score !==
                                  undefined && (
                                  <span>
                                    Avg. score:{" "}
                                    <strong className="font-semibold text-gray-600">
                                      {
                                        task.average_quiz_score
                                      }
                                      %
                                    </strong>
                                  </span>
                                )}

                            </div>

                            {task.recommended_action && (
                              <div className="mt-3 rounded-lg bg-[#F8F9F8] px-3 py-2.5">

                                <p className="text-xs font-semibold text-[#1F6F5F]">
                                  Recommended action
                                </p>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                  {
                                    task.recommended_action
                                  }
                                </p>

                              </div>
                            )}

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

            </div>

          </div>

        </section>
      )}

      {/* ==================================================
          OVERVIEW CARDS
          ================================================== */}

      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Tasks
          </p>

          <p className="mt-1 text-3xl font-bold text-[#1F6F5F]">
            {tasks.length}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Planned for this day
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Completed
          </p>

          <p className="mt-1 text-3xl font-bold text-[#2FA084]">
            {completedTasks}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Tasks finished
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Remaining
          </p>

          <p className="mt-1 text-3xl font-bold text-orange-500">
            {pendingTasks}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Tasks still to complete
          </p>
        </div>

      </section>

      {/* ==================================================
          DAILY PROGRESS
          ================================================== */}

      <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="mb-2 flex items-center justify-between">

          <div>
            <h3 className="text-sm font-semibold text-[#1F6F5F]">
              Daily Progress
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              {completedTasks} of{" "}
              {tasks.length} tasks completed
            </p>
          </div>

          <span className="text-sm font-bold text-[#2FA084]">
            {progress}%
          </span>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#EEEEEE]">

          <div
            className="h-full rounded-full bg-[#2FA084] transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </section>

      {/* ==================================================
          ADAPTIVE AI INSIGHTS
          ================================================== */}

      <AdaptiveInsights />

      {/* ==================================================
          CREATE / EDIT FORM
          ================================================== */}

      {showForm && (
        <section className="mb-5 rounded-2xl border border-[#2FA084]/30 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-start justify-between">

            <div>
              <h3 className="text-lg font-bold text-[#1F6F5F]">
                {editingTaskId
                  ? "Edit Study Task"
                  : "Add Study Task"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {editingTaskId
                  ? "Update the details of your study task."
                  : "Create a task for your selected study day."}
              </p>
            </div>

            <button
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Task Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={
                  handleFormChange
                }
                placeholder="e.g. Study Machine Learning"
                maxLength={255}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleFormChange
                }
                placeholder="Add some details about what you want to study..."
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div>
                <label
                  htmlFor="task_date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Date
                </label>

                <input
                  id="task_date"
                  name="task_date"
                  type="date"
                  value={
                    formData.task_date
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="task_time"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Time
                </label>

                <input
                  id="task_time"
                  name="task_time"
                  type="text"
                  value={
                    formData.task_time
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="e.g. 4:00 PM"
                  maxLength={20}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Duration
                </label>

                <div className="relative">

                  <input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={
                      formData.duration
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="60"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-16 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    minutes
                  </span>

                </div>
              </div>

            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {editingTaskId
                      ? "Save Changes"
                      : "Create Task"}
                  </>
                )}

              </button>

            </div>

          </form>

        </section>
      )}

      {/* ==================================================
          TASK LIST
          ================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-lg font-bold text-[#1F6F5F]">
              Study Tasks
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Tasks planned for{" "}
              {formatTaskDate(
                selectedDate
              )}
            </p>
          </div>

          {!showForm && (
            <button
              onClick={openCreateForm}
              className="hidden items-center gap-2 rounded-xl border border-[#2FA084] px-4 py-2 text-sm font-semibold text-[#1F6F5F] transition hover:bg-[#2FA084] hover:text-white sm:flex"
            >
              <Plus size={17} />
              Add Task
            </button>
          )}

        </div>

        {loading && (
          <div className="mt-6 space-y-4">

            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
              >

                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />

                <div className="flex-1">

                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />

                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />

                </div>

              </div>
            ))}

          </div>
        )}

        {!loading &&
          tasks.length === 0 && (
            <div className="mt-6 rounded-xl bg-[#F8F9F8] px-6 py-14 text-center">

              <CalendarDays
                size={34}
                className="mx-auto text-gray-300"
              />

              <h4 className="mt-4 text-base font-semibold text-gray-600">
                No study tasks planned
              </h4>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                Add a study task for this
                day to start building your
                personalized study plan.
              </p>

              <button
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F6F5F]"
              >
                <Plus size={17} />
                Add Your First Task
              </button>

            </div>
          )}

        {!loading &&
          tasks.length > 0 && (
            <div className="mt-6 space-y-3">

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-xl border p-4 transition ${
                    task.completed
                      ? "border-[#6FCF97]/30 bg-[#6FCF97]/10"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  }`}
                >

                  <div className="flex items-start gap-3">

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
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                        task.completed
                          ? "bg-[#2FA084] text-white"
                          : "border-2 border-gray-200 text-transparent hover:border-[#2FA084]"
                      }`}
                    >
                      {task.completed ? (
                        <Check
                          size={17}
                        />
                      ) : (
                        <Circle
                          size={17}
                        />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">

                      <h4
                        className={`text-sm font-semibold ${
                          task.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p
                          className={`mt-1 text-sm leading-5 ${
                            task.completed
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {
                            task.description
                          }
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">

                        {task.task_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock3
                              size={13}
                            />
                            {
                              task.task_time
                            }
                          </span>
                        )}

                        {task.duration && (
                          <span>
                            {task.duration}{" "}
                            minute
                            {task.duration ===
                            1
                              ? ""
                              : "s"}
                          </span>
                        )}

                        <span>
                          {formatTaskDate(
                            task.task_date
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-1">

                      <button
                        onClick={() =>
                          openEditForm(
                            task
                          )
                        }
                        title="Edit task"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[#1F6F5F]"
                      >
                        <Edit3
                          size={17}
                        />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            task.id
                          )
                        }
                        title="Delete task"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

      </section>

      {/* ==================================================
          MOBILE ADD BUTTON
          ================================================== */}

      {!showForm && (
        <button
          onClick={openCreateForm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2FA084] py-3 text-sm font-semibold text-white transition hover:bg-[#1F6F5F] sm:hidden"
        >
          <Plus size={18} />
          Add Study Task
        </button>
      )}

    </div>
  );
}

export default Planner;