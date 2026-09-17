import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CreditCard, LogOut, Menu, PanelLeft, X } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAdminI18n } from "../lib/adminI18n";

export default function AppShell() {
  const navigate = useNavigate();
  const { language, setLanguage, dir } = useAdminI18n();
  const ar = language === "ar";
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
      <NavLink to="/menu" className={({ isActive }) => navClass(isActive)}><Menu size={18}/><span>{ar ? "القائمة" : "Menu"}</span></NavLink>
      <NavLink to="/billing" className={({ isActive }) => navClass(isActive)}><CreditCard size={18}/><span>{ar ? "الفوترة" : "Billing"}</span></NavLink>
    </>
  );

  return (
    <main dir={dir} className="flex min-h-screen bg-[#080808] text-white">
      <aside className="hidden w-72 shrink-0 border-e border-white/10 bg-[#0b0b0b] p-4 lg:flex lg:flex-col">
        <Brand ar={ar}/>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <p className="truncate text-sm font-black">{user?.email?.split("@")[0] || "CRTGO"}</p>
          <p className="mt-1 truncate text-xs font-bold text-white/30" dir="ltr">{user?.email || ""}</p>
        </div>
        <nav className="mt-6 grid gap-2">{nav}</nav>
        <div className="mt-auto pt-6">
          <LanguageSwitch language={language} setLanguage={setLanguage}/>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/40 transition hover:bg-white/[0.04] hover:text-white"><LogOut size={18}/><span>{ar ? "تسجيل الخروج" : "Log out"}</span></button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="flex h-full w-80 max-w-[88vw] flex-col border-e border-white/10 bg-[#0b0b0b] p-4">
            <div className="flex items-center justify-between"><Brand ar={ar}/><button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/50"><X size={18}/></button></div>
            <nav className="mt-6 grid gap-2" onClick={() => setMobileOpen(false)}>{nav}</nav>
            <div className="mt-auto"><LanguageSwitch language={language} setLanguage={setLanguage}/><button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/40"><LogOut size={18}/>{ar ? "تسجيل الخروج" : "Log out"}</button></div>
          </aside>
        </div>
      )}

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#080808]/90 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60"><PanelLeft size={18}/></button>
          <div className="ms-3"><Brand ar={ar} compact/></div>
          <div className="ms-auto"><LanguageSwitch language={language} setLanguage={setLanguage} compact/></div>
        </header>
        <Outlet/>
      </section>
    </main>
  );
}

function Brand({ ar, compact = false }) {
  return <div><div className={`${compact ? "text-lg" : "text-xl"} font-black tracking-[-0.05em]`} dir="ltr">CRTGO</div>{!compact && <div className="text-xs font-bold text-white/30">{ar ? "لوحة المطعم" : "Restaurant dashboard"}</div>}</div>;
}

function LanguageSwitch({ language, setLanguage, compact = false }) {
  return <div className={`flex rounded-xl border border-white/10 bg-white/[0.03] p-1 ${compact ? "text-[10px]" : "text-xs"} font-black`}><button onClick={() => setLanguage("ar")} className={`rounded-lg px-3 py-2 ${language === "ar" ? "bg-white text-black" : "text-white/40"}`}>AR</button><button onClick={() => setLanguage("en")} className={`rounded-lg px-3 py-2 ${language === "en" ? "bg-white text-black" : "text-white/40"}`}>EN</button></div>;
}

function navClass(active) {
  return `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${active ? "bg-[#ff7a00] text-black" : "text-white/45 hover:bg-white/[0.04] hover:text-white"}`;
}
