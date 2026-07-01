import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      if (error) {
        console.error(error);
        setSession(null);
      } else {
        setSession(data.session);
      }

      setLoading(false);
    }

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="grid place-items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a00]" />
          <p className="text-sm font-black text-white/35">Loading CRTGO...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}