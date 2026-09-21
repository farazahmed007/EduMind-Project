import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Edit3,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  notifyPlannerUpdated,
  subscribeToPlannerUpdates,
} from "../../utils/plannerEvents";
import AdaptiveInsights from "./AdaptiveInsights";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ==================================================
// DATE HELPERS
// ==================================================

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayDate = () => formatDateInput(new Date());

const parseDate = (dateString) => {
  if (!dateString) {
    return new Date();
  }

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatDisplayDate = (dateString) => {
  if (!dateString) {
    return "";
  }

  return parseDate(dateString).toLocaleDateString("en-IN", {
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

  return parseDate(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonthYear = (dateString) => {
  return parseDate(dateString).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getStartOfWeek = (dateString) => {
  const date = parseDate(dateString);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + mondayOffset);

  return date;
};

const getWeekDates = (dateString) => {
  const startOfWeek = getStartOfWeek(dateString);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    return formatDateInput(date);
  });
};

const shiftDateByDays = (dateString, days) => {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + days);

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
  return parseDate(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
  });
};

const getDayNumber = (dateString) => {
  return parseDate(dateString).getDate();
};

// ==================================================
// ADAPTIVE PLAN HELPERS
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
        container: "border-red-200 bg-red-50",
        icon: "bg-red-100 text-red-600",
        title: "text-red-700",
        text: "text-red-600",
      };

    case "performance_improving":
      return {
        container: "border-[#cdeee1] bg-[#f1faf6]",
        icon: "bg-[#e8f6f0] text-[#1f6f5f]",
        title: "text-[#1f6f5f]",
        text: "text-[#60756d]",
      };

    case "low_planner_adherence":
      return {
        container: "border-orange-200 bg-orange-50",
        icon: "bg-orange-100 text-orange-600",
        title: "text-orange-700",
        text: "text-orange-600",
      };

    case "no_duplicate_tasks":
      return {
        container: "border-blue-200 bg-blue-50",
        icon: "bg-blue-100 text-blue-600",
        title: "text-blue-700",
        text: "text-blue-600",
      };

    case "no_data":
      return {
        container: "border-[#e1e8e4] bg-[#f7f9f8]",
        icon: "bg-[#edf2ef] text-[#71817b]",
        title: "text-[#53635d]",
        text: "text-[#71817b]",
      };

    default:
      return {
        container: "border-[#cdeee1] bg-[#f3faf7]",
        icon: "bg-[#e8f6f0] text-[#1f6f5f]",
        title: "text-[#1f6f5f]",
        text: "text-[#60756d]",
      };
  }
};

// ==================================================
// COMPONENT
// ==================================================

function Planner() {
  const { token } = useAuth();

  const today = useMemo(() => getTodayDate(), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm(today));
  const [saving, setSaving] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [adaptivePlanResult, setAdaptivePlanResult] = useState(null);

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

      const params = new URLSearchParams({
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
        throw new Error("Failed to load study tasks.");
      }

      const data = await response.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading planner tasks:", err);
      setTasks([]);
      setError("Unable to load your study tasks.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH ALL TASKS
  // ==================================================

  const fetchAllTasks = async () => {
    if (!token) {
      setAllTasks([]);
      setCalendarLoading(false);
      return;
    }

    try {
      setCalendarLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/planner/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load calendar tasks.");
      }

      const data = await response.json();

      setAllTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading calendar tasks:", err);
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

    const unsubscribe = subscribeToPlannerUpdates(() => {
      fetchTasks();
      fetchAllTasks();
    });

    return unsubscribe;
  }, [token, selectedDate]);

  // ==================================================
  // REFRESH
  // ==================================================

  const refreshPlannerData = async () => {
    await Promise.all([fetchTasks(), fetchAllTasks()]);
  };

  // ==================================================
  // GENERATE ADAPTIVE PLAN
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
        // Safe fallback for empty responses.
      }

      if (!response.ok) {
        let message = "Failed to generate adaptive study plan.";

        if (data?.detail) {
          message = Array.isArray(data.detail)
            ? data.detail.map((item) => item.msg).join(", ")
            : data.detail;
        }

        throw new Error(message);
      }

      setAdaptivePlanResult(data);

      await refreshPlannerData();

      notifyPlannerUpdated();
    } catch (err) {
      console.error("Error generating adaptive study plan:", err);

      setError(
        err.message || "Unable to generate the adaptive study plan."
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  // ==================================================
  // CALENDAR COUNTS
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
        counts[task.task_date].completed += 1;
      }
    });

    return counts;
  }, [allTasks]);

  // ==================================================
  // FORM
  // ==================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingTaskId(null);
    setFormData(createEmptyForm(selectedDate));
    setError("");
    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTaskId(task.id);

    setFormData({
      title: task.title || "",
      description: task.description || "",
      task_date: task.task_date || selectedDate,
      task_time: task.task_time || "",
      duration: task.duration ? String(task.duration) : "",
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
    setFormData(createEmptyForm(selectedDate));
  };

  // ==================================================
  // DATE NAVIGATION
  // ==================================================

  const handlePreviousWeek = () => {
    const newDate = shiftDateByDays(selectedDate, -7);

    setSelectedDate(newDate);

    if (showForm) {
      setFormData(createEmptyForm(newDate));
    }
  };

  const handleNextWeek = () => {
    const newDate = shiftDateByDays(selectedDate, 7);

    setSelectedDate(newDate);

    if (showForm) {
      setFormData(createEmptyForm(newDate));
    }
  };

  const handleToday = () => {
    setSelectedDate(today);

    if (showForm) {
      setFormData(createEmptyForm(today));
    }
  };

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);

    if (showForm) {
      setFormData(createEmptyForm(dateString));
    }
  };

  const handleDateInputChange = (event) => {
    const newDate = event.target.value;

    setSelectedDate(newDate);

    if (showForm) {
      setFormData(createEmptyForm(newDate));
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

    const title = formData.title.trim();

    if (!title) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title,
        description: formData.description.trim() || null,
        task_date: formData.task_date,
        task_time: formData.task_time.trim() || null,
        duration: formData.duration
          ? Number(formData.duration)
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
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/api/planner/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        let message = editingTaskId
          ? "Failed to update task."
          : "Failed to create task.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = Array.isArray(data.detail)
              ? data.detail.map((item) => item.msg).join(", ")
              : data.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      await response.json();

      setShowForm(false);
      setEditingTaskId(null);
      setFormData(createEmptyForm(selectedDate));

      await refreshPlannerData();

      notifyPlannerUpdated();
    } catch (err) {
      console.error("Error saving planner task:", err);

      setError(err.message || "Unable to save the task.");
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // TOGGLE COMPLETION
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
        throw new Error("Failed to update task status.");
      }

      const updatedTask = await response.json();

      setTasks((previous) =>
        previous.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );

      setAllTasks((previous) =>
        previous.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );

      notifyPlannerUpdated();
    } catch (err) {
      console.error("Error updating task status:", err);
      setError("Unable to update task status.");
    }
  };

  // ==================================================
  // DELETE
  // ==================================================

  const handleDelete = async (taskId) => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
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
        throw new Error("Failed to delete task.");
      }

      setTasks((previous) =>
        previous.filter((task) => task.id !== taskId)
      );

      setAllTasks((previous) =>
        previous.filter((task) => task.id !== taskId)
      );

      notifyPlannerUpdated();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Unable to delete the task.");
    }
  };

  // ==================================================
  // STATS
  // ==================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  const totalDuration = tasks.reduce(
    (total, task) => total + (Number(task.duration) || 0),
    0
  );

  const selectedDateStats = taskCountsByDate[selectedDate];

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8 lg:pt-6 xl:px-10">

        {/* ==================================================
            HEADER
            ================================================== */}

        <section className="relative mb-6 overflow-hidden rounded-[24px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#eef9f4] px-5 py-5 shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#6fcf97]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#cdeee1]/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                <CalendarDays size={25} strokeWidth={2} />

                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#2fa084] text-white shadow-sm">
                  <Sparkles size={9} />
                </span>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82938c]">
                    Your workspace
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[10px] font-bold text-[#2fa084]">
                    Daily planning
                  </span>
                </div>

                <h1 className="text-[25px] font-bold tracking-[-0.03em] text-[#176b5b] sm:text-[29px] lg:text-[31px]">
                  Study Planner
                </h1>

                <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#71817b]">
                  Organize focused study sessions, track progress,
                  and let EduMind adapt your plan around your learning.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleGenerateAdaptivePlan}
                disabled={generatingPlan || saving}
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#bfe3d3] bg-white px-4 py-2.5 text-xs font-bold text-[#1f6f5f] shadow-sm transition-all duration-200 hover:border-[#8ecfb7] hover:bg-[#f4faf7] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingPlan ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#b9dfd0] border-t-[#2fa084]" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={15}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />
                    Generate Adaptive Plan
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                disabled={generatingPlan}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#1f6f5f] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                Add Study Task
              </button>
            </div>
          </div>
        </section>

        {/* ==================================================
            WEEKLY CALENDAR
            ================================================== */}

        <section className="mb-5 overflow-hidden rounded-[22px] border border-[#dfe8e4] bg-white shadow-[0_6px_25px_rgba(23,33,30,0.04)]">
          <div className="border-b border-[#edf2ef] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                    <CalendarDays size={15} />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a9993]">
                    Study calendar
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-[#43534d]">
                  {formatMonthYear(selectedDate)}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    selectedDate === today
                      ? "bg-[#2fa084] text-white shadow-sm"
                      : "border border-[#dfe7e3] bg-white text-[#687870] hover:border-[#a9dfcc] hover:text-[#1f6f5f]"
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={handlePreviousWeek}
                  title="Previous week"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe7e3] text-[#7a8983] transition hover:border-[#a9dfcc] hover:bg-[#f5faf7] hover:text-[#1f6f5f]"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  title="Next week"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dfe7e3] text-[#7a8983] transition hover:border-[#a9dfcc] hover:bg-[#f5faf7] hover:text-[#1f6f5f]"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDates.map((dateString) => {
                const isSelected = dateString === selectedDate;
                const isToday = dateString === today;
                const dateStats = taskCountsByDate[dateString];

                const totalTasks = dateStats?.total || 0;
                const completed = dateStats?.completed || 0;

                return (
                  <button
                    type="button"
                    key={dateString}
                    onClick={() => handleDateSelect(dateString)}
                    className={`group relative flex min-h-[88px] flex-col items-center justify-center rounded-2xl border p-2 transition-all duration-200 sm:min-h-[104px] ${
                      isSelected
                        ? "border-[#2fa084] bg-[#2fa084] text-white shadow-[0_8px_20px_rgba(47,160,132,0.18)]"
                        : isToday
                        ? "border-[#bfe3d3] bg-[#f0faf5] text-[#1f6f5f]"
                        : "border-transparent bg-[#fafcfb] text-[#60716a] hover:border-[#dceee6] hover:bg-[#f5faf7]"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        isSelected ? "text-white/75" : "text-[#9aa7a2]"
                      }`}
                    >
                      {getDayName(dateString)}
                    </span>

                    <span
                      className={`mt-1 text-[22px] font-bold tracking-tight ${
                        isSelected ? "text-white" : "text-[#43534d]"
                      }`}
                    >
                      {getDayNumber(dateString)}
                    </span>

                    {totalTasks > 0 ? (
                      <div
                        className={`mt-1.5 flex items-center gap-1.5 text-[9px] font-bold ${
                          isSelected
                            ? "text-white/85"
                            : "text-[#2fa084]"
                        }`}
                      >
                        <span>
                          {completed}/{totalTasks}
                        </span>

                        <span className="hidden sm:inline">
                          done
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`mt-2 text-[9px] font-medium ${
                          isSelected
                            ? "text-white/50"
                            : "text-[#b0bab6]"
                        }`}
                      >
                        No tasks
                      </span>
                    )}

                    {isToday && (
                      <span
                        className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${
                          isSelected ? "bg-white" : "bg-[#2fa084]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {calendarLoading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-medium text-[#98a6a1]">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-[#cdeee1] border-t-[#2fa084]" />
                Updating calendar
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            SELECTED DAY + QUICK SUMMARY
            ================================================== */}

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
          <div className="rounded-[22px] border border-[#dfe8e4] bg-white p-5 shadow-[0_6px_25px_rgba(23,33,30,0.04)] sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#e8f6f0] text-[#1f6f5f]">
                  <span className="text-[8px] font-bold uppercase tracking-widest">
                    {getDayName(selectedDate)}
                  </span>
                  <span className="text-lg font-bold leading-5">
                    {getDayNumber(selectedDate)}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#96a49e]">
                    Selected day
                  </p>

                  <h2 className="mt-1 truncate text-lg font-bold text-[#43534d] sm:text-xl">
                    {formatDisplayDate(selectedDate)}
                  </h2>

                  <p className="mt-1 text-xs font-medium text-[#8b9994]">
                    {selectedDateStats?.total || 0} planned task
                    {(selectedDateStats?.total || 0) === 1 ? "" : "s"}{" "}
                    for this day
                  </p>
                </div>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={handleDateInputChange}
                className="rounded-xl border border-[#dfe7e3] bg-[#fafcfb] px-3.5 py-2.5 text-xs font-semibold text-[#60716a] outline-none transition focus:border-[#2fa084] focus:ring-2 focus:ring-[#2fa084]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            <div className="rounded-[18px] border border-[#dfe8e4] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#809089]">
                <ListTodo size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Tasks
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#43534d]">
                {tasks.length}
              </p>
            </div>

            <div className="rounded-[18px] border border-[#dfe8e4] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#2fa084]">
                <Check size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Done
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2fa084]">
                {completedTasks}
              </p>
            </div>

            <div className="rounded-[18px] border border-[#dfe8e4] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-orange-500">
                <Target size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Pending
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-orange-500">
                {pendingTasks}
              </p>
            </div>

            <div className="rounded-[18px] border border-[#dfe8e4] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#71817b]">
                <Clock3 size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Minutes
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#43534d]">
                {totalDuration}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-[#fff8f8] px-4 py-3.5 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
              <X size={14} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-red-700">
                Something needs your attention
              </p>

              <p className="mt-0.5 text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ==================================================
            ADAPTIVE PLAN RESULT
            ================================================== */}

        {adaptivePlanResult && (
          <section
            className={`mb-5 overflow-hidden rounded-[22px] border p-5 shadow-sm sm:p-6 ${
              getAdaptiveModeClasses(
                adaptivePlanResult?.adaptation?.mode
              ).container
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  getAdaptiveModeClasses(
                    adaptivePlanResult?.adaptation?.mode
                  ).icon
                }`}
              >
                <Sparkles size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        getAdaptiveModeClasses(
                          adaptivePlanResult?.adaptation?.mode
                        ).title
                      }`}
                    >
                      Adaptive plan update
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
                    className={`inline-flex w-fit rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold ${
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

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#97a49f]">
                      Plan result
                    </p>

                    <p className="mt-1.5 text-sm font-bold text-[#53635d]">
                      {adaptivePlanResult.count === 0
                        ? "No new study tasks were created."
                        : `${adaptivePlanResult.count} new study task${
                            adaptivePlanResult.count === 1 ? "" : "s"
                          } created.`}
                    </p>
                  </div>

                  <div className="flex min-w-[74px] items-center justify-center rounded-2xl bg-[#2fa084] px-5 py-4 text-2xl font-bold text-white shadow-sm">
                    {adaptivePlanResult.count || 0}
                  </div>
                </div>

                {adaptivePlanResult?.adaptation?.reason && (
                  <div className="mt-4">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
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
                      {adaptivePlanResult.adaptation.reason}
                    </p>
                  </div>
                )}

                {adaptivePlanResult.message && (
                  <p className="mt-3 text-xs leading-5 text-[#71817b]">
                    {adaptivePlanResult.message}
                  </p>
                )}

                {adaptivePlanResult.count > 0 &&
                  Array.isArray(adaptivePlanResult.tasks) &&
                  adaptivePlanResult.tasks.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f6f5f]">
                        Generated study tasks
                      </p>

                      <div className="mt-3 grid gap-2">
                        {adaptivePlanResult.tasks.map((task) => (
                          <div
                            key={
                              task.id ||
                              `${task.material_id}-${task.task_date}`
                            }
                            className="rounded-xl border border-white bg-white/80 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#53635d]">
                                  {task.material_title}
                                </h4>

                                <p className="mt-1 text-[10px] text-[#9aa6a1]">
                                  Material ID: {task.material_id}
                                </p>
                              </div>

                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                  task.priority === "high"
                                    ? "bg-red-50 text-red-600"
                                    : task.priority === "medium"
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-[#e8f6f0] text-[#1f6f5f]"
                                }`}
                              >
                                {task.priority || "medium"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-[#7e8d87]">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                {formatTaskDate(task.task_date)}
                              </span>

                              <span className="flex items-center gap-1.5">
                                <Clock3 size={12} />
                                {task.duration} minutes
                              </span>

                              {task.quiz_score_trend &&
                                task.quiz_score_trend !==
                                  "insufficient_data" && (
                                  <span>
                                    Trend:{" "}
                                    <strong className="text-[#5b6b64]">
                                      {task.quiz_score_trend}
                                    </strong>
                                  </span>
                                )}

                              {task.average_quiz_score !== null &&
                                task.average_quiz_score !== undefined && (
                                  <span>
                                    Avg. score:{" "}
                                    <strong className="text-[#5b6b64]">
                                      {task.average_quiz_score}%
                                    </strong>
                                  </span>
                                )}
                            </div>

                            {task.recommended_action && (
                              <div className="mt-3 rounded-xl bg-[#f7faf8] px-3.5 py-3">
                                <p className="text-[10px] font-bold text-[#1f6f5f]">
                                  Recommended action
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#71817b]">
                                  {task.recommended_action}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            DAILY PROGRESS
            ================================================== */}

        <section className="mb-5 rounded-[22px] border border-[#dfe8e4] bg-white p-5 shadow-[0_6px_25px_rgba(23,33,30,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                  <Target size={13} />
                </div>

                <h3 className="text-sm font-bold text-[#43534d]">
                  Daily Progress
                </h3>
              </div>

              <p className="mt-1.5 text-xs font-medium text-[#8b9994]">
                {completedTasks} of {tasks.length} tasks completed
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-[#edf2ef] sm:w-48">
                <div
                  className="h-full rounded-full bg-[#2fa084] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="min-w-[38px] text-right text-sm font-bold text-[#2fa084]">
                {progress}%
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================
            AI INSIGHTS
            ================================================== */}

        <AdaptiveInsights />

        {/* ==================================================
            CREATE / EDIT FORM
            ================================================== */}

        {showForm && (
          <section className="mb-5 overflow-hidden rounded-[22px] border border-[#cdeee1] bg-white shadow-[0_8px_30px_rgba(23,33,30,0.05)]">
            <div className="border-b border-[#edf2ef] bg-gradient-to-r from-[#f7fcf9] to-white px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                    <Plus size={18} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#43534d]">
                      {editingTaskId
                        ? "Edit Study Task"
                        : "Add Study Task"}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#899791]">
                      {editingTaskId
                        ? "Update the details of your study session."
                        : "Create a focused task for your selected study day."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl p-2 text-[#9aa6a1] transition hover:bg-[#f3f6f4] hover:text-[#53635d] disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-xs font-bold text-[#53635d]"
                >
                  Task title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Study Machine Learning"
                  maxLength={255}
                  required
                  className="w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 py-3 text-sm font-medium text-[#53635d] outline-none transition placeholder:text-[#aab4b0] focus:border-[#2fa084] focus:bg-white focus:ring-2 focus:ring-[#2fa084]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-xs font-bold text-[#53635d]"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Add some details about what you want to study..."
                  maxLength={1000}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 py-3 text-sm font-medium text-[#53635d] outline-none transition placeholder:text-[#aab4b0] focus:border-[#2fa084] focus:bg-white focus:ring-2 focus:ring-[#2fa084]/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="task_date"
                    className="mb-2 block text-xs font-bold text-[#53635d]"
                  >
                    Date
                  </label>

                  <input
                    id="task_date"
                    name="task_date"
                    type="date"
                    value={formData.task_date}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 py-3 text-sm font-medium text-[#53635d] outline-none transition focus:border-[#2fa084] focus:bg-white focus:ring-2 focus:ring-[#2fa084]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task_time"
                    className="mb-2 block text-xs font-bold text-[#53635d]"
                  >
                    Time
                  </label>

                  <input
                    id="task_time"
                    name="task_time"
                    type="text"
                    value={formData.task_time}
                    onChange={handleFormChange}
                    placeholder="e.g. 4:00 PM"
                    maxLength={20}
                    className="w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 py-3 text-sm font-medium text-[#53635d] outline-none transition placeholder:text-[#aab4b0] focus:border-[#2fa084] focus:bg-white focus:ring-2 focus:ring-[#2fa084]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="mb-2 block text-xs font-bold text-[#53635d]"
                  >
                    Duration
                  </label>

                  <div className="relative">
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={handleFormChange}
                      placeholder="60"
                      className="w-full rounded-xl border border-[#dfe7e3] bg-[#fbfcfb] px-4 py-3 pr-20 text-sm font-medium text-[#53635d] outline-none transition placeholder:text-[#aab4b0] focus:border-[#2fa084] focus:bg-white focus:ring-2 focus:ring-[#2fa084]/10"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#9aa6a1]">
                      minutes
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#edf2ef] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-[#dfe7e3] px-5 py-2.5 text-xs font-bold text-[#66766f] transition hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1f6f5f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
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

        <section className="rounded-[22px] border border-[#dfe8e4] bg-white p-5 shadow-[0_6px_25px_rgba(23,33,30,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f6f0] text-[#2fa084]">
                  <ListTodo size={15} />
                </div>

                <h3 className="text-base font-bold text-[#43534d]">
                  Study Tasks
                </h3>
              </div>

              <p className="mt-1.5 text-xs font-medium text-[#8b9994]">
                Planned for {formatTaskDate(selectedDate)}
              </p>
            </div>

            {!showForm && (
              <button
                type="button"
                onClick={openCreateForm}
                className="hidden items-center gap-2 rounded-xl border border-[#bfe3d3] bg-[#f7fcf9] px-3.5 py-2 text-xs font-bold text-[#1f6f5f] transition hover:border-[#8ecfb7] hover:bg-[#e8f6f0] sm:flex"
              >
                <Plus size={15} />
                Add Task
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#edf2ef] bg-[#fbfcfb] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-[#edf2ef]" />

                    <div className="flex-1">
                      <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#edf2ef]" />
                      <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-[#f0f3f1]" />
                    </div>

                    <div className="h-8 w-16 animate-pulse rounded-lg bg-[#f0f3f1]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-dashed border-[#dce7e2] bg-[#fafcfb] px-6 py-14 text-center">
              <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-[#6fcf97]/10 blur-3xl" />

              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dceee6] bg-[#e8f6f0] text-[#2fa084]">
                <CalendarDays size={25} />
              </div>

              <h4 className="relative mt-5 text-base font-bold text-[#53635d]">
                No study tasks planned
              </h4>

              <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-[#8b9994]">
                Add a study task for this day to start building
                your personalized study plan.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2fa084] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f6f5f]"
              >
                <Plus size={15} />
                Add Your First Task
              </button>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <div className="mt-6 space-y-3">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                    task.completed
                      ? "border-[#cdeee1] bg-[#f4faf7]"
                      : "border-[#e5ece8] bg-[#fbfcfb] hover:border-[#cdeee1] hover:bg-white hover:shadow-[0_8px_24px_rgba(23,33,30,0.05)]"
                  }`}
                >
                  {task.completed && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#2fa084]" />
                  )}

                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      title={
                        task.completed
                          ? "Mark as incomplete"
                          : "Mark as complete"
                      }
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        task.completed
                          ? "bg-[#2fa084] text-white shadow-sm hover:bg-[#1f6f5f]"
                          : "border-2 border-[#d7e1dc] bg-white text-transparent hover:border-[#2fa084] hover:bg-[#f3faf7]"
                      }`}
                    >
                      {task.completed ? (
                        <Check size={17} strokeWidth={2.5} />
                      ) : (
                        <Circle size={17} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4
                            className={`text-sm font-bold ${
                              task.completed
                                ? "text-[#87958f] line-through"
                                : "text-[#46564f]"
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p
                              className={`mt-1.5 max-w-3xl text-xs leading-5 ${
                                task.completed
                                  ? "text-[#a0aca7]"
                                  : "text-[#7a8983]"
                              }`}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>

                        <span
                          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                            task.completed
                              ? "bg-[#e8f6f0] text-[#2fa084]"
                              : "bg-[#f0f3f1] text-[#7b8b84]"
                          }`}
                        >
                          {task.completed ? "Completed" : "Planned"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {task.task_time && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ece9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7c8b85]">
                            <Clock3
                              size={12}
                              className="text-[#2fa084]"
                            />
                            {task.task_time}
                          </span>
                        )}

                        {task.duration && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ece9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7c8b85]">
                            <Clock3 size={12} />
                            {task.duration} minute
                            {task.duration === 1 ? "" : "s"}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ece9] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7c8b85]">
                          <CalendarDays size={12} />
                          {formatTaskDate(task.task_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(task)}
                        title="Edit task"
                        className="rounded-xl p-2 text-[#9aa6a1] transition hover:bg-[#e8f6f0] hover:text-[#1f6f5f]"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                        className="rounded-xl p-2 text-[#9aa6a1] transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ==================================================
            MOBILE ADD
            ================================================== */}

        {!showForm && (
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2fa084] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f6f5f] sm:hidden"
          >
            <Plus size={16} />
            Add Study Task
          </button>
        )}
      </div>
    </div>
  );
}

export default Planner;