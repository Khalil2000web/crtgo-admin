import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CreditCard, Home, LogOut, Menu, PanelLeft, QrCode, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

export default function AppShell() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, []);

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    navigate("/login", { replace: true });
  }

  const nav = (
    <>
      <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
        <Home size={18} />
        <span>الرئيسية</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => navClass(isActive)}>
        <Menu size={18} />
        <span>القائمة</span>
      </NavLink>
      <NavLink to="/qr" className={({ isActive }) => navClass(isActive)}>
        <QrCode size={18} />
        <span>رمز QR</span>
      </NavLink>
      <NavLink to="/billing" className={({ isActive }) => navClass(isActive)}>
        <CreditCard size={18} />
        <span>الفوترة</span>
      </NavLink>
    </>
  );

  return (
    <main dir="rtl" className="flex h-dvh min-h-0 overflow-hidden bg-[#080808] text-white">
      <aside className="fixed inset-y-0 left-0 hidden h-dvh w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-[#0b0b0b] p-4 lg:flex lg:flex-col">
        <Brand />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="truncate text-sm font-black">{user?.email?.split("@")[0] || "CRTGO"}</p>
          <p className="mt-1 truncate text-xs font-bold text-white/30" dir="ltr">{user?.email || ""}</p>
        </div>

        <nav className="mt-6 grid gap-2">{nav}</nav>

        <div className="mt-auto pt-6">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/40 transition hover:bg-white/[0.04] hover:text-white">
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="flex h-full w-80 max-w-[88vw] flex-col overflow-y-auto border-r border-white/10 bg-[#0b0b0b] p-4" dir="rtl">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/50">
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 grid gap-2" onClick={() => setMobileOpen(false)}>{nav}</nav>
            <div className="mt-auto">
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/40">
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      )}

      <section className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col lg:ml-72">
        <header className="flex h-16 shrink-0 items-center border-b border-white/10 bg-[#080808]/90 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60">
            <PanelLeft size={18} />
          </button>
          <div className="mr-3"><Brand compact /></div>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

function Brand({ compact = false }) {
  return (
    <div>
      <div className={`${compact ? "text-lg" : "text-xl"} font-black tracking-[-0.05em]`} dir="ltr">CRTGO</div>
      {!compact && <div className="text-xs font-bold text-white/30">إدارة المطعم</div>}
    </div>
  );
}

function navClass(active) {
  return `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${active ? "bg-[#ff7a00] text-black" : "text-white/45 hover:bg-white/[0.04] hover:text-white"}`;
}
