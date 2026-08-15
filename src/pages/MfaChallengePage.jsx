import {
  ArrowRight,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";


export default function MfaChallengePage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    verifying,
    setVerifying,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    factors,
    setFactors,
  ] =
    useState([]);

  const [
    selectedFactorId,
    setSelectedFactorId,
  ] =
    useState("");

  const [
    code,
    setCode,
  ] =
    useState("");


  useEffect(() => {
    let alive =
      true;


    async function load() {
      setLoading(
        true
      );

      setError(
        ""
      );


      try {
        const {
          data:
            assurance,

          error:
            assuranceError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();


        if (
          assuranceError
        ) {
          throw assuranceError;
        }


        if (
          !alive
        ) {
          return;
        }


        /*
         * Already verified?
         * Don't leave them sitting on /mfa.
         */
        if (
          assurance?.currentLevel ===
          "aal2"
        ) {
          navigate(
            getDestination(
              location.state
                ?.from
            ),
            {
              replace:
                true,
            }
          );

          return;
        }


        const {
          data,
          error:
            factorsError,
        } =
          await supabase.auth.mfa
            .listFactors();


        if (
          factorsError
        ) {
          throw factorsError;
        }


        if (
          !alive
        ) {
          return;
        }


        const verifiedTotp =
          (
            data?.totp ||
            []
          ).filter(
            (
              factor
            ) =>
              factor.status ===
              "verified"
          );


        setFactors(
          verifiedTotp
        );


        if (
          verifiedTotp.length >
          0
        ) {
          setSelectedFactorId(
            verifiedTotp[0].id
          );
        }
      } catch (
        error
      ) {
        console.error(
          error
        );


        if (
          alive
        ) {
          setError(
            error?.message ||
              "Could not load two-step verification."
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


    load();


    return () => {
      alive =
        false;
    };
  }, [
    navigate,
    location.state,
  ]);


  async function verify(
    event
  ) {
    event.preventDefault();


    if (
      verifying
    ) {
      return;
    }


    setError(
      ""
    );


    const cleanCode =
      code.replace(
        /\D/g,
        ""
      );


    if (
      cleanCode.length !==
      6
    ) {
      setError(
        "Enter the 6-digit code from your authenticator app."
      );

      return;
    }


    if (
      !selectedFactorId
    ) {
      setError(
        "No verified authenticator was found."
      );

      return;
    }


    setVerifying(
      true
    );


    try {
      const {
        data:
          challenge,

        error:
          challengeError,
      } =
        await supabase.auth.mfa
          .challenge({
            factorId:
              selectedFactorId,
          });


      if (
        challengeError
      ) {
        throw challengeError;
      }


      const {
        error:
          verifyError,
      } =
        await supabase.auth.mfa
          .verify({
            factorId:
              selectedFactorId,

            challengeId:
              challenge.id,

            code:
              cleanCode,
          });


      if (
        verifyError
      ) {
        throw verifyError;
      }


      /*
       * Verify() refreshes the auth session.
       * The next route now receives AAL2.
       */
      navigate(
        getDestination(
          location.state
            ?.from
        ),
        {
          replace:
            true,
        }
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setCode(
        ""
      );

      setError(
        error?.message ||
          "That code could not be verified."
      );
    } finally {
      setVerifying(
        false
      );
    }
  }


  async function signOut() {
    try {
      await supabase.auth.signOut({
        scope:
          "local",
      });
    } finally {
      navigate(
        "/login",
        {
          replace:
            true,
        }
      );
    }
  }


  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="grid place-items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#ff7a00]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
            Checking security
          </span>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="flex h-[58px] items-center justify-between border-b border-white/10 px-5 md:px-7">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center bg-[#ff7a00] font-mono text-xs font-bold text-black">
            C
          </div>

          <span className="font-mono text-xs font-semibold tracking-[0.08em]">
            CRTRGO
          </span>

          <span className="hidden border-l border-white/15 pl-3 font-mono text-[8px] uppercase tracking-[0.1em] text-white/30 sm:block">
            Admin / Security
          </span>
        </div>


        <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.08em] text-white/35">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a00]" />

          AAL2 required
        </div>
      </header>


      <div
        className="flex h-8 items-center justify-between border-b border-white/10 px-5 font-mono text-[8px] uppercase tracking-[0.08em] text-white/25 md:px-7"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.14) 0.7px, transparent 0.7px)",

          backgroundSize:
            "8px 8px",
        }}
      >
        <span>
          Identity system
        </span>

        <span>
          Step 02 / Verification
        </span>
      </div>


      <section className="mx-auto grid w-full max-w-[980px] gap-12 px-5 py-12 md:grid-cols-[280px_minmax(0,1fr)] md:px-8 md:py-20">
        <aside
          className="relative hidden min-h-[430px] overflow-hidden bg-[#0d0d0d] p-6 md:block"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.12) 0.7px, transparent 0.7px)",

            backgroundSize:
              "10px 10px",
          }}
        >
          <div className="grid h-16 w-16 place-items-center bg-[#ff7a00] text-black">
            <ShieldCheck
              size={
                30
              }
            />
          </div>


          <div className="absolute bottom-6 left-6">
            <p className="w-36 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-white/30">
              Carter Go
              administrator
              identity
              verification
            </p>
          </div>


          <div className="absolute -bottom-10 right-0 font-mono text-[150px] leading-none tracking-[-0.1em] text-[#ff7a00]">
            02
          </div>
        </aside>


        <section className="pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ff7a00]">
            Identity verification
          </span>


          <h1 className="mt-3 max-w-xl text-[40px] font-normal leading-[0.98] tracking-[-0.05em] sm:text-[52px]">
            Verify it's really you
          </h1>


          <p className="mt-5 max-w-lg text-sm leading-6 text-white/45">
            This Carter Go account has
            two-step verification enabled.
            Enter the current code from
            your authenticator app before
            continuing to Admin.
          </p>


          {factors.length >
          0 ? (
            <form
              onSubmit={
                verify
              }
              className="mt-8 border-t border-white/70 bg-[#0d0d0d]"
            >
              <div className="flex min-h-20 items-center gap-3 border-b border-white/10 px-4">
                <div className="grid h-10 w-10 place-items-center bg-[#ff7a00] text-black">
                  <LockKeyhole
                    size={
                      18
                    }
                  />
                </div>


                <div className="grid gap-1">
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/30">
                    Authenticator app
                  </span>

                  <strong className="text-xs font-medium">
                    Enter your 6-digit code
                  </strong>
                </div>
              </div>


              {factors.length >
                1 && (
                <div className="border-b border-white/10">
                  <div className="px-4 py-3 font-mono text-[8px] uppercase tracking-[0.08em] text-white/25">
                    Choose authenticator
                  </div>


                  {factors.map(
                    (
                      factor,
                      index
                    ) => {
                      const active =
                        factor.id ===
                        selectedFactorId;


                      return (
                        <button
                          key={
                            factor.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedFactorId(
                              factor.id
                            )
                          }
                          className={`flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left transition ${
                            active
                              ? "bg-[#ff7a00]/10 text-white"
                              : "text-white/45 hover:bg-white/[0.03]"
                          }`}
                        >
                          <KeyRound
                            size={
                              14
                            }
                          />

                          <span className="flex-1 text-xs">
                            {factor.friendly_name ||
                              `Authenticator ${index + 1}`}
                          </span>


                          {active && (
                            <span className="h-2 w-2 rounded-full bg-[#ff7a00]" />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}


              <div className="p-4">
                <label className="grid gap-2">
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/35">
                    Verification code
                  </span>


                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={
                      6
                    }
                    autoFocus
                    dir="ltr"
                    value={
                      code
                    }
                    placeholder="000000"
                    onChange={(
                      event
                    ) =>
                      setCode(
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                    }
                    className="h-16 w-full border border-white/10 bg-black px-4 text-center font-mono text-2xl tracking-[0.35em] text-white outline-none transition placeholder:text-white/10 focus:border-[#ff7a00]"
                  />
                </label>


                {error && (
                  <div className="mt-3 border-l-2 border-red-500 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-300">
                    {
                      error
                    }
                  </div>
                )}


                <button
                  type="submit"
                  disabled={
                    verifying ||
                    code.length !==
                      6
                  }
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-[#ff7a00] font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-black transition hover:bg-[#e86f00] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {verifying
                    ? "Verifying..."
                    : "Verify & continue"}


                  {!verifying && (
                    <ArrowRight
                      size={
                        15
                      }
                    />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 border-t border-white/70 bg-[#0d0d0d] p-6">
              <ShieldCheck
                size={
                  24
                }
                className="text-[#ff7a00]"
              />

              <h2 className="mt-4 text-lg font-medium">
                No verified authenticator found
              </h2>

              <p className="mt-2 max-w-md text-xs leading-5 text-white/40">
                Carter Go expected an MFA
                factor for this account but
                couldn't find a verified
                authenticator.
              </p>


              {error && (
                <p className="mt-3 text-xs text-red-300">
                  {
                    error
                  }
                </p>
              )}
            </div>
          )}


          <button
            type="button"
            onClick={
              signOut
            }
            className="mt-5 flex h-9 items-center gap-2 border border-white/10 px-3 font-mono text-[8px] uppercase tracking-[0.08em] text-white/35 transition hover:bg-white/[0.03] hover:text-white"
          >
            <LogOut
              size={
                13
              }
            />

            Sign out
          </button>
        </section>
      </section>
    </main>
  );
}


function getDestination(
  from
) {
  if (
    typeof from !==
    "string"
  ) {
    return "/";
  }


  /*
   * Prevent redirect loops or sending
   * somewhere outside this application.
   */
  if (
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.startsWith("/mfa") ||
    from.startsWith("/login")
  ) {
    return "/";
  }


  return from;
}