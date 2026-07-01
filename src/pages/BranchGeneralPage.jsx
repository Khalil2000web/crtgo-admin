import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import { useConfirm } from "../components/ConfirmProvider";
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

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      slug,
      address,
      phone,
      whatsapp,
      instagram,
      facebook,
      tiktok,
      status,
      business_id,
      businesses (
        id,
        name,
        slug
      ),
      menu_versions (
        id,
        name,
        status,
        description_ar
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

export default function BranchGeneralPage() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localForm, setLocalForm] = useState(null);

  const {
    data: branch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-general", branchId],
    queryFn: () => loadBranch(branchId),
  });

  const menu = useMemo(() => {
    return (
      branch?.menu_versions?.find((item) => item.status === "active") ||
      branch?.menu_versions?.[0] ||
      null
    );
  }, [branch]);

  const initialForm = useMemo(() => {
    return {
      branch_name: branch?.name || "",
      menu_name: menu?.name || "Main Menu",
      description_ar: menu?.description_ar || "",
      address: branch?.address || "",
      phone: branch?.phone || "",
      whatsapp: branch?.whatsapp || "",
      instagram: branch?.instagram || "",
      facebook: branch?.facebook || "",
      tiktok: branch?.tiktok || "",
    };
  }, [branch, menu]);

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const archived = branch?.status === "archived";

  function updateField(key, value) {
    setLocalForm((current) => ({
      ...(current || initialForm),
      [key]: value,
    }));
  }

  function discard() {
    setLocalForm(initialForm);
    toast.success("Changes discarded");
  }

  async function save() {
    if (!dirty || !branch || !menu) return;

    setSaving(true);

    try {
      const { error: menuError } = await supabase
        .from("menu_versions")
        .update({
          name: form.menu_name.trim() || "Main Menu",
          description_ar: form.description_ar.trim() || null,
        })
        .eq("id", menu.id);

      if (menuError) throw menuError;

      const { error: branchError } = await supabase
        .from("branches")
        .update({
          name: form.branch_name.trim() || branch.name,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          facebook: form.facebook.trim() || null,
          tiktok: form.tiktok.trim() || null,
        })
        .eq("id", branch.id);

      if (branchError) throw branchError;

      toast.success("General info saved");

      await queryClient.invalidateQueries({
        queryKey: ["branch-general", branchId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["branch-menu", branchId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["business", branch.business_id],
      });

      setLocalForm(null);
    } catch (err) {
      toast.error(err.message || "Failed to save general info");
    } finally {
      setSaving(false);
    }
  }

  async function archiveOrRestore() {
    const nextStatus = archived ? "active" : "archived";

    const ok = await confirm({
      title: archived ? "Restore branch?" : "Archive branch?",
      message: archived
        ? "This branch will become active again."
        : "This branch will be archived. You can restore it later.",
      confirmText: archived ? "Restore branch" : "Archive branch",
      danger: !archived,
    });

    if (!ok) return;

    setArchiving(true);

    try {
      const { error } = await supabase
        .from("branches")
        .update({ status: nextStatus })
        .eq("id", branch.id);

      if (error) throw error;

      toast.success(archived ? "Branch restored" : "Branch archived");

      await queryClient.invalidateQueries({
        queryKey: ["branch-general", branchId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["business", branch.business_id],
      });
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
    } catch (err) {
      toast.error(err.message || "Failed to update branch status");
    } finally {
      setArchiving(false);
    }
  }

  async function deleteBranch() {
    const ok = await confirm({
      title: "Delete branch permanently?",
      message:
        "This will delete the branch, its menus, sections, and items. This cannot be undone.",
      confirmText: "Delete branch",
      danger: true,
    });

    if (!ok) return;

    setDeleting(true);

    try {
      const { data: menus, error: menusError } = await supabase
        .from("menu_versions")
        .select("id")
        .eq("branch_id", branch.id);

      if (menusError) throw menusError;

      const menuIds = (menus || []).map((item) => item.id);

      if (menuIds.length) {
        const { data: sections, error: sectionsError } = await supabase
          .from("sections")
          .select("id")
          .in("menu_version_id", menuIds);

        if (sectionsError) throw sectionsError;

        const sectionIds = (sections || []).map((item) => item.id);

        if (sectionIds.length) {
          const { error: itemsError } = await supabase
            .from("items")
            .delete()
            .in("section_id", sectionIds);

          if (itemsError) throw itemsError;
        }

        const { error: deleteSectionsError } = await supabase
          .from("sections")
          .delete()
          .in("menu_version_id", menuIds);

        if (deleteSectionsError) throw deleteSectionsError;

        const { error: deleteMenusError } = await supabase
          .from("menu_versions")
          .delete()
          .eq("branch_id", branch.id);

        if (deleteMenusError) throw deleteMenusError;
      }

      const { error: branchError } = await supabase
        .from("branches")
        .delete()
        .eq("id", branch.id);

      if (branchError) throw branchError;

      toast.success("Branch deleted");

      await queryClient.invalidateQueries({
        queryKey: ["business", branch.business_id],
      });
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });

      navigate(`/business/${branch.business_id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to delete branch");
    } finally {
      setDeleting(false);
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

  if (error || !branch || !menu) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Branch not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="General"
        subtitle={`Manage the main info and social links for ${branch.name}.`}
        action={
          <Button
            type="button"
            loading={saving}
            loadingText="Saving..."
            disabled={!dirty}
            onClick={save}
          >
            <Save size={17} />
            Save
          </Button>
        }
      />

      <BranchTabs branchId={branchId} />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="mt-5 grid gap-5">
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  General info
                </h2>

                <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                  This controls the branch name, menu name, and public menu description.
                </p>
              </div>

              <Badge tone={archived ? "warning" : "success"}>
                {archived ? "Archived" : "Active"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Branch name">
                <Input
                  value={form.branch_name}
                  onChange={(e) => updateField("branch_name", e.target.value)}
                  placeholder="Main Branch"
                />
              </Field>

              <Field label="Menu name">
                <Input
                  value={form.menu_name}
                  onChange={(e) => updateField("menu_name", e.target.value)}
                  placeholder="Main Menu"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Arabic menu description">
                <Textarea
                  value={form.description_ar}
                  onChange={(e) =>
                    updateField("description_ar", e.target.value)
                  }
                  placeholder="وصف قصير للقائمة"
                  dir="rtl"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-2xl font-black tracking-[-0.04em]">
              Contact & social
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
              These links and numbers can appear on the public menu.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Address">
                <Input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Street, city..."
                />
              </Field>

              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="0500000000"
                  dir="ltr"
                />
              </Field>

              <Field label="WhatsApp">
                <Input
                  value={form.whatsapp}
                  onChange={(e) => updateField("whatsapp", e.target.value)}
                  placeholder="972500000000"
                  dir="ltr"
                />
              </Field>

              <Field label="Instagram">
                <Input
                  value={form.instagram}
                  onChange={(e) => updateField("instagram", e.target.value)}
                  placeholder="@restaurant"
                  dir="ltr"
                />
              </Field>

              <Field label="Facebook">
                <Input
                  value={form.facebook}
                  onChange={(e) => updateField("facebook", e.target.value)}
                  placeholder="https://facebook.com/..."
                  dir="ltr"
                />
              </Field>

              <Field label="TikTok">
                <Input
                  value={form.tiktok}
                  onChange={(e) => updateField("tiktok", e.target.value)}
                  placeholder="@restaurant"
                  dir="ltr"
                />
              </Field>
            </div>
          </Card>

          <Card className="border-red-400/15 bg-red-500/[0.04] p-5">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-red-100">
              Danger zone
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-red-100/45">
              These actions affect this branch only. Archive is reversible. Delete is permanent.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                loading={archiving}
                loadingText={archived ? "Restoring..." : "Archiving..."}
                onClick={archiveOrRestore}
              >
                {archived ? <RotateCcw size={17} /> : <Archive size={17} />}
                {archived ? "Restore branch" : "Archive branch"}
              </Button>

              <Button
                type="button"
                variant="danger"
                loading={deleting}
                loadingText="Deleting..."
                onClick={deleteBranch}
              >
                <Trash2 size={17} />
                Delete branch
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:left-[19rem]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved general changes
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={discard}
                disabled={saving}
              >
                Discard
              </Button>

              <Button
                type="button"
                onClick={save}
                loading={saving}
                loadingText="Saving..."
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