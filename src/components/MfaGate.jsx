import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";


export default function MfaGate() {
  const location =
    useLocation();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    needsMfa,
    setNeedsMfa,
  ] =
    useState(false);

  const [
    failed,
    setFailed,
  ] =
    useState(false);


  useEffect(() => {
    let alive =
      true;


    async function checkMfa() {
      setLoading(
        true
      );

      setFailed(
        false
      );


      try {
        const {
          data,
          error,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();


        if (
          error
        ) {
          throw error;
        }


        if (
          !alive
        ) {
          return;
        }


        const requiresMfa =
          data?.nextLevel ===
            "aal2" &&
          data?.currentLevel !==
            "aal2";


        setNeedsMfa(
          requiresMfa
        );
      } catch (
        error
      ) {
        console.error(
          "Could not check MFA status:",
          error
        );


        if (
          alive
        ) {
          setFailed(
            true
          );
        }
      } finally {
        if (
          alive
        ) {
          setLoading(
            false
          );
        }
      }
    }


    checkMfa();


    return () => {
      alive =
        false;
    };
  }, [
    location.pathname,
    location.search,
  ]);


  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="grid place-items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a00]" />

          <div className="grid gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
              Identity check
            </p>

            <p className="text-sm font-medium text-white/60">
              Verifying account security...
            </p>
          </div>
        </div>
      </main>
    );
  }


  if (
    failed
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
        <div className="w-full max-w-md border border-white/10 bg-[#0c0c0c] p-6">
          <div className="mb-4 h-1 w-12 bg-[#ff7a00]" />

          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff7a00]">
            Security error
          </p>

          <h1 className="text-2xl font-medium tracking-[-0.03em]">
            We couldn't verify this session.
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            Refresh the page and try again.
            Admin access is paused until
            the security check succeeds.
          </p>
        </div>
      </main>
    );
  }


  if (
    needsMfa
  ) {
    const from =
      `${location.pathname}${location.search}${location.hash}`;


    return (
      <Navigate
        to="/mfa"
        replace
        state={{
          from,
        }}
      />
    );
  }


  return <Outlet />;
}