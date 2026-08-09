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
  Save,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  supabase,
} from "../lib/supabase";

import {
  useAdminI18n,
} from "../lib/adminI18n";

import ProjectTabs from "../components/ProjectTabs";

import WorkingHoursEditor, {
  getDefaultWorkingHours,
} from "../components/WorkingHoursEditor";

import {
  Button,
  Card,
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
      status,
      working_hours
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


export default function ProjectWorkingHoursPage() {
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
    localHours,
    setLocalHours,
  ] = useState(null);


  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "project-hours",
      projectId,
    ],

    queryFn: () =>
      loadProject(
        projectId
      ),

    enabled:
      Boolean(projectId),
  });


  const initialHours =
    useMemo(
      () => ({
        ...getDefaultWorkingHours(),

        ...(project?.working_hours ||
          {}),
      }),
      [
        project,
      ]
    );


  const hours =
    localHours ||
    initialHours;


  const dirty =
    JSON.stringify(hours) !==
    JSON.stringify(
      initialHours
    );


  async function save() {
    if (!dirty) {
      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase
        .from("projects")
        .update({
          working_hours:
            hours,
        })
        .eq(
          "id",
          projectId
        );

      if (error) {
        throw error;
      }

      toast.success(
        t(
          "workingHours.saved"
        )
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "project-hours",
            projectId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "project",
            projectId,
          ],
        }),
      ]);

      setLocalHours(
        null
      );
    } catch (err) {
      toast.error(
        err?.message ||
          t(
            "workingHours.saveFailed"
          )
      );
    } finally {
      setSaving(false);
    }
  }


  function discardChanges() {
    setLocalHours(
      null
    );

    toast.success(
      t(
        "common.changesDiscarded"
      )
    );
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
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            t(
              "project.notFound"
            )}
        </p>
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
          "project.websiteSettings"
        )}
        title={t(
          "workingHours.title"
        )}
        subtitle={t(
          "workingHours.subtitle",
          {
            name:
              project.name,
          }
        )}
        action={
          <Button
            onClick={save}
            loading={saving}
            loadingText={t(
              "common.saving"
            )}
            disabled={!dirty}
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


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-xl font-black">
              {t(
                "workingHours.schedule"
              )}
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
              {t(
                "workingHours.scheduleHint"
              )}
            </p>
          </div>


          <WorkingHoursEditor
            value={hours}
            onChange={
              setLocalHours
            }
          />
        </Card>
      </section>


      {dirty && (
        <div className="fixed bottom-24 left-4 right-4 z-[80] rounded-[24px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:left-[22rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white/70">
              {t(
                "workingHours.unsaved"
              )}
            </p>


            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={
                  discardChanges
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
                onClick={save}
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