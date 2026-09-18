import { NavLink } from "react-router-dom";


export default function SidebarItem({
  to,
  icon: Icon,
  label,
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        group relative mx-1 flex items-center gap-3
        rounded-xl px-3.5 py-2.5
        text-sm font-medium
        transition-all duration-200 ease-out
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#6FCF97]/40
        ${
          isActive
            ? `
              bg-[#E8F6F0]
              text-[#176B5B]
              shadow-[inset_0_0_0_1px_rgba(47,160,132,0.08)]
            `
            : `
              text-[#53635D]
              hover:bg-[#F4F8F6]
              hover:text-[#1F6F5F]
            `
        }
        `
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}

          <span
            className={`
              absolute left-0 top-1/2
              h-5 -translate-y-1/2
              rounded-r-full
              bg-[#2FA084]
              transition-all duration-200
              ${
                isActive
                  ? "w-1 opacity-100"
                  : "w-0 opacity-0"
              }
            `}
          />


          {/* Icon */}

          <span
            className={`
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-lg
              transition-all duration-200
              ${
                isActive
                  ? "bg-white text-[#2FA084] shadow-sm"
                  : "bg-transparent text-[#71817B] group-hover:bg-white group-hover:text-[#2FA084] group-hover:shadow-sm"
              }
            `}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.2 : 2}
              className="transition-transform duration-200 group-hover:scale-[1.04]"
            />
          </span>


          {/* Label */}

          <span
            className={`
              min-w-0 flex-1 truncate
              transition-colors duration-200
              ${
                isActive
                  ? "font-semibold"
                  : "font-medium"
              }
            `}
          >
            {label}
          </span>


          {/* Active status dot */}

          <span
            className={`
              h-1.5 w-1.5 shrink-0
              rounded-full
              bg-[#2FA084]
              transition-all duration-200
              ${
                isActive
                  ? "scale-100 opacity-100"
                  : "scale-0 opacity-0"
              }
            `}
          />
        </>
      )}
    </NavLink>
  );
}