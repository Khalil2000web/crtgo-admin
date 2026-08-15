import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  Building2,
  Clock,
  Info,
  Languages,
  Menu,
  Palette,
  UtensilsCrossed,
} from "lucide-react";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";


const COPY = {
  en: {
    back:
      "Business workspace",

    service:
      "Menu service",

    business:
      "Business",
  },

  ar: {
    back:
      "مساحة عمل النشاط",

    service:
      "خدمة القائمة",

    business:
      "النشاط",
  },
};


async function loadProjectContext(
  projectId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "projects"
      )
      .select(`
        id,
        name,
        workspace_id,
        workspaces (
          id,
          name
        )
      `)
      .eq(
        "id",
        projectId
      )
      .single();


  if (
    error
  ) {
    throw error;
  }


  return data;
}


export default function ProjectTabs({
  projectId,
}) {
  const {
    t,
    dir,
  } =
    useAdminI18n();


  const copy =
    dir ===
    "rtl"
      ? COPY.ar
      : COPY.en;


  const {
    data:
      projectContext,

    isLoading,
  } =
    useQuery({
      queryKey: [
        "project-context",
        projectId,
      ],

      queryFn:
        () =>
          loadProjectContext(
            projectId
          ),

      enabled:
        Boolean(
          projectId
        ),
    });


  const workspace =
    projectContext?.workspaces ||
    null;


  const workspaceId =
    projectContext?.workspace_id ||
    workspace?.id ||
    null;


  const backUrl =
    workspaceId
      ? `/workspace/${workspaceId}`
      : "/";


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

        {/* SERVICE CONTEXT */}

        <div className="flex min-w-0 items-center gap-3 border-b border-white/[0.07] py-3">
          <Link
            to={backUrl}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-2 text-xs font-black text-white/40 transition hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft
              size={15}
              className={
                dir ===
                "rtl"
                  ? "rotate-180"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              {
                copy.back
              }
            </span>
          </Link>


          <div className="h-5 w-px shrink-0 bg-white/10" />


          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-white/40">
              <Building2
                size={14}
              />
            </div>


            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
                {
                  copy.business
                }
              </p>

              {isLoading ? (
                <div className="mt-1 h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              ) : (
                <p className="truncate text-xs font-black text-white/55">
                  {workspace?.name ||
                    projectContext?.name ||
                    "CRTRGO"}
                </p>
              )}
            </div>
          </div>


          <div className="mx-1 h-5 w-px shrink-0 bg-white/10" />


          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff8d22]">
              <UtensilsCrossed
                size={14}
              />
            </div>


            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#ff7a00]/60">
                CRTRGO
              </p>

              <p className="truncate text-xs font-black text-[#ff9a3b]">
                {
                  copy.service
                }
              </p>
            </div>
          </div>
        </div>


        {/* MENU SERVICE TABS */}

        <div className="overflow-x-auto py-3">
          <div className="flex w-max min-w-full flex-nowrap gap-2 px-2">
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