import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  UserRound,
  Settings,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function TopNavbar({
  onMenuClick,
}) {
  const navigate = useNavigate();

  const {
    user,
    token,
    logout,
  } = useAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [materials, setMaterials] =
    useState([]);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const searchContainerRef =
    useRef(null);

  const displayName =
    user?.name || "User";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileImageUrl = user?.profile_image
    ? `${API_BASE_URL}${user.profile_image}`
    : null;

  // --------------------------------------------------
  // Load materials for global search
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const fetchMaterials = async () => {
      if (!token) {
        if (isMounted) {
          setMaterials([]);
        }

        return;
      }

      try {
        setSearchLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/materials/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Materials request failed with status ${response.status}`
          );
        }

        const data = await response.json();

        if (isMounted) {
          setMaterials(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          "Unable to load materials for search:",
          error
        );

        if (isMounted) {
          setMaterials([]);
        }
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    };

    fetchMaterials();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // --------------------------------------------------
  // Search results
  // --------------------------------------------------

  const normalizedQuery =
    searchQuery.trim().toLowerCase();

  const searchResults =
    normalizedQuery.length === 0
      ? []
      : materials
          .filter((material) => {
            const title = String(
              material?.title ||
                material?.filename ||
                material?.name ||
                ""
            ).toLowerCase();

            const type = String(
              material?.type || ""
            ).toLowerCase();

            return (
              title.includes(normalizedQuery) ||
              type.includes(normalizedQuery)
            );
          })
          .slice(0, 8);

  // --------------------------------------------------
  // Close search when clicking outside
  // --------------------------------------------------

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          event.target
        )
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // --------------------------------------------------
  // Search keyboard handling
  // --------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }

      if (
        event.key === "/" &&
        document.activeElement?.tagName !==
          "INPUT" &&
        document.activeElement?.tagName !==
          "TEXTAREA"
      ) {
        event.preventDefault();

        const input =
          searchContainerRef.current?.querySelector(
            "input"
          );

        input?.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  const handleMenuClick = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);

    onMenuClick?.();
  };

  const handleNotificationClick = () => {
    setNotificationsOpen(
      (previous) => !previous
    );

    setProfileOpen(false);
    setSearchOpen(false);
  };

  const handleProfile = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);

    navigate("/profile");
  };

  const handleSettings = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);

    navigate("/settings");
  };

  const handleLogout = () => {
    logout();

    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchQuery(value);
    setSearchOpen(
      value.trim().length > 0
    );

    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setSearchOpen(true);
    }
  };

  const handleMaterialSelect = (
    material
  ) => {
    if (!material?.id) {
      return;
    }

    setSearchOpen(false);
    setSearchQuery("");

    navigate(
      `/library/${material.id}`
    );
  };

  const getMaterialTitle = (
    material
  ) => {
    return (
      material?.title ||
      material?.filename ||
      material?.name ||
      "Untitled material"
    );
  };

  const getMaterialType = (
    material
  ) => {
    const type = String(
      material?.type || "FILE"
    ).toUpperCase();

    return type;
  };

  const getMaterialIconLabel = (
    material
  ) => {
    const type =
      getMaterialType(material);

    if (type === "PDF") {
      return "PDF";
    }

    if (
      type === "PPT" ||
      type === "PPTX"
    ) {
      return "PPT";
    }

    if (
      type === "DOC" ||
      type === "DOCX"
    ) {
      return "DOC";
    }

    if (type === "TXT") {
      return "TXT";
    }

    return "FILE";
  };

  return (
    <header className="relative z-40 flex h-[76px] shrink-0 items-center border-b border-[#e4ebe8] bg-white/95 px-4 backdrop-blur-xl sm:px-6">
      {/* ================================================== */}
      {/* Left Section */}
      {/* ================================================== */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {/* Menu */}

        <button
          type="button"
          onClick={handleMenuClick}
          className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#53635d] transition-all duration-200 hover:bg-[#f2f7f5] hover:text-[#1f6f5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/40"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu
            size={21}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:scale-105"
          />
        </button>

        {/* Page Title */}

        <div className="hidden min-w-0 sm:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a39d]">
            Workspace
          </p>

          <h2 className="truncate text-[17px] font-bold tracking-[-0.01em] text-[#176b5b]">
            Dashboard
          </h2>
        </div>
      </div>

      {/* ================================================== */}
      {/* Search */}
      {/* ================================================== */}

      <div className="mx-3 flex min-w-0 flex-1 justify-center sm:mx-auto sm:px-6">
        <div
          ref={searchContainerRef}
          className="relative w-full max-w-[560px]"
        >
          <Search
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8b9994]"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder="Search topics, notes, quizzes..."
            aria-label="Search EduMind"
            aria-expanded={searchOpen}
            aria-haspopup="listbox"
            className="h-11 w-full rounded-xl border border-[#e1e9e5] bg-[#f7faf9] pl-11 pr-16 text-sm font-medium text-[#17211e] outline-none transition-all duration-200 placeholder:text-[#9aa7a2] hover:border-[#cddbd5] hover:bg-white focus:border-[#6fcf97] focus:bg-white focus:ring-4 focus:ring-[#6fcf97]/10"
          />

          {/* Keyboard Hint */}

          {!searchQuery && (
            <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
              <kbd className="rounded-md border border-[#dce5e1] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#899690] shadow-sm">
                /
              </kbd>
            </div>
          )}

          {/* Search Results */}

          {searchOpen && (
            <div
              className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-[#dfe8e4] bg-white shadow-[0_18px_50px_rgba(23,33,30,0.14)]"
              role="listbox"
              aria-label="Search results"
            >
              {searchLoading ? (
                <div className="px-4 py-6 text-center">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-[#dceee6] border-t-[#2fa084]" />

                  <p className="mt-2 text-xs font-medium text-[#7b8984]">
                    Searching your library...
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[360px] overflow-y-auto p-2">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a39d]">
                      Library results
                    </p>
                  </div>

                  {searchResults.map(
                    (material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() =>
                          handleMaterialSelect(
                            material
                          )
                        }
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 hover:bg-[#f2f8f5]"
                        role="option"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f6f0] text-[9px] font-bold text-[#1f6f5f]">
                          {getMaterialIconLabel(
                            material
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#25322e] group-hover:text-[#176b5b]">
                            {getMaterialTitle(
                              material
                            )}
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[#94a39d]">
                            {getMaterialType(
                              material
                            )}
                          </p>
                        </div>

                        <span className="shrink-0 text-[#a2aea9] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#2fa084]">
                          →
                        </span>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div className="px-4 py-7 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f7f5] text-[#8b9994]">
                    <Search
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#53635d]">
                    No matching materials found
                  </p>

                  <p className="mx-auto mt-1 max-w-[260px] text-xs leading-5 text-[#8a9892]">
                    Try searching for the name or type of a material in your Learning Library.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* Right Section */}
      {/* ================================================== */}

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* ================================================== */}
        {/* Notifications */}
        {/* ================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/40 ${
              notificationsOpen
                ? "bg-[#e8f6f0] text-[#1f6f5f]"
                : "text-[#53635d] hover:bg-[#f2f7f5] hover:text-[#1f6f5f]"
            }`}
            aria-label="Notifications"
            aria-expanded={
              notificationsOpen
            }
            aria-haspopup="dialog"
            title="Notifications"
          >
            <Bell
              size={20}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:scale-105"
            />
          </button>

          {/* Notification Panel */}

          {notificationsOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-3 w-[320px] overflow-hidden rounded-2xl border border-[#dfe8e4] bg-white shadow-[0_18px_50px_rgba(23,33,30,0.12)]"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-[#edf1ef] px-4 py-3.5">
                <div>
                  <p className="text-sm font-bold text-[#17211e]">
                    Notifications
                  </p>

                  <p className="mt-0.5 text-[11px] font-medium text-[#8a9892]">
                    Stay updated with your learning activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotificationsOpen(
                      false
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#82908a] transition-colors hover:bg-[#f2f7f5] hover:text-[#1f6f5f]"
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-4 py-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f6f0] text-[#2fa084]">
                  <Bell
                    size={19}
                    strokeWidth={2}
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#53635d]">
                  You're all caught up
                </p>

                <p className="mx-auto mt-1 max-w-[230px] text-xs leading-5 text-[#8a9892]">
                  New learning reminders and updates will appear here when
                  notification support is connected.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}

        <div className="mx-1 hidden h-7 w-px bg-[#e8eeeb] sm:block" />

        {/* ================================================== */}
        {/* Profile Menu */}
        {/* ================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(
                (previous) => !previous
              );

              setNotificationsOpen(false);
              setSearchOpen(false);
            }}
            className="group flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-all duration-200 hover:bg-[#f2f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6fcf97]/40 sm:gap-3 sm:px-2"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {/* Avatar */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#cdeee1] bg-[#e5f5ee] text-[#1f6f5f] shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${displayName}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold tracking-wide">
                  {initials}
                </span>
              )}
            </div>

            {/* User Info */}

            <div className="hidden max-w-[140px] text-left lg:block">
              <p className="truncate text-sm font-semibold text-[#25322e]">
                {displayName}
              </p>

              <p className="truncate text-[11px] font-medium text-[#8a9892]">
                Account
              </p>
            </div>

            {/* Chevron */}

            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`hidden text-[#82908a] transition-transform duration-200 sm:block ${
                profileOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* ================================================== */}
          {/* Profile Dropdown */}
          {/* ================================================== */}

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-3 w-[280px] overflow-hidden rounded-2xl border border-[#dfe8e4] bg-white shadow-[0_18px_50px_rgba(23,33,30,0.12)]"
              role="menu"
            >
              {/* Account Header */}

              <div className="bg-gradient-to-br from-[#f3faf7] to-white px-4 pb-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#e5f5ee] text-[#1f6f5f] shadow-md">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={`${displayName}'s profile`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {initials}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#17211e]">
                      {displayName}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-[#7b8984]">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}

              <div className="border-t border-[#edf1ef] p-2">
                <button
                  type="button"
                  onClick={handleProfile}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#53635d] transition-colors duration-150 hover:bg-[#f2f7f5] hover:text-[#1f6f5f]"
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f8f6] text-[#71817b] transition-colors group-hover:bg-[#e5f5ee] group-hover:text-[#2fa084]">
                    <UserRound size={16} />
                  </span>

                  <span className="flex-1 text-left">
                    My Profile
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSettings}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#53635d] transition-colors duration-150 hover:bg-[#f2f7f5] hover:text-[#1f6f5f]"
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f8f6] text-[#71817b] transition-colors group-hover:bg-[#e5f5ee] group-hover:text-[#2fa084]">
                    <Settings size={16} />
                  </span>

                  <span className="flex-1 text-left">
                    Settings
                  </span>
                </button>
              </div>

              {/* Logout */}

              <div className="border-t border-[#edf1ef] p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#c94b4b] transition-colors duration-150 hover:bg-[#fff3f3]"
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff5f5] text-[#c94b4b] transition-colors group-hover:bg-[#ffe9e9]">
                    <LogOut size={16} />
                  </span>

                  <span className="flex-1 text-left">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}