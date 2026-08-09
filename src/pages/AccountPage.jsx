import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  Save,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
  Stat,
} from "../components/ui";


export default function AccountPage() {
  const {
    t,
    dir,
  } = useAdminI18n();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    user,
    setUser,
  ] = useState(null);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    isOwner,
    setIsOwner,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    username: "",
    display_name: "",
    email: "",
  });


  useEffect(() => {
    loadAccount();
  }, []);


  async function loadAccount() {
    setLoading(true);

    try {
      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();


      if (userError) {
        throw userError;
      }


      if (!user) {
        throw new Error(
          t(
            "account.userNotFound"
          )
        );
      }


      setUser(
        user
      );


      const [
        profileRes,
        ownerRes,
      ] =
        await Promise.all([
          supabase
            .from(
              "profiles"
            )
            .select(`
              id,
              email,
              username,
              display_name,
              created_at,
              updated_at
            `)
            .eq(
              "id",
              user.id
            )
            .maybeSingle(),

          supabase
            .from(
              "super_admins"
            )
            .select(
              "user_id"
            )
            .eq(
              "user_id",
              user.id
            )
            .maybeSingle(),
        ]);


      if (
        profileRes.error
      ) {
        throw profileRes.error;
      }


      setIsOwner(
        Boolean(
          ownerRes.data &&
            !ownerRes.error
        )
      );


      const finalProfile =
        profileRes.data || {
          id:
            user.id,

          email:
            user.email,

          username:
            user.user_metadata
              ?.username ||
            "",

          display_name:
            user.user_metadata
              ?.display_name ||
            "",
        };


      setProfile(
        finalProfile
      );


      setForm({
        username:
          finalProfile.username ||
          "",

        display_name:
          finalProfile.display_name ||
          "",

        email:
          finalProfile.email ||
          user.email ||
          "",
      });
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "account.loadFailed"
          )
      );
    } finally {
      setLoading(false);
    }
  }


  const initialForm =
    useMemo(() => {
      return {
        username:
          profile?.username ||
          "",

        display_name:
          profile?.display_name ||
          "",

        email:
          profile?.email ||
          user?.email ||
          "",
      };
    }, [
      profile,
      user,
    ]);


  const dirty =
    JSON.stringify(
      form
    ) !==
    JSON.stringify(
      initialForm
    );


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


  function discard() {
    setForm(
      initialForm
    );

    toast.success(
      t(
        "common.changesDiscarded"
      )
    );
  }


  async function saveAccount(
    event
  ) {
    event?.preventDefault();

    if (
      !dirty ||
      !user ||
      saving
    ) {
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
      form.display_name.trim();


    if (!username) {
      toast.error(
        t(
          "account.usernameRequired"
        )
      );

      return;
    }


    if (!displayName) {
      toast.error(
        t(
          "account.displayNameRequired"
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
          "account.usernameInvalid"
        )
      );

      return;
    }


    setSaving(true);


    try {
      const {
        data:
          duplicate,

        error:
          duplicateError,
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
          .neq(
            "id",
            user.id
          )
          .maybeSingle();


      if (
        duplicateError
      ) {
        throw duplicateError;
      }


      if (
        duplicate
      ) {
        toast.error(
          t(
            "account.usernameTaken"
          )
        );

        return;
      }


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
              user.id,

            email:
              user.email,

            username,

            display_name:
              displayName,

            updated_at:
              new Date()
                .toISOString(),
          });


      if (
        profileError
      ) {
        throw profileError;
      }


      const {
        error:
          metadataError,
      } =
        await supabase.auth.updateUser({
          data: {
            username,

            display_name:
              displayName,
          },
        });


      if (
        metadataError
      ) {
        throw metadataError;
      }


      toast.success(
        t(
          "account.updated"
        )
      );


      await loadAccount();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "account.saveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <SkeletonCard className="h-40" />

        <SkeletonCard className="mt-5 h-[420px]" />
      </main>
    );
  }


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#090909] pb-32 text-white"
    >
      <PageHeader
        eyebrow={t(
          "account.eyebrow"
        )}
        title={t(
          "account.title"
        )}
        subtitle={t(
          "account.subtitle"
        )}
        action={
          <Button
            type="button"
            onClick={
              saveAccount
            }
            loading={
              saving
            }
            loadingText={t(
              "common.saving"
            )}
            disabled={
              !dirty
            }
          >
            <Save
              size={17}
            />

            {t(
              "common.save"
            )}
          </Button>
        }
      />


      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* BACK */}

        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 py-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
            className={
              dir === "rtl"
                ? "rotate-180"
                : ""
            }
          />

          {t(
            "account.backToWebsites"
          )}
        </Link>


        {/* OWNER CONSOLE */}

        {isOwner && (
          <Link
            to="/owner"
            className="mb-5 flex items-center justify-between gap-4 rounded-[24px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4 transition hover:bg-[#ff7a00]/15"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff7a00] text-black">
                <ShieldCheck
                  size={20}
                />
              </div>


              <div className="min-w-0">
                <p className="text-sm font-black text-[#ffbd7c]">
                  {t(
                    "account.ownerConsole"
                  )}
                </p>

                <p className="mt-1 text-xs font-bold leading-5 text-white/40">
                  {t(
                    "account.ownerConsoleHint"
                  )}
                </p>
              </div>
            </div>


            <span className="shrink-0 text-sm font-black text-[#ffbd7c]">
              {t(
                "account.open"
              )}
            </span>
          </Link>
        )}


        {/* PROFILE SUMMARY */}

        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[30px] border border-white/10 bg-white/[0.04] text-[#ff7a00]">
              <UserCircle2
                size={46}
              />
            </div>


            <div className="min-w-0">
              <h2 className="truncate text-3xl font-black tracking-[-0.05em]">
                {form.display_name ||
                  t(
                    "account.defaultName"
                  )}
              </h2>


              <p
                className="mt-2 flex items-center gap-2 truncate text-sm font-bold text-white/40"
                dir="ltr"
              >
                <Mail
                  size={16}
                />

                {form.email ||
                  t(
                    "account.noEmail"
                  )}
              </p>
            </div>
          </div>


          <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
            <Stat
              label={t(
                "account.userId"
              )}
              value={
                user?.id ||
                t(
                  "common.loading"
                )
              }
            />

            <Stat
              label={t(
                "account.username"
              )}
              value={
                form.username ||
                t(
                  "account.notSet"
                )
              }
            />
          </div>
        </Card>


        {/* PROFILE FORM */}

        <form
          onSubmit={
            saveAccount
          }
          className="mt-5 grid gap-5"
        >
          <Card className="p-5">
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              {t(
                "account.profileDetails"
              )}
            </h3>


            <p className="mt-1 text-sm font-bold leading-6 text-white/35">
              {t(
                "account.profileDetailsHint"
              )}
            </p>


            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label={t(
                  "account.displayName"
                )}
              >
                <Input
                  value={
                    form.display_name
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "display_name",
                      event.target.value
                    )
                  }
                  placeholder={t(
                    "account.displayNamePlaceholder"
                  )}
                />
              </Field>


              <Field
                label={t(
                  "account.username"
                )}
              >
                <Input
                  value={
                    form.username
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
                />
              </Field>


              <Field
                label={t(
                  "account.email"
                )}
                hint={t(
                  "account.emailHint"
                )}
              >
                <Input
                  value={
                    form.email
                  }
                  disabled
                  dir="ltr"
                />
              </Field>
            </div>
          </Card>


          {/* ACCOUNT STATUS */}

          <Card className="p-5">
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              {t(
                "account.status"
              )}
            </h3>


            <p className="mt-1 text-sm font-bold leading-6 text-white/35">
              {t(
                "account.statusHint"
              )}
            </p>


            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Stat
                label={t(
                  "account.authProvider"
                )}
                value={t(
                  "account.emailProvider"
                )}
              />

              <Stat
                label={t(
                  "account.accountType"
                )}
                value={
                  isOwner
                    ? t(
                        "account.platformAdmin"
                      )
                    : t(
                        "account.clientAccount"
                      )
                }
              />

              <Stat
                label={t(
                  "account.role"
                )}
                value={
                  isOwner
                    ? t(
                        "account.superAdmin"
                      )
                    : t(
                        "account.websiteOwner"
                      )
                }
              />
            </div>
          </Card>
        </form>
      </section>


      {/* SAVE BAR */}

      {dirty && (
        <div
          className={`fixed bottom-24 left-4 right-4 z-[80] rounded-[24px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl ${
            dir === "rtl"
              ? "md:right-[22rem]"
              : "md:left-[22rem]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white/70">
              {t(
                "account.unsaved"
              )}
            </p>


            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={
                  discard
                }
                disabled={
                  saving
                }
              >
                {t(
                  "common.discard"
                )}
              </Button>


              <Button
                type="button"
                onClick={
                  saveAccount
                }
                loading={
                  saving
                }
                loadingText={t(
                  "common.saving"
                )}
              >
                {t(
                  "project.saveChanges"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}