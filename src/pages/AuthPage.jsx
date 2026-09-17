import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { useAdminI18n } from "../lib/adminI18n";

export default function AuthPage() {
  const navigate = useNavigate();
  const { language, setLanguage, dir } = useAdminI18n();

  const ar = language === "ar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate("/", { replace: true });
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast.error(ar ? "أدخل البريد الإلكتروني وكلمة المرور." : "Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.message || (ar ? "تعذر تسجيل الدخول." : "Could not sign in."));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080808] text-white">
        <Loader2 className="animate-spin text-[#ff7a00]" />
      </main>
    );
  }

  return (
    <main dir={dir} className="min-h-screen bg-[#080808] px-5 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between py-6">
        <div>
          <div className="text-xl font-black tracking-[-0.05em]" dir="ltr">CRTGO</div>
          <div className="text-xs font-bold text-white/35">{ar ? "لوحة المطعم" : "Restaurant dashboard"}</div>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs font-black">
          <button onClick={() => setLanguage("ar")} className={`rounded-lg px-3 py-2 ${ar ? "bg-white text-black" : "text-white/45"}`}>AR</button>
          <button onClick={() => setLanguage("en")} className={`rounded-lg px-3 py-2 ${!ar ? "bg-white text-black" : "text-white/45"}`}>EN</button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-90px)] max-w-6xl place-items-center pb-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff7a00] text-black">
            <LockKeyhole size={20} />
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-[-0.055em]">
            {ar ? "تسجيل الدخول" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm font-bold leading-6 text-white/40">
            {ar ? "هذه اللوحة مخصصة لعملاء CRTGO فقط. لا يوجد تسجيل حسابات عامة." : "This dashboard is only for CRTGO clients. Public sign-up is disabled."}
          </p>

          <label className="mt-7 block text-xs font-black text-white/55">{ar ? "البريد الإلكتروني" : "Email"}</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-[#ff7a00]/60"
          />

          <label className="mt-4 block text-xs font-black text-white/55">{ar ? "كلمة المرور" : "Password"}</label>
          <div className="relative mt-2">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 pe-12 outline-none transition focus:border-[#ff7a00]/60"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 end-2 grid w-10 place-items-center text-white/35">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <button disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#ff7a00] font-black text-black transition hover:brightness-110 disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (ar ? "دخول" : "Sign in")}
          </button>
        </form>
      </section>
    </main>
  );
}
