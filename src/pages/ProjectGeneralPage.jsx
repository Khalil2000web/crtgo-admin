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

async function loadProject(projectId) {
  const { data, error } =
    await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

function emptyToNull(value) {
  const clean = String(
    value || ""
  ).trim();

  return clean || null;
}

function getInitialForm(project) {
  return {
    name: project?.name || "",
    slug: project?.slug || "",
    description:
      project?.description || "",
    location:
      project?.location || "",
    phone: project?.phone || "",
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
  const { projectId } =
    useParams();

  const navigate =
    useNavigate();

  const confirm =
    useConfirm();

  const queryClient =
    useQueryClient();

  const [form, setForm] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const [deleting, setDeleting] =
    useState(false);

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
      loadProject(projectId),
    enabled: Boolean(projectId),
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
        JSON.stringify(initialForm)
      );
    }, [form, initialForm]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setForm(
      getInitialForm(project)
    );
  }, [project?.id]);

  function updateField(
    key,
    value
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
        queryKey: ["projects"],
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
    ]);
  }

  async function saveChanges(e) {
    e.preventDefault();

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
      slugify(form.slug);

    if (!name) {
      toast.error(
        "Website name is required"
      );

      return;
    }

    if (!slug) {
      toast.error(
        "Hostname is required"
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data: duplicate,
        error:
          duplicateError,
      } = await supabase
        .from("projects")
        .select("id")
        .ilike("slug", slug)
        .neq("id", project.id)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (duplicate) {
        throw new Error(
          "Another website already uses this hostname."
        );
      }

      const { error } =
        await supabase
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
        "Website saved"
      );

      await refresh();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to save website"
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

    const ok = await confirm({
      title: willArchive
        ? "Archive website?"
        : "Restore website?",
      message: willArchive
        ? "This website will stop being publicly available."
        : "This website will become public again.",
      confirmText: willArchive
        ? "Archive website"
        : "Restore website",
      danger: willArchive,
    });

    if (!ok) {
      return;
    }

    setChangingStatus(true);

    try {
      const { error } =
        await supabase
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
          ? "Website archived"
          : "Website restored"
      );

      await refresh();
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to update website"
      );
    } finally {
      setChangingStatus(false);
    }
  }

  async function deleteProject() {
    const ok = await confirm({
      title:
        "Delete website forever?",
      message:
        "This deletes the website, every section, and every item inside it. This cannot be undone.",
      confirmText:
        "Delete forever",
      danger: true,
    });

    if (!ok) {
      return;
    }

    setDeleting(true);

    try {
      /*
       * sections.project_id uses ON DELETE CASCADE.
       * items.section_id also uses ON DELETE CASCADE.
       *
       * So deleting the project is enough.
       */
      const { error } =
        await supabase
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
        "Website deleted"
      );

      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to delete website"
      );
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
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
      <main className="h-full overflow-y-auto bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            "Website not found."}
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
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Website Settings"
        title={project.name}
        subtitle="Manage your website identity, hostname, contact information, and status."
        action={
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
          >
            <ExternalLink
              size={17}
            />

            Open Website
          </a>
        }
      />

      <ProjectTabs
        projectId={projectId}
      />

      <form
        onSubmit={saveChanges}
        className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to websites
        </Link>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              General
            </h2>

            <p className="mt-1 text-sm font-bold text-white/35">
              Everything here belongs directly to this website.
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
                ? "Archived"
                : "Active"}
            </Badge>

            {isFetching && (
              <Badge tone="neutral">
                <Loader2
                  size={13}
                  className="animate-spin"
                />
                Syncing
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-w-0 gap-5">
            <Card className="p-5">
              <h3 className="text-xl font-black">
                Website identity
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Website name">
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      updateField(
                        "name",
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Hostname">
                  <Input
                    value={
                      form.slug
                    }
                    onChange={(e) =>
                      updateField(
                        "slug",
                        e.target.value
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
                  Public URL
                </p>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm font-black text-[#ff7a00]"
                  dir="ltr"
                >
                  {publicUrl}
                </a>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xl font-black">
                Website information
              </h3>

              <div className="mt-5 grid gap-4">
                <Field label="Description">
                  <Textarea
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Location">
                  <Input
                    value={
                      form.location
                    }
                    onChange={(e) =>
                      updateField(
                        "location",
                        e.target.value
                      )
                    }
                    placeholder="Haifa, Israel"
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xl font-black">
                Contact & Social
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <Input
                    value={
                      form.phone
                    }
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
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
                    onChange={(e) =>
                      updateField(
                        "whatsapp",
                        e.target.value
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
                    onChange={(e) =>
                      updateField(
                        "instagram",
                        e.target.value
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
                    onChange={(e) =>
                      updateField(
                        "facebook",
                        e.target.value
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
                    onChange={(e) =>
                      updateField(
                        "tiktok",
                        e.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>
              </div>
            </Card>
          </section>

          <aside className="grid h-fit gap-5 xl:sticky xl:top-6">
            <Card className="p-5">
              <h3 className="text-xl font-black">
                Website Status
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
                    ? "Restore Website"
                    : "Archive Website"}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xl font-black">
                Save
              </h3>

              <Button
                type="submit"
                className="mt-5 w-full"
                loading={saving}
                loadingText="Saving..."
                disabled={!dirty}
              >
                <Save size={16} />
                Save Changes
              </Button>
            </Card>

            <Card className="border-red-400/15 bg-red-500/5 p-5">
              <h3 className="text-xl font-black text-red-200">
                Danger Zone
              </h3>

              <p className="mt-2 text-sm font-bold leading-6 text-red-100/45">
                Deleting this website also deletes all sections and items.
              </p>

              <Button
                type="button"
                variant="danger"
                className="mt-5 w-full"
                loading={deleting}
                onClick={
                  deleteProject
                }
              >
                <Trash2 size={16} />
                Delete Website
              </Button>
            </Card>
          </aside>
        </div>

        {dirty && (
          <div className="fixed bottom-4 left-4 right-4 z-[80] rounded-[26px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:left-[19rem]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white/70">
                You have unsaved changes.
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
                  disabled={saving}
                >
                  Discard
                </Button>

                <Button
                  type="submit"
                  loading={saving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}