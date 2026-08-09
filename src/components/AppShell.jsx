import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  HelpCircle,
  Languages,
  LogOut,
  Menu,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";

import {
  useEffect,
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
  } = useAdminI18n();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    user,
    setUser,
  ] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadUser() {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();

      if (!alive) {
        return;
      }

      if (
        error ||
        !data.user
      ) {
        setUser(null);
        return;
      }

      setUser(data.user);
    }

    loadUser();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (!alive) {
            return;
          }

          setUser(
            session?.user ||
              null
          );
        }
      );

    return () => {
      alive = false;

      authListener
        ?.subscription
        ?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  async function logout() {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success(
        t("auth.loggedOut")
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    } catch (error) {
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

      <aside className="hidden h-full w-[18rem] shrink-0 border-e border-white/10 bg-[#0b0b0b] p-4 lg:flex lg:flex-col">
        <SidebarContent
          user={user}
          logout={logout}
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
            className={`flex h-full w-80 max-w-[88vw] flex-col overflow-y-auto bg-[#0b0b0b] p-4 no-scrollbar ${
              dir === "rtl"
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
                  size={18}
                />
              </button>
            </div>

            <SidebarContent
              user={user}
              logout={logout}
              hideBrand
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
              size={19}
            />
          </button>

          <Brand small />

          <div className="ms-auto flex items-center gap-2">
            <AdminLanguageSwitcher />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-black text-black">
              {getUserInitial(
                user
              )}
            </div>
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
  hideBrand = false,
}) {
  const {
    t,
  } = useAdminI18n();

  const displayName =
    user?.user_metadata
      ?.display_name ||
    user?.email?.split(
      "@"
    )[0] ||
    "CRTGO";

  return (
    <>
      {!hideBrand && (
        <Brand />
      )}

      {/* ACCOUNT */}

<Link
  to="/account"
  className="mt-6 block rounded-[24px] border border-white/10 bg-white/[0.035] p-3 transition hover:border-white/20 hover:bg-white/[0.06]"
>
  <div className="flex items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff7a00] text-sm font-black text-black">
      {getUserInitial(user)}
    </div>

    <div className="min-w-0">
      <p className="truncate text-sm font-black">
        {displayName}
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
</Link>

      {/* LANGUAGE */}

      <div className="mt-3">
        <AdminLanguageSwitcher
          expanded
        />
      </div>

      {/* NAVIGATION */}

      <nav className="mt-6 grid gap-2">
        <SideLink
          to="/"
          icon={
            <Building2
              size={18}
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
              size={18}
            />
          }
          label={
            t(
              "nav.account"
            )
          }
        />

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/38 transition hover:bg-white/[0.045] hover:text-white"
        >
          <Settings
            size={18}
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
            size={18}
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
          onClick={logout}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400/80 transition hover:bg-red-400/[0.099] hover:text-red-300"
        >
          <LogOut
            size={18}
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
  small = false,
}) {
  const {
    t,
  } = useAdminI18n();

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
        CRTGO
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
      to={to}
      end={to === "/"}
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
      {icon}

      <span>
        {label}
      </span>
    </NavLink>
  );
}

function AdminLanguageSwitcher({
  expanded = false,
}) {
  const {
    language,
    setLanguage,
    t,
  } = useAdminI18n();

  const languages = [
    {
      code: "en",
      short: "EN",
      name: "English",
    },
    {
      code: "ar",
      short: "AR",
      name: "العربية",
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
            size={16}
          />
        </div>
      )}

      {languages.map(
        (item) => {
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

  return String(value)
    .trim()
    .charAt(0)
    .toUpperCase();
}