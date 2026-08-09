import {
  NavLink,
} from "react-router-dom";

import {
  Clock,
  Info,
  Languages,
  Menu,
  Palette,
} from "lucide-react";

import {
  useAdminI18n,
} from "../lib/adminI18n";


export default function ProjectTabs({
  projectId,
}) {
  const {
    t,
    dir,
  } = useAdminI18n();


  const tabs = [
    {
      to:
        `/project/${projectId}/general`,

      label:
        t(
          "projectTabs.general"
        ),

      icon: (
        <Info
          size={16}
        />
      ),
    },

    {
      to:
        `/project/${projectId}/menu`,

      label:
        t(
          "projectTabs.menu"
        ),

      icon: (
        <Menu
          size={16}
        />
      ),
    },

    {
      to:
        `/project/${projectId}/appearance`,

      label:
        t(
          "projectTabs.appearance"
        ),

      icon: (
        <Palette
          size={16}
        />
      ),
    },

    {
      to:
        `/project/${projectId}/hours`,

      label:
        t(
          "projectTabs.hours"
        ),

      icon: (
        <Clock
          size={16}
        />
      ),
    },

    {
      to:
        `/project/${projectId}/languages`,

      label:
        t(
          "projectTabs.languages"
        ),

      icon: (
        <Languages
          size={16}
        />
      ),
    },
  ];


  return (
    <div
      dir={dir}
      className="border-b border-white/10 bg-[#0c0c0c]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="overflow-x-auto py-3">
          <div className="flex px-2 w-max min-w-full flex-nowrap gap-2">
            {tabs.map(
              (
                tab
              ) => (
                <NavLink
                  key={
                    tab.to
                  }
                  to={
                    tab.to
                  }
                  className={({
                    isActive,
                  }) =>
                    `inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 text-sm font-black transition ${
                      isActive
                        ? "bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/10"
                        : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white"
                    }`
                  }
                >
                  {
                    tab.icon
                  }

                  <span>
                    {
                      tab.label
                    }
                  </span>
                </NavLink>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}