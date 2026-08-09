import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Archive,
  ArrowLeft,
  ExternalLink,
  LinkIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import toast from "react-hot-toast";

import ProjectTabs from "../components/ProjectTabs";
import { useConfirm } from "../components/ConfirmProvider";
import { useAdminI18n } from "../lib/adminI18n";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";

import {
  getPublicProjectUrl,
} from "../lib/urls";

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
  Textarea,
} from "../components/ui";


async function loadProject(
  projectId
) {
  const {
    data,
    error,
  } = await supabase
    .from("projects")
    .select("*")
    .eq(
      "id",
      projectId
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}


function emptyToNull(
  value
) {
  const clean =
    String(
      value || ""
    ).trim();

  return clean || null;
}


function getInitialForm(
  project
) {
  return {
    name:
      project?.name || "",

    slug:
      project?.slug || "",

    description:
      project?.description ||
      "",

    location:
      project?.location || "",

    phone:
      project?.phone || "",

    whatsapp:
      project?.whatsapp || "",

    instagram:
      project?.instagram || "",

    facebook:
      project?.facebook || "",

    tiktok:
      project?.tiktok || "",
  };
}


export default function ProjectGeneralPage() {
  const {
    projectId,
  } = useParams();

  const navigate =
    useNavigate();

  const confirm =
    useConfirm();

  const {
    t,
    dir,
  } = useAdminI18n();

  const queryClient =
    useQueryClient();

  const [
    form,
    setForm,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);


  const {
    data: project,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      "project",
      projectId,
    ],

    queryFn: () =>
      loadProject(
        projectId
      ),

    enabled:
      Boolean(projectId),
  });


  const initialForm =
    useMemo(() => {
      if (!project) {
        return null;
      }

      return getInitialForm(
        project
      );
    }, [project]);


  const dirty =
    useMemo(() => {
      if (
        !form ||
        !initialForm
      ) {
        return false;
      }

      return (
        JSON.stringify(form) !==
        JSON.stringify(
          initialForm
        )
      );
    }, [
      form,
      initialForm,
    ]);


  useEffect(() => {
    if (!project) {
      return;
    }

    setForm(
      getInitialForm(
        project
      )
    );
  }, [
    project?.id,
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


  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "project",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "projects",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-menu",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-appearance",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-languages",
          projectId,
        ],
      }),
    ]);
  }


  async function saveChanges(
    event
  ) {
    event.preventDefault();

    if (
      !project ||
      !form ||
      !dirty
    ) {
      return;
    }

    const name =
      form.name.trim();

    const slug =
      slugify(
        form.slug
      );


    if (!name) {
      toast.error(
        t(
          "general.nameRequired"
        )
      );

      return;
    }


    if (!slug) {
      toast.error(
        t(
          "general.hostnameRequired"
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
      } = await supabase
        .from("projects")
        .select("id")
        .ilike(
          "slug",
          slug
        )
        .neq(
          "id",
          project.id
        )
        .maybeSingle();


      if (
        duplicateError
      ) {
        throw duplicateError;
      }


      if (duplicate) {
        toast.error(
          t(
            "general.hostnameTaken"
          )
        );

        return;
      }


      const {
        error,
      } = await supabase
        .from("projects")
        .update({
          name,
          slug,

          description:
            emptyToNull(
              form.description
            ),

          location:
            emptyToNull(
              form.location
            ),

          phone:
            emptyToNull(
              form.phone
            ),

          whatsapp:
            emptyToNull(
              form.whatsapp
            ),

          instagram:
            emptyToNull(
              form.instagram
            ),

          facebook:
            emptyToNull(
              form.facebook
            ),

          tiktok:
            emptyToNull(
              form.tiktok
            ),
        })
        .eq(
          "id",
          project.id
        );


      if (error) {
        throw error;
      }


      toast.success(
        t(
          "general.saved"
        )
      );

      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "general.saveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  async function archiveOrRestore() {
    if (!project) {
      return;
    }

    const willArchive =
      project.status !==
      "archived";


    const ok =
      await confirm({
        title:
          willArchive
            ? t(
                "general.archiveTitle"
              )
            : t(
                "general.restoreTitle"
              ),

        message:
          willArchive
            ? t(
                "general.archiveMessage"
              )
            : t(
                "general.restoreMessage"
              ),

        confirmText:
          willArchive
            ? t(
                "general.archiveWebsite"
              )
            : t(
                "general.restoreWebsite"
              ),

        danger:
          willArchive,
      });


    if (!ok) {
      return;
    }


    setChangingStatus(
      true
    );

    try {
      const {
        error,
      } = await supabase
        .from("projects")
        .update({
          status:
            willArchive
              ? "archived"
              : "active",
        })
        .eq(
          "id",
          project.id
        );


      if (error) {
        throw error;
      }


      toast.success(
        willArchive
          ? t(
              "general.archivedSuccess"
            )
          : t(
              "general.restoredSuccess"
            )
      );

      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "general.statusFailed"
          )
      );
    } finally {
      setChangingStatus(
        false
      );
    }
  }


  async function deleteProject() {
    if (!project) {
      return;
    }


    const ok =
      await confirm({
        title:
          t(
            "general.deleteTitle"
          ),

        message:
          t(
            "general.deleteMessage"
          ),

        confirmText:
          t(
            "general.deleteForever"
          ),

        danger:
          true,
      });


    if (!ok) {
      return;
    }


    setDeleting(true);

    try {
      const {
        error,
      } = await supabase
        .from("projects")
        .delete()
        .eq(
          "id",
          project.id
        );


      if (error) {
        throw error;
      }


      toast.success(
        t(
          "general.deletedSuccess"
        )
      );


      queryClient.invalidateQueries({
        queryKey: [
          "projects",
        ],
      });


      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "general.deleteFailed"
          )
      );
    } finally {
      setDeleting(false);
    }
  }


  if (isLoading) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <SkeletonCard className="h-40" />

        <SkeletonCard className="mt-5 h-[600px]" />
      </main>
    );
  }


  if (
    error ||
    !project ||
    !form
  ) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            t(
              "project.notFound"
            )}
        </p>
      </main>
    );
  }


  const archived =
    project.status ===
    "archived";


  const publicUrl =
    getPublicProjectUrl(
      form.slug
    );


  return (
    <main
      dir={dir}
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white"
    >
      <PageHeader
        eyebrow={t(
          "project.websiteSettings"
        )}
        title={
          project.name
        }
        subtitle={t(
          "general.subtitle"
        )}
        action={
          <a
            href={
              publicUrl
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
          >
            <ExternalLink
              size={17}
            />

            {t(
              "general.openWebsite"
            )}
          </a>
        }
      />


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <form
        onSubmit={
          saveChanges
        }
        className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2 text-sm font-black text-white/45 transition hover:text-white"
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
            "general.backToWebsites"
          )}
        </Link>


        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              {t(
                "project.general"
              )}
            </h2>

            <p className="mt-1 text-sm font-bold text-white/35">
              {t(
                "general.generalHint"
              )}
            </p>
          </div>


          <div className="flex gap-2">
            <Badge
              tone={
                archived
                  ? "warning"
                  : "success"
              }
            >
              {archived
                ? t(
                    "common.archived"
                  )
                : t(
                    "common.active"
                  )}
            </Badge>


            {isFetching && (
              <Badge tone="neutral">
                <Loader2
                  size={13}
                  className="animate-spin"
                />

                {t(
                  "common.syncing"
                )}
              </Badge>
            )}
          </div>
        </div>


        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-w-0 gap-5">

            {/* WEBSITE IDENTITY */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "general.identity"
                )}
              </h3>


              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label={t(
                    "project.websiteName"
                  )}
                >
                  <Input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                  />
                </Field>


                <Field
                  label={t(
                    "project.hostname"
                  )}
                >
                  <Input
                    value={
                      form.slug
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "slug",
                        event.target.value
                      )
                    }
                    onBlur={() =>
                      updateField(
                        "slug",
                        slugify(
                          form.slug
                        )
                      )
                    }
                    dir="ltr"
                  />
                </Field>
              </div>


              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  <LinkIcon
                    size={14}
                  />

                  {t(
                    "general.publicUrl"
                  )}
                </p>


                <a
                  href={
                    publicUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm font-black text-[#ff7a00]"
                  dir="ltr"
                >
                  {
                    publicUrl
                  }
                </a>
              </div>
            </Card>


            {/* WEBSITE INFORMATION */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "general.information"
                )}
              </h3>


              <div className="mt-5 grid gap-4">
                <Field
                  label={t(
                    "project.description"
                  )}
                >
                  <Textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                  />
                </Field>


                <Field
                  label={t(
                    "project.location"
                  )}
                >
                  <Input
                    value={
                      form.location
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder={t(
                      "general.locationPlaceholder"
                    )}
                  />
                </Field>
              </div>
            </Card>


            {/* CONTACT */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "project.contactSocial"
                )}
              </h3>


              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label={t(
                    "general.phone"
                  )}
                >
                  <Input
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="WhatsApp">
                  <Input
                    value={
                      form.whatsapp
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "whatsapp",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="Instagram">
                  <Input
                    value={
                      form.instagram
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "instagram",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="Facebook">
                  <Input
                    value={
                      form.facebook
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "facebook",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="TikTok">
                  <Input
                    value={
                      form.tiktok
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "tiktok",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>
              </div>
            </Card>
          </section>


          {/* RIGHT SIDEBAR */}

          <aside className="grid h-fit gap-5 xl:sticky xl:top-6">

            {/* STATUS */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "project.websiteStatus"
                )}
              </h3>


              <div className="mt-5 grid gap-3">
                <Button
                  type="button"
                  variant={
                    archived
                      ? "secondary"
                      : "danger"
                  }
                  loading={
                    changingStatus
                  }
                  onClick={
                    archiveOrRestore
                  }
                >
                  {archived ? (
                    <RotateCcw
                      size={16}
                    />
                  ) : (
                    <Archive
                      size={16}
                    />
                  )}

                  {archived
                    ? t(
                        "general.restoreWebsite"
                      )
                    : t(
                        "general.archiveWebsite"
                      )}
                </Button>
              </div>
            </Card>


            {/* SAVE */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "common.save"
                )}
              </h3>


              <Button
                type="submit"
                className="mt-5 w-full"
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
                  size={16}
                />

                {t(
                  "project.saveChanges"
                )}
              </Button>
            </Card>


            {/* DANGER */}

            <Card className="border-red-400/15 bg-red-500/5 p-5">
              <h3 className="text-xl font-black text-red-200">
                {t(
                  "general.dangerZone"
                )}
              </h3>


              <p className="mt-2 text-sm font-bold leading-6 text-red-100/45">
                {t(
                  "general.dangerHint"
                )}
              </p>


              <Button
                type="button"
                variant="danger"
                className="mt-5 w-full"
                loading={
                  deleting
                }
                onClick={
                  deleteProject
                }
              >
                <Trash2
                  size={16}
                />

                {t(
                  "general.deleteWebsite"
                )}
              </Button>
            </Card>
          </aside>
        </div>


        {/* SAVE BAR */}

        {dirty && (
          <div
            className={`fixed bottom-24 left-4 right-4 z-[80] rounded-[24px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl ${
              dir === "rtl"
                ? "lg:right-[19rem]"
                : "lg:left-[19rem]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white/70">
                {t(
                  "project.unsaved"
                )}
              </p>


              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setForm(
                      initialForm
                    )
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
                  type="submit"
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
      </form>
    </main>
  );
}