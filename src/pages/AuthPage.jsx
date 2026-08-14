import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";


export default function AuthPage() {
  const navigate =
    useNavigate();

  const {
    t,
    dir,
    language,
    setLanguage,
  } = useAdminI18n();


  const [
    mode,
    setMode,
  ] = useState(
    "login"
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false
  );

  const [
    checking,
    setChecking,
  ] = useState(
    true
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(
    false
  );


  const [
    form,
    setForm,
  ] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
  });


  useEffect(() => {
    let active =
      true;


    async function checkSession() {
      try {
        const {
          data,
        } =
          await supabase.auth.getSession();


        if (
          !active
        ) {
          return;
        }


        if (
          data.session
        ) {
          navigate(
            "/",
            {
              replace: true,
            }
          );

          return;
        }
      } finally {
        if (
          active
        ) {
          setChecking(
            false
          );
        }
      }
    }


    checkSession();


    return () => {
      active =
        false;
    };
  }, [
    navigate,
  ]);


  function updateField(
    key,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }


  function changeMode(
    nextMode
  ) {
    if (
      loading
    ) {
      return;
    }

    setMode(
      nextMode
    );

    setShowPassword(
      false
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      loading
    ) {
      return;
    }


    const email =
      form.email
        .trim()
        .toLowerCase();

    const password =
      form.password;


    if (!email) {
      toast.error(
        t(
          "authPage.emailRequired"
        )
      );

      return;
    }


    if (!password) {
      toast.error(
        t(
          "authPage.passwordRequired"
        )
      );

      return;
    }


    if (
      password.length <
      6
    ) {
      toast.error(
        t(
          "authPage.passwordTooShort"
        )
      );

      return;
    }


    setLoading(
      true
    );


    try {
      if (
        mode ===
        "login"
      ) {
        const {
          error,
        } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });


        if (error) {
          throw error;
        }


        toast.success(
          t(
            "authPage.welcomeBack"
          )
        );


        navigate(
          "/",
          {
            replace: true,
          }
        );


        return;
      }


      const username =
        form.username
          .trim()
          .toLowerCase()
          .replace(
            /\s+/g,
            ""
          );


      const displayName =
        form.displayName.trim();


      if (!username) {
        toast.error(
          t(
            "authPage.usernameRequired"
          )
        );

        return;
      }


      if (!displayName) {
        toast.error(
          t(
            "authPage.displayNameRequired"
          )
        );

        return;
      }


      if (
        !/^[a-z0-9._]+$/.test(
          username
        )
      ) {
        toast.error(
          t(
            "authPage.usernameInvalid"
          )
        );

        return;
      }


      const {
        data:
          existingProfile,

        error:
          usernameCheckError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id"
          )
          .ilike(
            "username",
            username
          )
          .maybeSingle();


      if (
        usernameCheckError
      ) {
        throw usernameCheckError;
      }


      if (
        existingProfile
      ) {
        toast.error(
          t(
            "authPage.usernameTaken"
          )
        );

        return;
      }


      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              username,

              display_name:
                displayName,
            },
          },
        });


      if (error) {
        throw error;
      }


      if (
        data.user
      ) {
        const {
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .upsert({
              id:
                data.user.id,

              email,

              username,

              display_name:
                displayName,
            });


        if (
          profileError
        ) {
          throw profileError;
        }
      }


      toast.success(
        t(
          "authPage.accountCreated"
        )
      );


      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (err) {
      toast.error(
        getAuthErrorMessage(
          err,
          t
        )
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  if (
    checking
  ) {
    return (
      <main
        dir={dir}
        className="grid min-h-screen place-items-center bg-[#090909] px-5 text-white"
      >
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#ff7a00] text-black">
            <Loader2
              size={24}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-black text-white/45">
            {t(
              "authPage.checkingSession"
            )}
          </p>
        </div>
      </main>
    );
  }


  return (
    <main
      dir={dir}
      className="min-h-screen overflow-hidden bg-[#090909] text-white"
    >
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#ff7a00]/10 blur-[120px]" />

        <div className="absolute -bottom-32 right-0 h-[500px] w-[500px] rounded-full bg-[#ff7a00]/5 blur-[140px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:24px_24px]" />
      </div>


      {/* TOP BAR */}

      <header className="relative z-10 flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#ff7a00] text-sm font-black text-black">
            C
          </div>

          <div>
            <p
              className="text-lg font-black tracking-[-0.05em]"
              dir="ltr"
            >
              CRTRGO
            </p>

            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/25">
              {t(
                "brand.admin"
              )}
            </p>
          </div>
        </div>


        {/* LANGUAGE */}

        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1">
          <Globe2
            size={15}
            className="mx-2 text-white/35"
          />

          <button
            type="button"
            onClick={() =>
              setLanguage(
                "en"
              )
            }
            className={`min-h-9 rounded-xl px-3 text-xs font-black transition ${
              language ===
              "en"
                ? "bg-white text-black"
                : "text-white/40 hover:text-white"
            }`}
          >
            EN
          </button>


          <button
            type="button"
            onClick={() =>
              setLanguage(
                "ar"
              )
            }
            className={`min-h-9 rounded-xl px-3 text-xs font-black transition ${
              language ===
              "ar"
                ? "bg-white text-black"
                : "text-white/40 hover:text-white"
            }`}
          >
            AR
          </button>
        </div>
      </header>


      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1450px] items-center gap-10 px-5 pb-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_500px] lg:px-10">

        {/* INTRO */}

        <section className="hidden max-w-2xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-3 py-2 text-xs font-black text-[#ffad61]">
            <LockKeyhole
              size={14}
            />

            {t(
              "authPage.secureAdmin"
            )}
          </div>


          <h1 className="mt-7 max-w-xl text-6xl font-black leading-[0.95] tracking-[-0.075em] xl:text-7xl">
            {t(
              "authPage.heroTitle"
            )}
          </h1>


          <p className="mt-6 max-w-xl text-base font-bold leading-8 text-white/38">
            {t(
              "authPage.heroText"
            )}
          </p>


          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <Feature
              number="01"
              text={t(
                "authPage.featureWebsites"
              )}
            />

            <Feature
              number="02"
              text={t(
                "authPage.featureMenus"
              )}
            />

            <Feature
              number="03"
              text={t(
                "authPage.featureBranding"
              )}
            />
          </div>
        </section>


        {/* AUTH CARD */}

        <section className="mx-auto w-full max-w-[500px]">
          <div className="rounded-[34px] border border-white/10 bg-[#111111]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff7a00]">
                {mode ===
                "login"
                  ? t(
                      "authPage.welcome"
                    )
                  : t(
                      "authPage.getStarted"
                    )}
              </p>


              <h2 className="mt-3 text-4xl font-black tracking-[-0.06em]">
                {mode ===
                "login"
                  ? t(
                      "authPage.loginTitle"
                    )
                  : t(
                      "authPage.signupTitle"
                    )}
              </h2>


              <p className="mt-2 max-w-md text-sm font-bold leading-6 text-white/40">
                {mode ===
                "login"
                  ? t(
                      "authPage.loginSubtitle"
                    )
                  : t(
                      "authPage.signupSubtitle"
                    )}
              </p>
            </div>


            {/* TABS */}

            <div className="mt-7 grid grid-cols-2 rounded-[18px] border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  changeMode(
                    "login"
                  )
                }
                className={`min-h-11 rounded-[14px] text-sm font-black transition ${
                  mode ===
                  "login"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {t(
                  "authPage.login"
                )}
              </button>


              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  changeMode(
                    "signup"
                  )
                }
                className={`min-h-11 rounded-[14px] text-sm font-black transition ${
                  mode ===
                  "signup"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {t(
                  "authPage.signup"
                )}
              </button>
            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 grid gap-4"
            >
              {mode ===
                "signup" && (
                <>
                  <AuthField
                    label={t(
                      "authPage.username"
                    )}
                  >
                    <input
                      autoComplete="username"
                      value={
                        form.username
                      }
                      disabled={
                        loading
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "username",
                          event.target.value
                        )
                      }
                      placeholder="khaliil"
                      dir="ltr"
                      className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 transition focus:border-[#ff7a00] disabled:opacity-50"
                    />
                  </AuthField>


                  <AuthField
                    label={t(
                      "authPage.displayName"
                    )}
                  >
                    <input
                      autoComplete="name"
                      value={
                        form.displayName
                      }
                      disabled={
                        loading
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "displayName",
                          event.target.value
                        )
                      }
                      placeholder={t(
                        "authPage.displayNamePlaceholder"
                      )}
                      className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 transition focus:border-[#ff7a00] disabled:opacity-50"
                    />
                  </AuthField>
                </>
              )}


              <AuthField
                label={t(
                  "authPage.email"
                )}
              >
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={
                    form.email
                  }
                  disabled={
                    loading
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  dir="ltr"
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 transition focus:border-[#ff7a00] disabled:opacity-50"
                />
              </AuthField>


              <AuthField
                label={t(
                  "authPage.password"
                )}
              >
                <div className="flex min-h-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition focus-within:border-[#ff7a00]">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete={
                      mode ===
                      "login"
                        ? "current-password"
                        : "new-password"
                    }
                    value={
                      form.password
                    }
                    disabled={
                      loading
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    placeholder="••••••••"
                    dir="ltr"
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 disabled:opacity-50"
                  />


                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    aria-label={
                      showPassword
                        ? t(
                            "authPage.hidePassword"
                          )
                        : t(
                            "authPage.showPassword"
                          )
                    }
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="flex w-12 shrink-0 items-center justify-center text-white/35 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}
                  </button>
                </div>
              </AuthField>


              <button
                type="submit"
                disabled={
                  loading
                }
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 text-sm font-black text-black transition hover:bg-[#ff922f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    {t(
                      "authPage.pleaseWait"
                    )}
                  </>
                ) : (
                  <>
                    {mode ===
                    "login"
                      ? t(
                          "authPage.login"
                        )
                      : t(
                          "authPage.createAccount"
                        )}

                    <ArrowRight
                      size={17}
                      className={
                        dir ===
                        "rtl"
                          ? "rotate-180"
                          : ""
                      }
                    />
                  </>
                )}
              </button>
            </form>


            <p className="mt-6 text-center text-xs font-bold leading-5 text-white/25">
              {t(
                "authPage.footer"
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


function AuthField({
  label,
  children,
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </span>

      {children}
    </label>
  );
}


function Feature({
  number,
  text,
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-black text-[#ff7a00]">
        {number}
      </p>

      <p className="mt-3 text-sm font-black leading-5 text-white/55">
        {text}
      </p>
    </div>
  );
}


function getAuthErrorMessage(
  error,
  t
) {
  const message =
    String(
      error?.message ||
        ""
    ).toLowerCase();


  if (
    message.includes(
      "invalid login credentials"
    )
  ) {
    return t(
      "authPage.invalidCredentials"
    );
  }


  if (
    message.includes(
      "email not confirmed"
    )
  ) {
    return t(
      "authPage.emailNotConfirmed"
    );
  }


  if (
    message.includes(
      "user already registered"
    )
  ) {
    return t(
      "authPage.emailUsed"
    );
  }


  if (
    message.includes(
      "password"
    ) &&
    message.includes(
      "least"
    )
  ) {
    return t(
      "authPage.passwordTooShort"
    );
  }


  return (
    error?.message ||
    t(
      "authPage.somethingWentWrong"
    )
  );
}