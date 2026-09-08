import { useState } from "react";
import { Bell, Menu, Search, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name || "User";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-[76px] items-center border-b border-gray-200 bg-white px-6">
      
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl
          text-[#1F6F5F] transition hover:bg-[#6FCF97]/20"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <h2 className="text-lg font-semibold text-[#1F6F5F]">
          Dashboard
        </h2>
      </div>

      {/* Search */}
      <div className="mx-auto w-full max-w-[520px]">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search topics, notes, quizzes..."
            className="h-11 w-full rounded-full border border-gray-200
            bg-[#EEEEEE]/40 pl-11 pr-4 text-sm text-gray-700
            outline-none transition
            placeholder:text-gray-400
            focus:border-[#2FA084]
            focus:ring-2 focus:ring-[#6FCF97]/30"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button
          className="relative flex h-10 w-10 items-center justify-center
          rounded-xl text-[#1F6F5F]
          transition hover:bg-[#6FCF97]/20"
          aria-label="Notifications"
        >
          <Bell size={21} />

          {/* Notification Badge */}
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4
            items-center justify-center rounded-full
            bg-[#2FA084] px-1 text-[10px] font-bold text-white"
          >
            3
          </span>
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((previous) => !previous)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5
            transition hover:bg-[#6FCF97]/20"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {/* Avatar */}
            <div
              className="flex h-10 w-10 items-center justify-center
              rounded-full bg-[#6FCF97]/30 text-[#1F6F5F]"
            >
              <span className="text-sm font-bold">
                {initials}
              </span>
            </div>

            {/* User Info */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {displayName}
              </p>

              <p className="text-xs text-gray-500">
                MCA Student
              </p>
            </div>

            <ChevronDown
              size={17}
              className={`text-gray-500 transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56
              overflow-hidden rounded-xl border border-gray-200
              bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {user?.email || ""}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg
                  px-3 py-2.5 text-sm font-medium text-red-600
                  transition hover:bg-red-50"
                  role="menuitem"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}