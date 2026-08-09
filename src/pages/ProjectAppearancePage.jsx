import {
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ExternalLink,
  Save,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  getPublicProjectUrl,
} from "../lib/urls";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import ProjectTabs from "../components/ProjectTabs";
import ImageUploadField from "../components/ImageUploadField";

import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
} from "../components/ui";


async function loadProject(
  projectId
) {
  const {
    data,
    error,
  } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      slug,
      status,
      logo_url,
      favicon_url,
      cover_images,
      primary_color,
      background_color,
      text_color
    `)
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


export default function ProjectAppearancePage() {
  const {
    projectId,
  } = useParams();

  const {
    t,
    dir,
  } = useAdminI18n();

  const queryClient =
    useQueryClient();

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    localForm,
    setLocalForm,
  ] = useState(null);


  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "project-appearance",
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
      const covers =
        Array.isArray(
          project?.cover_images
        )
          ? project.cover_images
          : [];

      return {
        logo_url:
          project?.logo_url ||
          "",

        favicon_url:
          project?.favicon_url ||
          "",

        cover_url:
          covers[0] ||
          "",

        primary_color:
          project?.primary_color ||
          "#000000",

        background_color:
          project?.background_color ||
          "#ffffff",

        text_color:
          project?.text_color ||
          "#000000",
      };
    }, [
      project,
    ]);


  const form =
    localForm ||
    initialForm;


  const dirty =
    JSON.stringify(form) !==
    JSON.stringify(
      initialForm
    );


  function updateField(
    key,
    value
  ) {
    setLocalForm(
      (current) => ({
        ...(current ||
          initialForm),

        [key]:
          value,
      })
    );
  }


  function discard() {
    setLocalForm(
      null
    );

    toast.success(
      t(
        "common.changesDiscarded"
      )
    );
  }


  async function save() {
    if (
      !dirty ||
      !project
    ) {
      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase
        .from("projects")
        .update({
          logo_url:
            form.logo_url.trim() ||
            null,

          favicon_url:
            form.favicon_url.trim() ||
            null,

          cover_images:
            form.cover_url.trim()
              ? [
                  form.cover_url.trim(),
                ]
              : [],

          primary_color:
            form.primary_color,

          background_color:
            form.background_color,

          text_color:
            form.text_color,
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
          "appearance.saved"
        )
      );


      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "project-appearance",
            projectId,
          ],
        }),

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
      ]);


      setLocalForm(
        null
      );
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "appearance.saveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  if (isLoading) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <SkeletonCard className="h-40" />

        <SkeletonCard className="mt-5 h-[620px]" />
      </main>
    );
  }


  if (
    error ||
    !project
  ) {
    return (
      <main
        dir={dir}
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
          {error?.message ||
            t(
              "project.notFound"
            )}
        </p>
      </main>
    );
  }


  const publicUrl =
    getPublicProjectUrl(
      project.slug
    );


  return (
    <main
      dir={dir}
      className="h-full overflow-y-auto bg-[#090909] pb-32 text-white"
    >
      <PageHeader
        eyebrow={t(
          "project.websiteSettings"
        )}
        title={t(
          "appearance.title"
        )}
        subtitle={t(
          "appearance.subtitle"
        )}
        action={
          <div className="flex gap-2">
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
                "appearance.preview"
              )}
            </a>


            <Button
              onClick={save}
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
          </div>
        }
      />


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6">

        {/* IMAGES */}

        <Card className="p-5">
          <h2 className="text-2xl font-black">
            {t(
              "appearance.images"
            )}
          </h2>


          <p className="mt-1 text-sm font-bold text-white/40">
            {t(
              "appearance.imagesHint"
            )}
          </p>


          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <ImageUploadField
              label={t(
                "appearance.logo"
              )}
              value={
                form.logo_url
              }
              onChange={(
                url
              ) =>
                updateField(
                  "logo_url",
                  url
                )
              }
              folder={`projects/${projectId}/logo`}
              hint={t(
                "appearance.logoHint"
              )}
            />


            <ImageUploadField
              label={t(
                "appearance.coverImage"
              )}
              value={
                form.cover_url
              }
              onChange={(
                url
              ) =>
                updateField(
                  "cover_url",
                  url
                )
              }
              folder={`projects/${projectId}/cover`}
              hint={t(
                "appearance.coverHint"
              )}
            />


            <ImageUploadField
              label={t(
                "appearance.favicon"
              )}
              value={
                form.favicon_url
              }
              onChange={(
                url
              ) =>
                updateField(
                  "favicon_url",
                  url
                )
              }
              folder={`projects/${projectId}/favicon`}
              hint={t(
                "appearance.faviconHint"
              )}
            />
          </div>
        </Card>


        {/* COLORS */}

        <Card className="p-5">
          <h2 className="text-2xl font-black">
            {t(
              "appearance.colors"
            )}
          </h2>


          <p className="mt-1 text-sm font-bold text-white/40">
            {t(
              "appearance.colorsHint"
            )}
          </p>


          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ColorField
              label={t(
                "appearance.primaryColor"
              )}
              value={
                form.primary_color
              }
              onChange={(
                value
              ) =>
                updateField(
                  "primary_color",
                  value
                )
              }
            />


            <ColorField
              label={t(
                "appearance.backgroundColor"
              )}
              value={
                form.background_color
              }
              onChange={(
                value
              ) =>
                updateField(
                  "background_color",
                  value
                )
              }
            />


            <ColorField
              label={t(
                "appearance.textColor"
              )}
              value={
                form.text_color
              }
              onChange={(
                value
              ) =>
                updateField(
                  "text_color",
                  value
                )
              }
            />
          </div>
        </Card>
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
                "appearance.unsaved"
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
                  save
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


function ColorField({
  label,
  value,
  onChange,
}) {
  return (
    <Field
      label={
        label
      }
    >
      <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
        <Input
          type="color"
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className="h-14 cursor-pointer p-1"
        />


        <p
          className="mt-3 text-sm font-black text-white/70"
          dir="ltr"
        >
          {value}
        </p>
      </div>
    </Field>
  );
}