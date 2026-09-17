import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  Brain,
  Clock3,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  notifications: true,
  studyReminders: true,
  adaptiveLearning: true,
  aiExplanations: true,
  studyDuration: 45,
};

function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("edumind-settings");

    if (!savedSettings) {
      return DEFAULT_SETTINGS;
    }

    const parsedSettings = JSON.parse(savedSettings);

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
    };
  } catch (error) {
    console.error("Unable to load EduMind settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        "edumind-settings",
        JSON.stringify(settings)
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Unable to save EduMind settings:", error);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "edumind-settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-full bg-[#EEEEEE] px-6 py-8">
      <div className="mx-auto max-w-5xl">

        {/* Page Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DDF3EA]">
            <SettingsIcon
              size={28}
              className="text-[#1F6F5F]"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#176B5B]">
              Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Customize your EduMind learning experience.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7F1]">
              <Bell
                size={20}
                className="text-[#1F6F5F]"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Notifications
              </h2>

              <p className="text-sm text-gray-500">
                Control how EduMind keeps you updated.
              </p>
            </div>
          </div>

          <SettingToggle
            title="Enable notifications"
            description="Receive important updates and learning notifications."
            checked={settings.notifications}
            onChange={(value) =>
              updateSetting("notifications", value)
            }
          />

          <SettingToggle
            title="Study reminders"
            description="Get reminders for your planned study sessions."
            checked={settings.studyReminders}
            onChange={(value) =>
              updateSetting("studyReminders", value)
            }
          />
        </section>

        {/* Learning Preferences */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7F1]">
              <Brain
                size={20}
                className="text-[#1F6F5F]"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Learning Preferences
              </h2>

              <p className="text-sm text-gray-500">
                Configure how EduMind adapts your study experience.
              </p>
            </div>
          </div>

          <SettingToggle
            title="Adaptive learning"
            description="Allow EduMind to adjust study recommendations based on your performance."
            checked={settings.adaptiveLearning}
            onChange={(value) =>
              updateSetting("adaptiveLearning", value)
            }
          />

          <div className="border-t border-gray-100 pt-5">
            <label
              htmlFor="study-duration"
              className="block text-sm font-semibold text-gray-800"
            >
              Default study-session duration
            </label>

            <p className="mt-1 text-sm text-gray-500">
              Used as the default duration when creating study sessions.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Clock3
                size={19}
                className="text-[#1F6F5F]"
              />

              <select
                id="study-duration"
                value={settings.studyDuration}
                onChange={(event) =>
                  updateSetting(
                    "studyDuration",
                    Number(event.target.value)
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
              >
                <option value={25}>25 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>
        </section>

        {/* AI Preferences */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7F1]">
              <Bot
                size={20}
                className="text-[#1F6F5F]"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                AI Preferences
              </h2>

              <p className="text-sm text-gray-500">
                Customize how EduMind's AI assistant helps you learn.
              </p>
            </div>
          </div>

          <SettingToggle
            title="Detailed AI explanations"
            description="Allow the AI Tutor to provide more detailed explanations when answering questions."
            checked={settings.aiExplanations}
            onChange={(value) =>
              updateSetting("aiExplanations", value)
            }
          />
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            {saved ? (
              <p className="text-sm font-medium text-[#1F6F5F]">
                ✓ Settings saved successfully.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Changes are saved when you click Save Settings.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#258B72]"
            >
              <Save size={17} />
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-gray-100 py-5 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-800">
          {title}
        </h3>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#2FA084]"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}