import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import BranchTabs from "../components/BranchTabs";
import PlanLimitNotice from "../components/PlanLimitNotice";
import { useConfirm } from "../components/ConfirmProvider";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { getPublicMenuUrl } from "../lib/urls";
import { useAdminI18n } from "../lib/adminI18n";
import { useBusinessBilling } from "../hooks/useBusinessBilling";
import { getLimitMessage, isSubscriptionLocked } from "../lib/billing";
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
      business_id,
      name,
      slug,
      address,
      phone,
      whatsapp,
      instagram,
      facebook,
      tiktok,
      status,
      is_main,
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

function getActiveMenu(branch) {
  return (
    branch?.menu_versions?.find((menu) => menu.status === "active") ||
    branch?.menu_versions?.[0] ||
    null
  );
}

function emptyToNull(value) {
  const clean = String(value || "").trim();
  return clean ? clean : null;
}

function getInitialForm(branch, menu) {
  return {
    branchName: branch?.name || "",
    branchSlug: branch?.slug || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
    whatsapp: branch?.whatsapp || "",
    instagram: branch?.instagram || "",
    facebook: branch?.facebook || "",
    tiktok: branch?.tiktok || "",
    menuName: menu?.name || "Main Menu",
    menuDescription: menu?.description_ar || "",
  };
}

export default function BranchGeneralPage() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { t } = useAdminI18n();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    data: branch,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["branch-general", branchId],
    queryFn: () => loadBranch(branchId),
    enabled: Boolean(branchId),
  });

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const menu = useMemo(() => getActiveMenu(branch), [branch]);

  const initialForm = useMemo(() => {
    if (!branch || !menu) return null;
    return getInitialForm(branch, menu);
  }, [branch, menu]);

  const dirty = useMemo(() => {
    if (!form || !initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  useEffect(() => {
    if (!branch || !menu) return;
    setForm(getInitialForm(branch, menu));
  }, [branch?.id, menu?.id]);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));

  const editingLocked =
    billingLoading || Boolean(billingError) || subscriptionLocked;

  const lockMessage = billingLoading
    ? "Billing is still loading. Try again in a second."
    : billingError
      ? billingError.message
      : subscriptionLocked
        ? getLimitMessage("locked", billing)
        : "";

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["branch-general", branchId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["branch-menu", branchId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["branch-appearance", branchId],
      }),
    ]);
  }

  async function saveChanges(e) {
    e.preventDefault();

    if (!branch || !menu || !form) return;

    if (editingLocked) {
      toast.error(lockMessage || "Editing is locked.");
      return;
    }

    const cleanSlug = slugify(form.branchSlug);

    if (!form.branchName.trim()) {
      toast.error("Branch name is required");
      return;
    }

    if (!cleanSlug) {
      toast.error("Branch slug is required");
      return;
    }

    setSaving(true);

    try {
      const { data: duplicateSlug, error: duplicateError } = await supabase
        .from("branches")
        .select("id")
        .eq("business_id", branch.business_id)
        .eq("slug", cleanSlug)
        .neq("id", branch.id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicateSlug) {
        throw new Error("Another branch already uses this slug.");
      }

      const { error: branchError } = await supabase
        .from("branches")
        .update({
          name: form.branchName.trim(),
          slug: cleanSlug,
          address: emptyToNull(form.address),
          phone: emptyToNull(form.phone),
          whatsapp: emptyToNull(form.whatsapp),
          instagram: emptyToNull(form.instagram),
          facebook: emptyToNull(form.facebook),
          tiktok: emptyToNull(form.tiktok),
        })
        .eq("id", branch.id);

      if (branchError) throw branchError;

      const { error: menuError } = await supabase
        .from("menu_versions")
        .update({
          name: form.menuName.trim() || "Main Menu",
          description_ar: emptyToNull(form.menuDescription),
        })
        .eq("id", menu.id);

      if (menuError) throw menuError;

      setForm((current) => ({
        ...current,
        branchSlug: cleanSlug,
      }));

      toast.success("Branch saved");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to save branch");
    } finally {
      setSaving(false);
    }
  }

  async function archiveOrRestoreBranch() {
    if (!branch) return;

    if (editingLocked) {
      toast.error(lockMessage || "Editing is locked.");
      return;
    }

    const willArchive = branch.status !== "archived";

    const ok = await confirm({
      title: willArchive ? "Archive branch?" : "Restore branch?",
      message: willArchive
        ? "This branch will stop appearing on the public menu."
        : "This branch will become public again.",
      confirmText: willArchive ? "Archive branch" : "Restore branch",
      danger: willArchive,
    });

    if (!ok) return;

    setArchiving(true);

    try {
      const { error } = await supabase
        .from("branches")
        .update({
          status: willArchive ? "archived" : "active",
        })
        .eq("id", branch.id);

      if (error) throw error;

      toast.success(willArchive ? "Branch archived" : "Branch restored");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update branch");
    } finally {
      setArchiving(false);
    }
  }

  async function deleteBranch() {
    if (!branch) return;

    if (editingLocked) {
      toast.error(lockMessage || "Editing is locked.");
      return;
    }

    const ok = await confirm({
      title: "Delete branch forever?",
      message:
        "This will delete the branch, its menu, sections, and all items. This cannot be undone.",
      confirmText: "Delete forever",
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
        const { data: sections, error: sectionsSelectError } = await supabase
          .from("sections")
          .select("id")
          .in("menu_version_id", menuIds);

        if (sectionsSelectError) throw sectionsSelectError;

        const sectionIds = (sections || []).map((item) => item.id);

        if (sectionIds.length) {
          const { error: itemsError } = await supabase
            .from("items")
            .delete()
            .in("section_id", sectionIds);

          if (itemsError) throw itemsError;
        }

        const { error: sectionsError } = await supabase
          .from("sections")
          .delete()
          .in("menu_version_id", menuIds);

        if (sectionsError) throw sectionsError;

        const { error: menusDeleteError } = await supabase
          .from("menu_versions")
          .delete()
          .eq("branch_id", branch.id);

        if (menusDeleteError) throw menusDeleteError;
      }

      const { error: branchError } = await supabase
        .from("branches")
        .delete()
        .eq("id", branch.id);

      if (branchError) throw branchError;

      toast.success("Branch deleted");

      navigate(`/business/${branch.business_id}`, {
        replace: true,
      });
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

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
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

  if (!branch || !menu || !form) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {t("branchGeneral.notFound")}
        </p>
      </main>
    );
  }

  const publicUrl = getPublicMenuUrl(branch.businesses?.slug, form.branchSlug);

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow={t("branchGeneral.eyebrow")}
        title={branch.name}
        subtitle={t("branchGeneral.subtitle")}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
            >
              <ExternalLink size={17} />
              {t("branchGeneral.openPublicPage")}
            </a>
          </div>
        }
      />

      <BranchTabs branchId={branchId} />

      {editingLocked && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <PlanLimitNotice
            title={t("branchGeneral.editingLocked")}
            text={lockMessage}
          />
        </section>
      )}

      <form
        onSubmit={saveChanges}
        className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6"
      >

        <Link
          to={`/business/${branch.business_id}`}
          dir="ltr"
          className="inline-flex py-2 items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          {t("business.backToBusinesses")}
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              {t("branchGeneral.general")}
            </h2>

            <p className="mt-1 text-sm font-bold text-white/35">
              {t("branchGeneral.generalSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {archived ? (
              <Badge tone="warning">{t("branchGeneral.archived")}</Badge>
            ) : (
              <Badge tone="success">{t("branchGeneral.active")}</Badge>
            )}

            {isFetching && (
              <Badge tone="neutral">
                <Loader2 size={13} className="animate-spin" />
                {t("branchGeneral.syncing")}
              </Badge>
            )}

            {dirty && (
              <Badge tone="warning">{t("branchGeneral.unsavedChanges")}</Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-w-0 gap-5">
            <Card className="min-w-0 p-5">
              <div className="mb-5">
                <h3 className="text-xl font-black">
                  {t("branchGeneral.identity")}
                </h3>

                <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                  {t("branchGeneral.identityText")}
                  <span className="mx-1 font-black text-[#ff7a00]" dir="ltr">
                    /{form.branchSlug}
                  </span>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("branchGeneral.branchName")}>
                  <Input
                    value={form.branchName}
                    disabled={editingLocked}
                    onChange={(e) =>
                      updateField("branchName", e.target.value)
                    }
                    placeholder="Haifa"
                  />
                </Field>

                <Field label={t("branchGeneral.branchSlug")}>
                  <Input
                    value={form.branchSlug}
                    disabled={editingLocked}
                    onChange={(e) =>
                      updateField("branchSlug", e.target.value)
                    }
                    onBlur={() =>
                      updateField("branchSlug", slugify(form.branchSlug))
                    }
                    placeholder="haifa"
                    
                  />
                </Field>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  <LinkIcon size={14} />
                  {t("branchGeneral.publicUrl")}
                </p>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm font-black text-[#ff7a00] hover:underline"
                  
                >
                  {publicUrl}
                </a>
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <div className="mb-5">
                <h3 className="text-xl font-black">
                  {t("branchGeneral.menuText")}
                </h3>

                <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                  {t("branchGeneral.menuTextSubtitle")}
                </p>
              </div>

              <div className="grid gap-4">
                <Field label={t("branchGeneral.menuName")}>
                  <Input
                    value={form.menuName}
                    disabled={editingLocked}
                    onChange={(e) => updateField("menuName", e.target.value)}
                    placeholder="Main Menu"
                  />
                </Field>

                <Field label={t("branchGeneral.menuDescription")}>
                  <Textarea
                    value={form.menuDescription}
                    disabled={editingLocked}
                    onChange={(e) =>
                      updateField("menuDescription", e.target.value)
                    }
                    placeholder="وصف قصير للقائمة"
                    
                  />
                </Field>
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <div className="mb-5">
                <h3 className="text-xl font-black">
                  {t("branchGeneral.location")}
                </h3>

                <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                  {t("branchGeneral.locationSubtitle")}
                </p>
              </div>

              <Field label={t("branchGeneral.address")}>
                <Input
                  value={form.address}
                  disabled={editingLocked}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Haifa, Main street..."
                />
              </Field>
            </Card>

            <Card className="min-w-0 p-5">
              <div className="mb-5">
                <h3 className="text-xl font-black">
                  {t("branchGeneral.contactLinks")}
                </h3>

                <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                  {t("branchGeneral.contactLinksSubtitle")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("branchGeneral.phone")}>
                  <Input
                    value={form.phone}
                    disabled={editingLocked}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="0500000000"
                    dir="ltr"
                  />
                </Field>

                <Field label={t("branchGeneral.whatsapp")}>
                  <Input
                    value={form.whatsapp}
                    disabled={editingLocked}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    placeholder="972500000000"
                    dir="ltr"
                  />
                </Field>

                <Field label={t("branchGeneral.instagram")}>
                  <Input
                    value={form.instagram}
                    disabled={editingLocked}
                    onChange={(e) =>
                      updateField("instagram", e.target.value)
                    }
                    placeholder="@crtgo"
                    dir="ltr"
                  />
                </Field>

                <Field label={t("branchGeneral.facebook")}>
                  <Input
                    value={form.facebook}
                    disabled={editingLocked}
                    onChange={(e) => updateField("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </Field>

                <Field label={t("branchGeneral.tiktok")}>
                  <Input
                    value={form.tiktok}
                    disabled={editingLocked}
                    onChange={(e) => updateField("tiktok", e.target.value)}
                    placeholder="@crtgo"
                    dir="ltr"
                  />
                </Field>
              </div>
            </Card>
          </section>

          <aside className="grid h-fit min-w-0 gap-5 xl:sticky xl:top-6">
            <Card className="min-w-0 p-5">
              <h3 className="text-xl font-black">
                {t("branchGeneral.branchStatus")}
              </h3>

              <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                {t("branchGeneral.branchStatusSubtitle")}
              </p>

              <div className="mt-5 grid gap-3">
                <Button
                  type="button"
                  variant={archived ? "secondary" : "danger"}
                  loading={archiving}
                  loadingText={
                    archived
                      ? t("branchGeneral.restoring")
                      : t("branchGeneral.archiving")
                  }
                  disabled={editingLocked}
                  onClick={archiveOrRestoreBranch}
                >
                  {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                  {archived
                    ? t("branchGeneral.restoreBranch")
                    : t("branchGeneral.archiveBranch")}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  loading={deleting}
                  loadingText={t("branchGeneral.deleting")}
                  disabled={editingLocked}
                  onClick={deleteBranch}
                >
                  <Trash2 size={16} />
                  {t("branchGeneral.deleteBranch")}
                </Button>
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <h3 className="text-xl font-black">
                {t("branchGeneral.saveTitle")}
              </h3>

              <p className="mt-1 text-sm font-bold leading-6 text-white/35">
                {t("branchGeneral.saveSubtitle")}
              </p>

              <Button
                type="submit"
                className="mt-5 w-full"
                loading={saving}
                loadingText={t("branchGeneral.saving")}
                disabled={!dirty || editingLocked}
              >
                <Save size={16} />
                {t("branchGeneral.saveChanges")}
              </Button>
            </Card>
          </aside>
        </div>

        {dirty && (
          <div className="fixed bottom-4 left-4 right-4 z-[80] rounded-[26px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:left-[19rem]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-white/70">
                {t("branchGeneral.unsavedMessage")}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setForm(initialForm)}
                  disabled={saving}
                >
                  {t("branchGeneral.discard")}
                </Button>

                <Button
                  type="submit"
                  loading={saving}
                  loadingText={t("branchGeneral.saving")}
                  disabled={editingLocked}
                >
                  <Save size={16} />
                  {t("branchGeneral.saveChanges")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
