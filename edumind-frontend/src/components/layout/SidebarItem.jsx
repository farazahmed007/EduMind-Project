import { NavLink } from "react-router-dom";

export default function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        group mx-3 flex items-center gap-3 rounded-xl px-4 py-3
        text-sm font-medium transition-all duration-200
        ${
          isActive
            ? "bg-[#2FA084] text-white shadow-sm"
            : "text-[#1F6F5F] hover:bg-[#6FCF97]/20 hover:text-[#1F6F5F]"
        }
        `
      }
    >
      <Icon
        size={20}
        strokeWidth={2}
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      />

      <span>{label}</span>
    </NavLink>
  );
}