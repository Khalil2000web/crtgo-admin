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

import { supabase } from "../lib/supabase";
import {
  getPublicProjectUrl,
} from "../lib/urls";
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

async function loadProject(projectId) {
  const { data, error } =
    await supabase
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
      .eq("id", projectId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export default function ProjectAppearancePage() {
  const { projectId } =
    useParams();

  const queryClient =
    useQueryClient();

  const [saving, setSaving] =
    useState(false);

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
      loadProject(projectId),
    enabled: Boolean(projectId),
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
          project?.logo_url || "",
        favicon_url:
          project?.favicon_url ||
          "",
        cover_url:
          covers[0] || "",
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
    }, [project]);

  const form =
    localForm || initialForm;

  const dirty =
    JSON.stringify(form) !==
    JSON.stringify(initialForm);

  function updateField(
    key,
    value
  ) {
    setLocalForm(
      (current) => ({
        ...(current ||
          initialForm),
        [key]: value,
      })
    );
  }

  function discard() {
    setLocalForm(null);

    toast.success(
      "Changes discarded"
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
      const { error } =
        await supabase
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
        "Appearance saved"
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
          queryKey: ["projects"],
        }),
      ]);

      setLocalForm(null);
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to save appearance"
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
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
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
          {error?.message ||
            "Website not found"}
        </p>
      </main>
    );
  }

  const publicUrl =
    getPublicProjectUrl(
      project.slug
    );

  return (
    <main className="h-full overflow-y-auto bg-[#090909] pb-32 text-white">
      <PageHeader
        eyebrow="Website Settings"
        title="Appearance"
        subtitle="Customize the standard CRTGO website."
        action={
          <div className="flex gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70"
            >
              <ExternalLink
                size={17}
              />
              Preview
            </a>

            <Button
              onClick={save}
              loading={saving}
              disabled={!dirty}
            >
              <Save size={17} />
              Save
            </Button>
          </div>
        }
      />

      <ProjectTabs
        projectId={projectId}
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6">
        <Card className="p-5">
          <h2 className="text-2xl font-black">
            Images
          </h2>

          <p className="mt-1 text-sm font-bold text-white/40">
            These images are used by the standard CRTGO website.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <ImageUploadField
              label="Logo"
              value={form.logo_url}
              onChange={(url) =>
                updateField(
                  "logo_url",
                  url
                )
              }
              folder={`projects/${projectId}/logo`}
              hint="Business logo."
            />

            <ImageUploadField
              label="Cover image"
              value={form.cover_url}
              onChange={(url) =>
                updateField(
                  "cover_url",
                  url
                )
              }
              folder={`projects/${projectId}/cover`}
              hint="Main website cover image."
            />

            <ImageUploadField
              label="Favicon"
              value={
                form.favicon_url
              }
              onChange={(url) =>
                updateField(
                  "favicon_url",
                  url
                )
              }
              folder={`projects/${projectId}/favicon`}
              hint="Small browser/site icon."
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-2xl font-black">
            Colors
          </h2>

          <p className="mt-1 text-sm font-bold text-white/40">
            For now these are the only visual customizations clients need.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ColorField
              label="Primary color"
              value={
                form.primary_color
              }
              onChange={(value) =>
                updateField(
                  "primary_color",
                  value
                )
              }
            />

            <ColorField
              label="Background"
              value={
                form.background_color
              }
              onChange={(value) =>
                updateField(
                  "background_color",
                  value
                )
              }
            />

            <ColorField
              label="Text"
              value={
                form.text_color
              }
              onChange={(value) =>
                updateField(
                  "text_color",
                  value
                )
              }
            />
          </div>
        </Card>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-[80] rounded-[26px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl backdrop-blur-2xl lg:left-[19rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white/70">
              You have unsaved appearance changes.
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={discard}
                disabled={saving}
              >
                Discard
              </Button>

              <Button
                onClick={save}
                loading={saving}
              >
                Save Changes
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
    <Field label={label}>
      <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
        <Input
          type="color"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
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