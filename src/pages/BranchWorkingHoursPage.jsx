import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import PlanLimitNotice from "../components/PlanLimitNotice";
import WorkingHoursEditor, {
  getDefaultWorkingHours,
} from "../components/WorkingHoursEditor";
import { Button, Card, PageHeader, SkeletonCard } from "../components/ui";

import { useBusinessBilling } from "../hooks/useBusinessBilling";
import { getLimitMessage, isSubscriptionLocked } from "../lib/billing";

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      status,
      working_hours,
      business_id,
      businesses (
        id,
        name
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

export default function BranchWorkingHoursPage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [localHours, setLocalHours] = useState(null);

  const {
    data: branch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-hours", branchId],
    queryFn: () => loadBranch(branchId),
    enabled: Boolean(branchId),
  });

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const initialHours = useMemo(() => {
    return {
      ...getDefaultWorkingHours(),
      ...(branch?.working_hours || {}),
    };
  }, [branch]);

  const hours = localHours || initialHours;
  const dirty = JSON.stringify(hours) !== JSON.stringify(initialHours);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));

  const locked =
    archived || billingLoading || Boolean(billingError) || subscriptionLocked;

  const lockMessage = archived
    ? "Restore this branch before editing working hours."
    : billingLoading
      ? "Billing is still loading. Try again in a second."
      : billingError
        ? billingError.message
        : subscriptionLocked
          ? getLimitMessage("locked", billing)
          : "";

  function setHoursSafely(next) {
    if (locked) {
      toast.error(lockMessage || "Working hours are locked.");
      return;
    }

    setLocalHours(next);
  }

  function closeAll() {
    if (locked) {
      toast.error(lockMessage || "Working hours are locked.");
      return;
    }

    const next = {};

    Object.keys(getDefaultWorkingHours()).forEach((key) => {
      next[key] = {
        ...hours[key],
        open: false,
      };
    });

    setLocalHours(next);
  }

  function openAll() {
    if (locked) {
      toast.error(lockMessage || "Working hours are locked.");
      return;
    }

    const next = {};

    Object.keys(getDefaultWorkingHours()).forEach((key) => {
      next[key] = {
        open: true,
        from: hours[key]?.from || "09:00",
        to: hours[key]?.to || "22:00",
      };
    });

    setLocalHours(next);
  }

  function discard() {
    setLocalHours(initialHours);
    toast.success("Changes discarded");
  }

  async function save() {
    if (!dirty) return;

    if (locked) {
      toast.error(lockMessage || "Working hours are locked.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("branches")
        .update({
          working_hours: hours,
        })
        .eq("id", branchId);

      if (error) throw error;

      toast.success("Working hours saved");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["branch-hours", branchId] }),
        queryClient.invalidateQueries({ queryKey: ["branch-menu", branchId] }),
        queryClient.invalidateQueries({
          queryKey: ["branch-general", branchId],
        }),
      ]);

      setLocalHours(null);
    } catch (err) {
      toast.error(err.message || "Failed to save working hours");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[620px]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error.message}
        </p>
      </main>
    );
  }

  if (!branch) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          Branch not found.
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="Working Hours"
        subtitle={`Set opening times for ${branch.name}.`}
        action={
          <div className="flex gap-2">
            <Button
              loading={saving}
              loadingText="Saving..."
              disabled={!dirty || locked}
              onClick={save}
            >
              <Save size={17} />
              Save
            </Button>
          </div>
        }
      />

      <BranchTabs branchId={branchId} />

      {locked && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <PlanLimitNotice title="Working hours locked" text={lockMessage} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={openAll} disabled={locked}>
            Open all
          </Button>

          <Button variant="secondary" onClick={closeAll} disabled={locked}>
            Close all
          </Button>
        </div>

        <Card className={`p-5 ${locked ? "opacity-60" : ""}`}>
          <WorkingHoursEditor
  value={hours}
  onChange={setHoursSafely}
  disabled={locked}
  disabledReason={lockMessage}
/>
        </Card>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:left-[19rem]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved working hours changes
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={discard} disabled={saving}>
                Discard
              </Button>

              <Button
                onClick={save}
                loading={saving}
                loadingText="Saving..."
                disabled={locked}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}