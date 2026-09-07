import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  Crown,
  CreditCard,
  HelpCircle,
  Image,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";


export default function AppShell() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    dir,
    t,
  } =
    useAdminI18n();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    workspaceOwnerId,
    setWorkspaceOwnerId,
  ] =
    useState(null);


const directWorkspaceId =
  useMemo(() => {
    const match =
      location.pathname.match(
        /^\/workspace\/([^/]+)/
      );

    return (
      match?.[1] ||
      null
    );
  }, [
    location.pathname,
  ]);


const projectId =
  useMemo(() => {
    const match =
      location.pathname.match(
        /^\/project\/([^/]+)/
      );

    return (
      match?.[1] ||
      null
    );
  }, [
    location.pathname,
  ]);


const [
  workspaceId,
  setWorkspaceId,
] =
  useState(
    directWorkspaceId
  );


  const canManageWorkspace =
    Boolean(
      workspaceId &&
      user?.id &&
      workspaceOwnerId ===
        user.id
    );


  useEffect(() => {
    let alive =
      true;


    async function loadUser() {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();


      if (
        !alive
      ) {
        return;
      }


      if (
        error ||
        !data.user
      ) {
        setUser(
          null
        );

        return;
      }


      setUser(
        data.user
      );
    }


    loadUser();


    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (
            !alive
          ) {
            return;
          }


          setUser(
            session?.user ||
              null
          );
        }
      );


    return () => {
      alive =
        false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let alive =
      true;


    async function loadWorkspaceOwner() {
      if (
        !workspaceId
      ) {
        setWorkspaceOwnerId(
          null
        );

        return;
      }


      const {
        data,
        error,
      } =
        await supabase
          .from(
            "workspaces"
          )
          .select(
            "owner_id"
          )
          .eq(
            "id",
            workspaceId
          )
          .maybeSingle();


      if (
        !alive
      ) {
        return;
      }


      if (
        error ||
        !data
      ) {
        setWorkspaceOwnerId(
          null
        );

        return;
      }


      setWorkspaceOwnerId(
        data.owner_id
      );
    }


    loadWorkspaceOwner();


    return () => {
      alive =
        false;
    };
  }, [
    workspaceId,
  ]);


  useEffect(() => {
    setMobileOpen(
      false
    );
  }, [
    location.pathname,
  ]);


  useEffect(() => {
    if (
      !mobileOpen
    ) {
      return;
    }


    const previousOverflow =
      document.body
        .style
        .overflow;


    document.body.style.overflow =
      "hidden";


    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    mobileOpen,
  ]);


  async function logout() {
    try {
      const {
        error,
      } =
        await supabase.auth.signOut();


      if (
        error
      ) {
        throw error;
      }


      toast.success(
        t(
          "auth.loggedOut"
        )
      );


      navigate(
        "/login",
        {
          replace:
            true,
        }
      );
    } catch (
      error
    ) {
      toast.error(
        error?.message ||
          t(
            "auth.logoutFailed"
          )
      );
    }
  }


  return (
    <main
      dir="ltr"
      className="flex h-dvh min-h-0 overflow-hidden bg-[#090909] text-white"
    >
      {/* DESKTOP SIDEBAR */}

      <aside className="hidden h-full min-h-0 w-[18rem] shrink-0 overflow-y-auto overflow-x-hidden border-e border-white/10 bg-[#0b0b0b] p-4 lg:block">
        <div className="flex min-h-max flex-col">
          <SidebarContent
            user={
              user
            }
            logout={
              logout
            }
            workspaceId={
              workspaceId
            }
            canManageWorkspace={
              canManageWorkspace
            }
          />
        </div>
      </aside>


      {/* MOBILE SIDEBAR */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[900] overflow-hidden bg-black/70 backdrop-blur-md lg:hidden"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setMobileOpen(
                false
              );
            }
          }}
        >
          <aside
            className={`flex h-full w-80 max-w-[88vw] flex-col overflow-y-auto bg-[#0b0b0b] p-4 no-scrollbar ${
              dir ===
              "rtl"
                ? "ms-auto border-s border-white/10"
                : "me-auto border-e border-white/10"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <Brand />

              <button
                type="button"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                aria-label={
                  t(
                    "common.close"
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </div>


            <SidebarContent
              user={
                user
              }
              logout={
                logout
              }
              hideBrand
              workspaceId={
                workspaceId
              }
              canManageWorkspace={
                canManageWorkspace
              }
            />
          </aside>
        </div>
      )}


      {/* MAIN CONTENT */}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* MOBILE HEADER */}

        <header className="flex h-16 w-full shrink-0 items-center gap-3 border-b border-white/10 bg-[#080808]/85 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                true
              )
            }
            aria-label="Menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <Menu
              size={
                19
              }
            />
          </button>


          <Brand
            small
          />


          <div className="ms-auto flex items-center gap-2">
            <AdminLanguageSwitcher />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-black text-black">
              {getUserInitial(
                user
              )}
            </div>
          </div>
        </header>


        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </section>
    </main>
  );
}


function SidebarContent({
  user,
  logout,
  hideBrand =
    false,
  workspaceId,
  canManageWorkspace,
}) {
  const {
    language,
    t,
  } =
    useAdminI18n();


  const displayName =
    user?.user_metadata
      ?.display_name ||
    user?.email?.split(
      "@"
    )[0] ||
    "CRTRGO";


  const workspaceCopy =
    language ===
    "ar"
      ? {
          title:
            "مساحة العمل",

          overview:
            "نظرة عامة",

          ownerControls:
            "إعدادات المالك",

          members:
            "الأعضاء",

          ownership:
            "الملكية",

          assets:
            "ملفات الخدمات",

          billing:
            "نقل الفوترة",
        }
      : {
          title:
            "Workspace",

          overview:
            "Overview",

          ownerControls:
            "Owner controls",

          members:
            "Members",

          ownership:
            "Ownership",

          assets:
            "Service assets",

          billing:
            "Billing handoff",
        };


  return (
    <>
      {!hideBrand && (
        <Brand />
      )}


      {/* ACCOUNT */}

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff7a00] text-sm font-black text-black">
            {getUserInitial(
              user
            )}
          </div>


          <div className="min-w-0">
            <p className="truncate text-sm font-black">
              {
                displayName
              }
            </p>

            <p
              className="truncate text-xs font-bold text-white/35"
              dir="ltr"
            >
              {user?.email ||
                t(
                  "common.loading"
                )}
            </p>
          </div>
        </div>
      </div>


      {/* LANGUAGE */}

      <div className="mt-3">
        <AdminLanguageSwitcher
          expanded
        />
      </div>


      {/* MAIN NAVIGATION */}

      <nav className="mt-6 grid gap-2">
        <SideLink
          to="/"
          icon={
            <Building2
              size={
                18
              }
            />
          }
          label={
            t(
              "nav.websites"
            )
          }
        />


        <SideLink
          to="/account"
          icon={
            <UserCircle2
              size={
                18
              }
            />
          }
          label={
            t(
              "nav.account"
            )
          }
        />
      </nav>


      {/* WORKSPACE NAVIGATION */}

      {workspaceId && (
        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
              {
                workspaceCopy.title
              }
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a00]" />
          </div>


          <nav className="grid gap-1">
            <WorkspaceSideLink
              to={`/workspace/${workspaceId}`}
              end
              icon={
                <LayoutDashboard
                  size={
                    16
                  }
                />
              }
              label={
                workspaceCopy.overview
              }
            />
          </nav>


          {canManageWorkspace && (
            <>
              <div className="mb-2 mt-5 flex items-center gap-2 px-3">
                <ShieldCheck
                  size={
                    12
                  }
                  className="text-[#ff7a00]"
                />

                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/22">
                  {
                    workspaceCopy.ownerControls
                  }
                </span>
              </div>


              <nav className="grid gap-1">
                <WorkspaceSideLink
                  to={`/workspace/${workspaceId}/members`}
                  icon={
                    <Users
                      size={
                        16
                      }
                    />
                  }
                  label={
                    workspaceCopy.members
                  }
                />


                <WorkspaceSideLink
                  to={`/workspace/${workspaceId}/ownership`}
                  icon={
                    <Crown
                      size={
                        16
                      }
                    />
                  }
                  label={
                    workspaceCopy.ownership
                  }
                />


                <WorkspaceSideLink
                  to={`/workspace/${workspaceId}/asset-handoff`}
                  icon={
                    <Image
                      size={
                        16
                      }
                    />
                  }
                  label={
                    workspaceCopy.assets
                  }
                />


                <WorkspaceSideLink
                  to={`/workspace/${workspaceId}/billing-handoff`}
                  icon={
                    <CreditCard
                      size={
                        16
                      }
                    />
                  }
                  label={
                    workspaceCopy.billing
                  }
                />
              </nav>
            </>
          )}
        </div>
      )}


      {/* SECONDARY */}

      <nav className="mt-7 grid gap-2">
        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/38 transition hover:bg-white/[0.045] hover:text-white"
        >
          <Settings
            size={
              18
            }
          />

          <span>
            {t(
              "nav.settings"
            )}
          </span>
        </button>


        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/38 transition hover:bg-white/[0.045] hover:text-white"
        >
          <HelpCircle
            size={
              18
            }
          />

          <span>
            {t(
              "nav.help"
            )}
          </span>
        </button>
      </nav>


      {/* LOGOUT */}

      <div className="mt-auto grid gap-2 pb-5 pt-12">
        <button
          type="button"
          onClick={
            logout
          }
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400/80 transition hover:bg-red-400/[0.099] hover:text-red-300"
        >
          <LogOut
            size={
              18
            }
          />

          <span>
            {t(
              "nav.logout"
            )}
          </span>
        </button>
      </div>
    </>
  );
}


function Brand({
  small =
    false,
}) {
  const {
    t,
  } =
    useAdminI18n();


  return (
    <Link
      to="/"
      className="block min-w-0"
    >
      <h1
        className={`font-black tracking-[-0.04em] ${
          small
            ? "text-2xl"
            : "text-4xl"
        }`}
      >
        CRTRGO
      </h1>


      {!small && (
        <p className="mt-1 text-xs font-black uppercase tracking-[0.28em] text-white/30">
          {t(
            "brand.admin"
          )}
        </p>
      )}
    </Link>
  );
}


function SideLink({
  to,
  icon,
  label,
}) {
  return (
    <NavLink
      to={
        to
      }
      end={
        to ===
        "/"
      }
      className={({
        isActive,
      }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
          isActive
            ? "bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/10"
            : "text-white/45 hover:bg-white/[0.045] hover:text-white"
        }`
      }
    >
      {
        icon
      }

      <span>
        {
          label
        }
      </span>
    </NavLink>
  );
}


function WorkspaceSideLink({
  to,
  icon,
  label,
  end =
    false,
}) {
  return (
    <NavLink
      to={
        to
      }
      end={
        end
      }
      className={({
        isActive,
      }) =>
        `flex min-h-10 items-center gap-3 border-s-2 px-3 text-xs transition ${
          isActive
            ? "border-[#ff7a00] bg-[#ff7a00]/[0.06] text-white"
            : "border-transparent text-white/38 hover:border-white/10 hover:bg-white/[0.025] hover:text-white"
        }`
      }
    >
      <span className="text-[#ff7a00]">
        {
          icon
        }
      </span>

      <span>
        {
          label
        }
      </span>
    </NavLink>
  );
}


function AdminLanguageSwitcher({
  expanded =
    false,
}) {
  const {
    language,
    setLanguage,
    t,
  } =
    useAdminI18n();


  const languages = [
    {
      code:
        "en",

      short:
        "EN",

      name:
        "English",
    },

    {
      code:
        "ar",

      short:
        "AR",

      name:
        "العربية",
    },
  ];


  return (
    <div
      className={`flex items-center rounded-2xl border border-white/10 bg-white/[0.035] p-1 ${
        expanded
          ? "w-full gap-1"
          : "gap-0.5"
      }`}
    >
      {expanded && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-white/35">
          <Languages
            size={
              16
            }
          />
        </div>
      )}


      {languages.map(
        (
          item
        ) => {
          const active =
            item.code ===
            language;


          return (
            <button
              key={
                item.code
              }
              type="button"
              title={`${t(
                "header.language"
              )}: ${
                item.name
              }`}
              onClick={() =>
                setLanguage(
                  item.code
                )
              }
              className={`min-h-8 rounded-xl px-3 text-xs font-black transition ${
                expanded
                  ? "flex-1"
                  : ""
              } ${
                active
                  ? "bg-[#ff7a00] text-black"
                  : "text-white/45 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {expanded
                ? item.name
                : item.short}
            </button>
          );
        }
      )}
    </div>
  );
}


function getUserInitial(
  user
) {
  const value =
    user?.user_metadata
      ?.display_name ||
    user?.email ||
    "C";


  return String(
    value
  )
    .trim()
    .charAt(
      0
    )
    .toUpperCase();
}