import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  Brain,
  Check,
  Clock3,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  SlidersHorizontal,
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

  const activePreferences = [
    settings.notifications,
    settings.studyReminders,
    settings.adaptiveLearning,
    settings.aiExplanations,
  ].filter(Boolean).length;

  return (
    <div className="min-h-full bg-[#f4f7f6]">
      <div className="mx-auto w-full max-w-[1450px] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8 lg:pt-7 xl:px-10">

        {/* Page Header */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-6 overflow-hidden rounded-[26px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#eef9f4] px-5 py-6 shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:px-7 sm:py-7"
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#cdeee1]/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-4">

              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                <SettingsIcon
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
                    Account
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                  <span className="text-[10px] font-semibold text-[#2fa084]">
                    Preferences
                  </span>

                </div>

                <h1 className="text-[25px] font-bold tracking-[-0.03em] text-[#176b5b] sm:text-[29px]">
                  Settings
                </h1>

                <p className="mt-1 max-w-2xl text-sm font-medium leading-5 text-[#7b8984]">
                  Customize how EduMind communicates, adapts, and supports your learning.
                </p>

              </div>
            </div>

            {/* Preference Summary */}
            <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-[#dfeae5] bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm md:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dceee6] bg-[#e8f6f0] text-[#2fa084]">
                <SlidersHorizontal
                  size={16}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#98a6a1]">
                  Active preferences
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#53635d]">
                  {activePreferences} of 4 enabled
                </p>
              </div>

            </div>
          </div>
        </motion.section>

        {/* Save Feedback */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-[#cdeee1] bg-[#f3faf7] px-4 py-3.5 text-sm font-semibold text-[#287762] shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dff3e9] text-[#2fa084]">
              <Check
                size={16}
                strokeWidth={2.5}
              />
            </span>

            <span>
              Settings saved successfully.
            </span>
          </motion.div>
        )}

        {/* Settings Sections */}
        <div className="space-y-5">

          {/* Notifications */}
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Control how EduMind keeps you updated about your learning activity."
            delay={0.05}
          >
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
          </SettingsSection>

          {/* Learning Preferences */}
          <SettingsSection
            icon={Brain}
            title="Learning Preferences"
            description="Configure how EduMind adapts your study experience."
            delay={0.1}
          >
            <SettingToggle
              title="Adaptive learning"
              description="Allow EduMind to adjust study recommendations based on your performance."
              checked={settings.adaptiveLearning}
              onChange={(value) =>
                updateSetting("adaptiveLearning", value)
              }
            />

            <div className="border-t border-[#edf1ef] px-1 pt-5 sm:px-2">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <div className="flex items-center gap-2">

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f7f4] text-[#6f837b]">
                      <Clock3 size={15} />
                    </span>

                    <h3 className="text-sm font-bold text-[#17211e]">
                      Default study-session duration
                    </h3>

                  </div>

                  <p className="mt-2 max-w-2xl pl-10 text-sm leading-6 text-[#7d8c86]">
                    Used as the default duration when creating study sessions.
                  </p>

                </div>

                <div className="shrink-0">

                  <label
                    htmlFor="study-duration"
                    className="sr-only"
                  >
                    Default study-session duration
                  </label>

                  <select
                    id="study-duration"
                    value={settings.studyDuration}
                    onChange={(event) =>
                      updateSetting(
                        "studyDuration",
                        Number(event.target.value)
                      )
                    }
                    className="min-w-[175px] cursor-pointer appearance-none rounded-xl border border-[#dce7e2] bg-[#f7faf9] px-4 py-3 text-sm font-semibold text-[#53635d] outline-none transition-all duration-200 hover:border-[#c5ddd3] hover:bg-white focus:border-[#2fa084] focus:bg-white focus:ring-4 focus:ring-[#2fa084]/10"
                  >
                    <option value={25}>
                      25 minutes
                    </option>

                    <option value={45}>
                      45 minutes
                    </option>

                    <option value={60}>
                      60 minutes
                    </option>

                    <option value={90}>
                      90 minutes
                    </option>
                  </select>

                </div>
              </div>
            </div>
          </SettingsSection>

          {/* AI Preferences */}
          <SettingsSection
            icon={Bot}
            title="AI Preferences"
            description="Customize how EduMind's AI assistant supports your learning."
            delay={0.15}
          >
            <SettingToggle
              title="Detailed AI explanations"
              description="Allow the AI Tutor to provide more detailed explanations when answering questions."
              checked={settings.aiExplanations}
              onChange={(value) =>
                updateSetting("aiExplanations", value)
              }
            />
          </SettingsSection>

        </div>

        {/* Actions */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.2,
          }}
          className="mt-6 rounded-[22px] border border-[#dfe7e3] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.04)] sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                  <Save
                    size={16}
                    strokeWidth={2.2}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#17211e]">
                    Save your preferences
                  </h2>

                  <p className="mt-0.5 text-xs font-medium text-[#87938e]">
                    Your settings are stored locally in this browser.
                  </p>
                </div>

              </div>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9e2de] bg-white px-5 py-3 text-sm font-semibold text-[#53635d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f7f9f8] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6fcf97]/30 focus:ring-offset-2"
              >
                <RotateCcw size={16} />
                Reset to Defaults
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#278c73] hover:shadow-[0_8px_22px_rgba(47,160,132,0.22)] focus:outline-none focus:ring-2 focus:ring-[#6fcf97]/40 focus:ring-offset-2"
              >
                <Save size={16} />
                Save Settings
              </button>

            </div>
          </div>
        </motion.section>

        <p className="mt-6 text-center text-[10px] font-medium text-[#a0aaa6]">
          EduMind · Preferences & Settings
        </p>

      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  delay,
  children,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay,
      }}
      className="overflow-hidden rounded-[22px] border border-[#dfe7e3] bg-white shadow-[0_6px_24px_rgba(23,33,30,0.04)]"
    >
      <div className="border-b border-[#edf1ef] px-5 py-5 sm:px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d7eee4] bg-[#e8f6f0] text-[#1f6f5f]">
            <Icon
              size={20}
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">

            <h2 className="text-base font-bold tracking-[-0.01em] text-[#17211e]">
              {title}
            </h2>

            <p className="mt-1 text-sm font-medium leading-5 text-[#87938e]">
              {description}
            </p>

          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        {children}
      </div>
    </motion.section>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-[#edf1ef] py-5 last:border-b-0 last:pb-5">

      <div className="min-w-0">

        <div className="flex items-center gap-2">

          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
              checked
                ? "bg-[#2fa084]"
                : "bg-[#b7c2bd]"
            }`}
          />

          <h3 className="text-sm font-bold text-[#17211e]">
            {title}
          </h3>

        </div>

        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#7d8c86]">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`group relative h-7 w-12 shrink-0 rounded-full p-0.5 outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#2fa084]/15 ${
          checked
            ? "bg-[#2fa084] shadow-[0_3px_10px_rgba(47,160,132,0.18)]"
            : "bg-[#cbd5d0]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(23,33,30,0.16)] transition-all duration-200 ${
            checked
              ? "left-[23px]"
              : "left-0.5"
          }`}
        />

        <span
          className={`pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset transition ${
            checked
              ? "ring-white/10"
              : "ring-black/5"
          }`}
        />
      </button>
    </div>
  );
}