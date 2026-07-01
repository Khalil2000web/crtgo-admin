import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
  });

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        navigate("/", { replace: true });
        return;
      }

      setChecking(false);
    }

    checkSession();
  }, [navigate]);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const email = form.email.trim();
      const password = form.password;

      if (!email) throw new Error("Email is required.");
      if (!password) throw new Error("Password is required.");

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back");
        navigate("/", { replace: true });
        return;
      }

      const username = form.username.trim().toLowerCase();
      const displayName = form.displayName.trim();

      if (!username) throw new Error("Username is required.");
      if (!displayName) throw new Error("Display name is required.");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          username,
          display_name: displayName,
        });
      }

      toast.success("Account created");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="h-[100dvh] overflow-y-auto bg-[#090909] px-4 py-6 text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#ff7a00]" />
      </main>
    );
  }

  return (
   <main className="h-[100dvh] overflow-y-auto bg-[#090909] px-4 py-6 text-white">
      <section className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#111111] p-5 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ff7a00]">
          CRTGO ADMIN
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.06em]">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>

        <p className="mt-2 text-sm font-bold text-white/40">
          Manage businesses, branches, and digital menus.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl py-2.5 text-sm font-black transition ${
              mode === "login"
                ? "bg-white text-black"
                : "text-white/40 hover:text-white"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-xl py-2.5 text-sm font-black transition ${
              mode === "signup"
                ? "bg-white text-black"
                : "text-white/40 hover:text-white"
            }`}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {mode === "signup" && (
            <>
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  Username
                </span>
                <input
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="khaliil"
                  className="min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#ff7a00]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  Display name
                </span>
                <input
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="Khalil"
                  className="min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#ff7a00]"
                />
              </label>
            </>
          )}

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
              className="min-h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#ff7a00]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Password
            </span>

            <div className="flex min-h-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 focus-within:border-[#ff7a00]">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-white/25"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex w-12 items-center justify-center text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            disabled={loading}
            className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] text-sm font-black text-black transition hover:bg-white disabled:opacity-50"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}