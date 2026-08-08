import { NavLink } from "react-router-dom";
import {
  Clock,
  Info,
  Menu,
  Palette,
} from "lucide-react";

export default function ProjectTabs({
  projectId,
}) {
  const tabs = [
    {
      to: `/project/${projectId}/general`,
      label: "General",
      icon: <Info size={16} />,
    },
    {
      to: `/project/${projectId}/menu`,
      label: "Menu",
      icon: <Menu size={16} />,
    },
    {
      to: `/project/${projectId}/appearance`,
      label: "Appearance",
      icon: <Palette size={16} />,
    },
    {
      to: `/project/${projectId}/hours`,
      label: "Working Hours",
      icon: <Clock size={16} />,
    },
  ];

  return (
    <div className="overflow-x-auto border-b border-white/10 px-4 py-6 sm:px-6">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition ${
                isActive
                  ? "bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/10"
                  : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white"
              }`
            }
          >
            {tab.icon}
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}