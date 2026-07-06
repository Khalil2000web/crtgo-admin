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
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!alive) return;

      if (error || !data.user) {
        setUser(null);
        setIsOwner(false);
        return;
      }

      setUser(data.user);

      const { data: ownerData } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!alive) return;

      setIsOwner(Boolean(ownerData));
    }

    loadUser();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  }

  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#080808] text-white">
      <aside className="hidden h-full w-72 shrink-0 border-r border-white/10 bg-[#0b0b0b] p-4 lg:flex lg:flex-col">
        <SidebarContent user={user} isOwner={isOwner} logout={logout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[900] overflow-hidden bg-black/70 backdrop-blur-md lg:hidden">
          <aside className="flex h-full w-80 max-w-[88vw] flex-col border-r border-white/10 bg-[#0b0b0b] p-4">
            <div className="mb-3 flex items-center justify-between">
              <Brand />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <SidebarContent
              user={user}
              isOwner={isOwner}
              logout={logout}
              hideBrand
            />
          </aside>
        </div>
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[#080808]/85 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <Menu size={19} />
          </button>

          <Brand small />

          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a00] text-sm font-black text-black">
            {(user?.user_metadata?.display_name ||
              user?.email ||
              "K")[0]?.toUpperCase()}
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

function SidebarContent({ user, isOwner, logout, hideBrand = false }) {
  return (
    <>
      {!hideBrand && <Brand />}

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff7a00] text-sm font-black text-black">
            {(user?.user_metadata?.display_name ||
              user?.email ||
              "K")[0]?.toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black">
              {user?.user_metadata?.display_name || "CRTGO Owner"}
            </p>

            <p className="truncate text-xs font-bold text-white/35">
              {user?.email || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {isOwner && (
        <Link
          to="/owner"
          className="mt-4 flex items-center gap-3 rounded-[22px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-4 py-3 text-sm font-black text-[#ffbd7c] transition hover:bg-[#ff7a00]/15"
        >
          <ShieldCheck size={18} />
          Owner Console
        </Link>
      )}

      <nav className="mt-6 grid gap-2">
        <SideLink to="/" icon={<Building2 size={18} />} label="Businesses" />

        <SideLink
          to="/account"
          icon={<UserCircle2 size={18} />}
          label="Account"
        />

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/38 transition hover:bg-white/[0.045] hover:text-white"
        >
          <Settings size={18} />
          Settings
        </button>

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/38 transition hover:bg-white/[0.045] hover:text-white"
        >
          <HelpCircle size={18} />
          Help Center
        </button>
      </nav>

      <div className="mt-auto grid gap-2">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400/80 transition hover:bg-red-400/[0.099] hover:text-white"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </>
  );
}

function Brand({ small = false }) {
  return (
    <Link
      to="/"
      className="block rounded-3xl px-2 py-2 transition hover:bg-white/[0.035]"
    >
      <h1
        className={`${
          small ? "text-2xl" : "text-4xl"
        } font-black tracking-[-0.07em]`}
      >
        CRTGO
      </h1>

      {!small && (
        <p className="mt-1 text-xs font-black uppercase tracking-[0.28em] text-white/30">
          Admin
        </p>
      )}
    </Link>
  );
}

function SideLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
          isActive
            ? "bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/10"
            : "text-white/45 hover:bg-white/[0.045] hover:text-white"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}