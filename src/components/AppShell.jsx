import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  ChevronRight,
  CircleHelp,
  Globe2,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  UserCircle2,
  UtensilsCrossed,
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


const SHELL_COPY = {
  en: {
    workspace:
      "Workspace",

    platform:
      "Carter Go",

    overview:
      "Businesses",

    services:
      "Services",

    menu:
      "Menu",

    store:
      "Store",

    websites:
      "Websites",

    active:
      "Active",

    comingSoon:
      "Soon",

    account:
      "Account",

    settings:
      "Settings",

    help:
      "Help",

    logout:
      "Log out",

    currentService:
      "Current service",

    menuWorkspace:
      "Menu workspace",

    backToBusinesses:
      "All businesses",

    accountArea:
      "Account",

    platformHint:
      "One account. All your services.",

    loading:
      "Loading...",
  },


  ar: {
    workspace:
      "مساحة العمل",

    platform:
      "Carter Go",

    overview:
      "الأعمال",

    services:
      "الخدمات",

    menu:
      "القائمة",

    store:
      "المتجر",

    websites:
      "المواقع",

    active:
      "فعال",

    comingSoon:
      "قريباً",

    account:
      "الحساب",

    settings:
      "الإعدادات",

    help:
      "المساعدة",

    logout:
      "تسجيل الخروج",

    currentService:
      "الخدمة الحالية",

    menuWorkspace:
      "مساحة القائمة",

    backToBusinesses:
      "كل الأعمال",

    accountArea:
      "الحساب",

    platformHint:
      "حساب واحد. كل خدماتك.",

    loading:
      "جارٍ التحميل...",
  },
};


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


  const copy =
    dir ===
    "rtl"
      ? SHELL_COPY.ar
      : SHELL_COPY.en;


  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(
      false
    );


  const [
    user,
    setUser,
  ] =
    useState(
      null
    );


  const insideMenuService =
    location.pathname.startsWith(
      "/project/"
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
      document.body.style
        .overflow;


    document.body.style
      .overflow =
      "hidden";


    return () => {
      document.body.style
        .overflow =
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

      <aside className="hidden h-full w-[18.5rem] shrink-0 border-e border-white/10 bg-[#0b0b0b] lg:flex lg:flex-col">
        <SidebarContent
          user={
            user
          }
          logout={
            logout
          }
          copy={
            copy
          }
          dir={
            dir
          }
          insideMenuService={
            insideMenuService
          }
        />
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
            className={`flex h-full w-80 max-w-[88vw] flex-col overflow-y-auto bg-[#0b0b0b] no-scrollbar ${
              dir ===
              "rtl"
                ? "ms-auto border-s border-white/10"
                : "me-auto border-e border-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <Brand
                compact
              />


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
              copy={
                copy
              }
              dir={
                dir
              }
              insideMenuService={
                insideMenuService
              }
              hideBrand
            />
          </aside>
        </div>
      )}


      {/* MAIN CONTENT */}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* MOBILE HEADER */}

        <header className="flex h-16 w-full shrink-0 items-center gap-3 border-b border-white/10 bg-[#080808]/90 px-4 backdrop-blur-xl lg:hidden">
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
            compact
          />


          <div className="ms-auto flex items-center gap-2">
            <AdminLanguageSwitcher />


            <Link
              to="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-black text-black"
            >
              {getUserInitial(
                user
              )}
            </Link>
          </div>
        </header>


        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </section>
    </main>
  );
}


function SidebarContent({
  user,
  logout,
  copy,
  dir,
  insideMenuService,
  hideBrand = false,
}) {
  const displayName =
    user?.user_metadata
      ?.display_name ||
    user?.email?.split(
      "@"
    )[0] ||
    "Carter Go";


  return (
    <div
      dir={
        dir
      }
      className="flex h-full min-h-0 flex-col p-4"
    >
      {!hideBrand && (
        <Brand />
      )}


      {/* USER */}

      <Link
        to="/account"
        className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.035] p-3 transition hover:border-[#ff7a00]/25 hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff7a00] text-sm font-black text-black">
            {getUserInitial(
              user
            )}
          </div>


          <div className="min-w-0 flex-1">
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
                copy.loading}
            </p>
          </div>


          <ChevronRight
            size={
              15
            }
            className={`shrink-0 text-white/20 ${
              dir ===
              "rtl"
                ? "rotate-180"
                : ""
            }`}
          />
        </div>
      </Link>


      {/* LANGUAGE */}

      <div className="mt-3">
        <AdminLanguageSwitcher
          expanded
        />
      </div>


      {/* PLATFORM NAVIGATION */}

      <div className="mt-7">
        <SidebarLabel>
          {
            copy.workspace
          }
        </SidebarLabel>


        <nav className="mt-2 grid gap-1.5">
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
              copy.overview
            }
          />
        </nav>
      </div>


      {/* SERVICES */}

      <div className="mt-7">
        <SidebarLabel>
          {
            copy.services
          }
        </SidebarLabel>


        <div className="mt-2 grid gap-1.5">

          {/* MENU */}

          <ServiceNavItem
            icon={
              <UtensilsCrossed
                size={
                  18
                }
              />
            }
            label={
              copy.menu
            }
            status={
              copy.active
            }
            active={
              insideMenuService
            }
            available
          />


          {/* STORE */}

          <ServiceNavItem
            icon={
              <ShoppingBag
                size={
                  18
                }
              />
            }
            label={
              copy.store
            }
            status={
              copy.comingSoon
            }
          />


          {/* WEBSITES */}

          <ServiceNavItem
            icon={
              <Globe2
                size={
                  18
                }
              />
            }
            label={
              copy.websites
            }
            status={
              copy.comingSoon
            }
          />
        </div>
      </div>


      {/* CURRENT SERVICE */}

      {insideMenuService && (
        <div className="mt-6 rounded-[24px] border border-[#ff7a00]/20 bg-[#ff7a00]/[0.06] p-4">
          <div className="flex items-center gap-2 text-[#ff9a3b]">
            <Sparkles
              size={
                15
              }
            />


            <p className="text-[10px] font-black uppercase tracking-[0.16em]">
              {
                copy.currentService
              }
            </p>
          </div>


          <div className="mt-3 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#ff7a00]/10 text-[#ff8d22]">
              <Store
                size={
                  18
                }
              />
            </div>


            <div>
              <p className="text-sm font-black">
                {
                  copy.menu
                }
              </p>

              <p className="mt-0.5 text-[11px] font-bold text-white/30">
                {
                  copy.menuWorkspace
                }
              </p>
            </div>
          </div>


          <Link
            to="/"
            className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-black text-white/45 transition hover:border-[#ff7a00]/25 hover:text-white"
          >
            <span>
              {
                copy.backToBusinesses
              }
            </span>


            <ChevronRight
              size={
                14
              }
              className={
                dir ===
                "rtl"
                  ? "rotate-180"
                  : ""
              }
            />
          </Link>
        </div>
      )}


      {/* ACCOUNT */}

      <div className="mt-7">
        <SidebarLabel>
          {
            copy.accountArea
          }
        </SidebarLabel>


        <nav className="mt-2 grid gap-1.5">
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
              copy.account
            }
          />


          <DisabledNavItem
            icon={
              <Settings
                size={
                  18
                }
              />
            }
            label={
              copy.settings
            }
          />


          <DisabledNavItem
            icon={
              <CircleHelp
                size={
                  18
                }
              />
            }
            label={
              copy.help
            }
          />
        </nav>
      </div>


      {/* LOGOUT */}

      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={
            logout
          }
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400/80 transition hover:bg-red-400/[0.08] hover:text-red-300"
        >
          <LogOut
            size={
              18
            }
          />


          <span>
            {
              copy.logout
            }
          </span>
        </button>
      </div>
    </div>
  );
}


function SidebarLabel({
  children,
}) {
  return (
    <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/20">
      {
        children
      }
    </p>
  );
}


function Brand({
  compact = false,
}) {
  return (
    <Link
      to="/"
      className="block min-w-0"
      dir="ltr"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#ff7a00] font-black text-black ${
            compact
              ? "h-9 w-9 text-xs"
              : "h-11 w-11 text-sm"
          }`}
        >
          C
        </div>


        <div className="min-w-0">
          <h1
            className={`font-black tracking-[-0.045em] ${
              compact
                ? "text-xl"
                : "text-2xl"
            }`}
          >
            CRTRGO
          </h1>


          {!compact && (
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
              Carter Go Workspace
            </p>
          )}
        </div>
      </div>
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


function ServiceNavItem({
  icon,
  label,
  status,
  active = false,
  available = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
        active
          ? "border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff9a3b]"
          : available
            ? "text-white/55"
            : "text-white/25"
      }`}
    >
      <span className="shrink-0">
        {
          icon
        }
      </span>


      <span className="min-w-0 flex-1 truncate text-sm font-black">
        {
          label
        }
      </span>


      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
          active
            ? "bg-[#ff7a00]/15 text-[#ff9a3b]"
            : available
              ? "bg-emerald-400/10 text-emerald-300/70"
              : "bg-white/[0.04] text-white/20"
        }`}
      >
        {
          status
        }
      </span>
    </div>
  );
}


function DisabledNavItem({
  icon,
  label,
}) {
  return (
    <div className="flex cursor-default items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/20">
      {
        icon
      }


      <span>
        {
          label
        }
      </span>
    </div>
  );
}


function AdminLanguageSwitcher({
  expanded = false,
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