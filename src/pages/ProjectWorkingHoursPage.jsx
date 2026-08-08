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

import { supabase } from "../lib/supabase";
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

async function loadProject(projectId) {
  const { data, error } =
    await supabase
      .from("projects")
      .select(`
        id,
        name,
        status,
        working_hours
      `)
      .eq("id", projectId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export default function ProjectWorkingHoursPage() {
  const { projectId } =
    useParams();

  const queryClient =
    useQueryClient();

  const [saving, setSaving] =
    useState(false);

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
      loadProject(projectId),
    enabled: Boolean(projectId),
  });

  const initialHours =
    useMemo(() => ({
      ...getDefaultWorkingHours(),
      ...(project?.working_hours ||
        {}),
    }), [project]);

  const hours =
    localHours || initialHours;

  const dirty =
    JSON.stringify(hours) !==
    JSON.stringify(initialHours);

  async function save() {
    if (!dirty) {
      return;
    }

    setSaving(true);

    try {
      const { error } =
        await supabase
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
        "Working hours saved"
      );

      await queryClient.invalidateQueries({
        queryKey: [
          "project-hours",
          projectId,
        ],
      });

      setLocalHours(null);
    } catch (err) {
      toast.error(
        err.message ||
          "Failed to save working hours"
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

  return (
    <main className="h-full overflow-y-auto bg-[#090909] pb-32 text-white">
      <PageHeader
        eyebrow="Website Settings"
        title="Working Hours"
        subtitle={`Set opening times for ${project.name}.`}
        action={
          <Button
            onClick={save}
            loading={saving}
            disabled={!dirty}
          >
            <Save size={17} />
            Save
          </Button>
        }
      />

      <ProjectTabs
        projectId={projectId}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Card className="p-5">
          <WorkingHoursEditor
            value={hours}
            onChange={
              setLocalHours
            }
          />
        </Card>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-[80] rounded-[26px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl backdrop-blur-2xl lg:left-[19rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white/70">
              You have unsaved working-hours changes.
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setLocalHours(
                    initialHours
                  )
                }
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