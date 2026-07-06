import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { supabase } from "../lib/supabase";

export default function OwnerRoute() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkOwner() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (userError || !user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      setAllowed(Boolean(data && !error));
      setLoading(false);
    }

    checkOwner();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="grid h-full place-items-center bg-[#090909] text-white">
        <div className="grid place-items-center gap-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
            <ShieldCheck size={25} />
          </div>

          <p className="text-sm font-black text-white/40">
            Checking owner access...
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}