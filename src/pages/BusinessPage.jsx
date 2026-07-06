import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Settings,
  Store,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";
import { getPublicMenuUrl } from "../lib/urls";
import { useConfirm } from "../components/ConfirmProvider";
import ImageUploadField from "../components/ImageUploadField";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "../components/ui";

import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canCreateBranch,
  getLimitMessage,
  isSubscriptionLocked,
} from "../lib/billing";
import PlanLimitNotice from "../components/PlanLimitNotice";

async function loadBusiness(businessId) {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      logo_url,
      description,
      status,
      landing_cover_url,
      landing_mode,
      branches (
        id,
        name,
        slug,
        address,
        phone,
        whatsapp,
        instagram,
        facebook,
        tiktok,
        is_main,
        status,
        menu_versions (
          id,
          name,
          status
        )
      )
    `)
    .eq("id", businessId)
    .single();

  if (error) throw error;

  return data;
}

function emptyToNull(value) {
  const clean = String(value || "").trim();
  return clean ? clean : null;
}

export default function BusinessPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    data: business,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => loadBusiness(businessId),
    enabled: Boolean(businessId),
  });

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(businessId);

  const branches = business?.branches || [];
  const activeBranches = branches.filter((branch) => branch.status !== "archived");
  const branchCount = branches.length;

  const locked = Boolean(billing && isSubscriptionLocked(billing));
  const branchLimitReached = Boolean(
    billing && !canCreateBranch(billing, branchCount)
  );

  const branchCreateBlocked =
    billingLoading || Boolean(billingError) || locked || branchLimitReached;

  const disabledMessage = billingLoading
    ? "Billing is still loading. Try again in a second."
    : billingError
      ? billingError.message
      : locked
        ? getLimitMessage("locked", billing)
        : getLimitMessage("branches", billing);

  async function refreshBusiness() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["business", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["businesses"] }),
      queryClient.invalidateQueries({
        queryKey: ["business-billing", businessId],
      }),
    ]);
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage message={error.message} />;
  }

  if (!business) {
    return <ErrorPage message="Business not found." />;
  }

  const businessPublicUrl =
    activeBranches[0] &&
    getPublicMenuUrl(business.slug, activeBranches[0].slug);

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] pb-20 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909]/85 px-4 py-5 backdrop-blur-xl sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to businesses
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff7a00]">
              Business
            </p>

            <h1 className="mt-1 truncate text-3xl font-black tracking-[-0.06em]">
              {business.name}
            </h1>

            <p className="mt-2 max-w-sm text-sm font-bold text-white/40">
              {business.description || "Manage branches and menus."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {businessPublicUrl && (
              <a
                href={businessPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
              >
                <ExternalLink size={17} />
                Public
              </a>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={17} />
              Business Settings
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-5 sm:px-6">
        {locked && (
          <PlanLimitNotice
            title="Subscription locked"
            text={getLimitMessage("locked", billing)}
          />
        )}

        {billingError && (
          <PlanLimitNotice title="Billing error" text={billingError.message} />
        )}

        {branchLimitReached && !locked && (
          <PlanLimitNotice
            title="Branch limit reached"
            text={getLimitMessage("branches", billing)}
          />
        )}

        {business.status === "archived" && (
          <PlanLimitNotice
            title="Business archived"
            text="This business is archived. Restore it from Business Settings before using it publicly."
          />
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="my-4 flex flex-col gap-4 sm:flex-row">
          <Button
            type="button"
            disabled={branchCreateBlocked || business.status === "archived"}
            onClick={() => setNewBranchOpen(true)}
          >
            {billingLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Plus size={17} />
            )}
            New Branch
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={17} />
            Edit Business
          </Button>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store size={28} />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">
                  {business.name}
                </h2>

                <p
                  className="mt-1 truncate text-sm font-bold text-white/35"
                  dir="ltr"
                >
                  {business.slug}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Info label="Branches" value={branchCount} />
              <Info label="Active" value={activeBranches.length} />
              <Info label="Status" value={business.status || "active"} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Branches</h2>
        </div>

        {branches.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => {
              const activeMenu =
                branch.menu_versions?.find(
                  (menu) => menu.status === "active"
                ) || branch.menu_versions?.[0];

              const publicUrl = getPublicMenuUrl(business.slug, branch.slug);
              const branchArchived = branch.status === "archived";

              return (
                <article
                  key={branch.id}
                  className={`group rounded-[28px] border border-white/10 bg-[#111111] p-5 transition hover:-translate-y-0.5 hover:border-[#ff7a00]/50 hover:bg-[#151515] ${
                    branchArchived ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#ff7a00]">
                      <MapPin size={24} />
                    </div>

                    <Link
                      to={`/branch/${branch.id}/menu`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/35 transition hover:border-[#ff7a00]/50 hover:text-[#ff7a00]"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>

                  <h3 className="mt-6 truncate text-2xl font-black tracking-[-0.04em]">
                    {branch.name}
                  </h3>

                  <p
                    className="mt-2 truncate text-sm font-bold text-white/35"
                    dir="ltr"
                  >
                    {publicUrl}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Info label="Menu" value={activeMenu?.name || "Main Menu"} />
                    <Info label="Status" value={branch.status || "active"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/branch/${branch.id}/menu`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#ff7a00] px-4 text-sm font-black text-black transition hover:bg-white"
                    >
                      Edit Menu
                    </Link>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      <ExternalLink size={16} />
                      Public
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-5 rounded-[28px] border border-dashed border-white/10 bg-[#111111] p-10 text-center">
            <MapPin className="mx-auto text-[#ff7a00]" size={42} />

            <h3 className="mt-5 text-3xl font-black tracking-[-0.05em]">
              No branches yet
            </h3>

            <Button
              type="button"
              className="mt-6"
              disabled={branchCreateBlocked || business.status === "archived"}
              onClick={() => setNewBranchOpen(true)}
            >
              {billingLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
              New Branch
            </Button>
          </section>
        )}
      </section>

      <BusinessSettingsModal
        open={settingsOpen}
        business={business}
        locked={locked}
        lockedMessage={getLimitMessage("locked", billing)}
        onClose={() => setSettingsOpen(false)}
        onDone={() => {
          setSettingsOpen(false);
          refreshBusiness();
        }}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["businesses"] });
          navigate("/", { replace: true });
        }}
      />

      <NewBranchModal
        open={newBranchOpen}
        business={business}
        disabled={
          branchCreateBlocked ||
          business.status === "archived"
        }
        disabledMessage={
          business.status === "archived"
            ? "Restore this business before creating branches."
            : disabledMessage
        }
        onClose={() => setNewBranchOpen(false)}
        onDone={() => {
          setNewBranchOpen(false);
          refreshBusiness();
        }}
      />
    </main>
  );
}

function BusinessSettingsModal({
  open,
  onClose,
  onDone,
  onDeleted,
  business,
  locked,
  lockedMessage,
}) {
  const confirm = useConfirm();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    landing_cover_url: "",
    landing_mode: "branches",
  });

  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!business || !open) return;

    setForm({
      name: business.name || "",
      slug: business.slug || "",
      description: business.description || "",
      logo_url: business.logo_url || "",
      landing_cover_url: business.landing_cover_url || "",
      landing_mode: business.landing_mode || "branches",
    });
  }, [business?.id, open]);

  if (!open || !business) return null;

  const archived = business.status === "archived";
  const editingLocked = Boolean(locked);

  function updateField(key, value) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "name") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function saveBusiness(e) {
    e.preventDefault();

    if (editingLocked) {
      toast.error(lockedMessage || "Business editing is locked.");
      return;
    }

    const cleanName = form.name.trim();
    const cleanSlug = slugify(form.slug);

    if (!cleanName) {
      toast.error("Business name is required.");
      return;
    }

    if (!cleanSlug) {
      toast.error("Business slug is required.");
      return;
    }

    setSaving(true);

    try {
      const { data: duplicateBusiness, error: duplicateError } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", cleanSlug)
        .neq("id", business.id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicateBusiness) {
        throw new Error("Another business already uses this slug.");
      }

      const { error } = await supabase
        .from("businesses")
        .update({
          name: cleanName,
          slug: cleanSlug,
          description: emptyToNull(form.description),
          logo_url: emptyToNull(form.logo_url),
          landing_cover_url: emptyToNull(form.landing_cover_url),
          landing_mode: form.landing_mode || "branches",
        })
        .eq("id", business.id);

      if (error) throw error;

      toast.success("Business saved");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to save business");
    } finally {
      setSaving(false);
    }
  }

  async function archiveOrRestoreBusiness() {
    if (editingLocked) {
      toast.error(lockedMessage || "Business editing is locked.");
      return;
    }

    const willArchive = !archived;

    const ok = await confirm({
      title: willArchive ? "Archive business?" : "Restore business?",
      message: willArchive
        ? "This business will stop appearing publicly."
        : "This business will become active again.",
      confirmText: willArchive ? "Archive business" : "Restore business",
      danger: willArchive,
    });

    if (!ok) return;

    setChangingStatus(true);

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          status: willArchive ? "archived" : "active",
        })
        .eq("id", business.id);

      if (error) throw error;

      toast.success(willArchive ? "Business archived" : "Business restored");
      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to update business");
    } finally {
      setChangingStatus(false);
    }
  }

  async function deleteBusiness() {
    if (editingLocked) {
      toast.error(lockedMessage || "Business editing is locked.");
      return;
    }

    const ok = await confirm({
      title: "Delete business forever?",
      message:
        "This will delete the business, all branches, menus, sections, and items. This cannot be undone.",
      confirmText: "Delete forever",
      danger: true,
    });

    if (!ok) return;

    setDeleting(true);

    try {
      const { data: branches, error: branchesError } = await supabase
        .from("branches")
        .select("id")
        .eq("business_id", business.id);

      if (branchesError) throw branchesError;

      const branchIds = (branches || []).map((branch) => branch.id);

      if (branchIds.length) {
        const { data: menus, error: menusError } = await supabase
          .from("menu_versions")
          .select("id")
          .in("branch_id", branchIds);

        if (menusError) throw menusError;

        const menuIds = (menus || []).map((menu) => menu.id);

        if (menuIds.length) {
          const { data: sections, error: sectionsError } = await supabase
            .from("sections")
            .select("id")
            .in("menu_version_id", menuIds);

          if (sectionsError) throw sectionsError;

          const sectionIds = (sections || []).map((section) => section.id);

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
            .in("branch_id", branchIds);

          if (deleteMenusError) throw deleteMenusError;
        }

        const { error: deleteBranchesError } = await supabase
          .from("branches")
          .delete()
          .eq("business_id", business.id);

        if (deleteBranchesError) throw deleteBranchesError;
      }

      await supabase
        .from("business_subscriptions")
        .delete()
        .eq("business_id", business.id);

      await supabase
        .from("client_notes")
        .delete()
        .eq("business_id", business.id);

      await supabase
        .from("subscription_events")
        .delete()
        .eq("business_id", business.id);

      const { error: businessError } = await supabase
        .from("businesses")
        .delete()
        .eq("id", business.id);

      if (businessError) throw businessError;

      toast.success("Business deleted");
      onDeleted();
    } catch (err) {
      toast.error(err.message || "Failed to delete business");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} title="Business Settings" onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={saveBusiness} className="grid gap-5">
        {editingLocked && (
          <PlanLimitNotice
            title="Business editing locked"
            text={lockedMessage}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input
              value={form.name}
              disabled={editingLocked}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Burger House"
            />
          </Field>

          <Field label="Business slug">
            <Input
              value={form.slug}
              disabled={editingLocked}
              onChange={(e) => updateField("slug", e.target.value)}
              onBlur={() => updateField("slug", slugify(form.slug))}
              placeholder="burger-house"
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={form.description}
            disabled={editingLocked}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short public description..."
          />
        </Field>

        <Field label="Landing mode">
          <Select
            value={form.landing_mode}
            disabled={editingLocked}
            onChange={(e) => updateField("landing_mode", e.target.value)}
          >
            <option value="branches">Show branch selector page</option>
            <option value="redirect_main">Redirect to main branch</option>
          </Select>
        </Field>

        <div className="grid gap-5 xl:grid-cols-2">
          <ImageUploadField
            label="Business logo"
            value={form.logo_url}
            onChange={(url) => updateField("logo_url", url)}
            folder="business-logo"
            disabled={editingLocked}
            disabledReason={lockedMessage}
            hint="This logo appears on the public business landing page."
          />

          <ImageUploadField
            label="Landing cover image"
            value={form.landing_cover_url}
            onChange={(url) => updateField("landing_cover_url", url)}
            folder="business-cover"
            disabled={editingLocked}
            disabledReason={lockedMessage}
            hint="This cover appears on the branch selector page."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="submit"
            loading={saving}
            loadingText="Saving business..."
            disabled={editingLocked || !form.name.trim()}
          >
            Save Business
          </Button>

          <Button
            type="button"
            variant={archived ? "secondary" : "danger"}
            loading={changingStatus}
            loadingText={archived ? "Restoring..." : "Archiving..."}
            disabled={editingLocked}
            onClick={archiveOrRestoreBusiness}
          >
            {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
            {archived ? "Restore Business" : "Archive Business"}
          </Button>
        </div>

        <div className="rounded-[24px] border border-red-400/15 bg-red-500/10 p-4">
          <p className="text-sm font-black text-red-200">Danger zone</p>

          <p className="mt-1 text-sm font-bold leading-6 text-red-100/50">
            Deleting a business removes all branches, menus, sections, items,
            billing notes, and subscription history connected to it.
          </p>

          <Button
            type="button"
            variant="danger"
            className="mt-4"
            loading={deleting}
            loadingText="Deleting..."
            disabled={editingLocked}
            onClick={deleteBusiness}
          >
            <Trash2 size={16} />
            Delete Business Forever
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NewBranchModal({
  open,
  onClose,
  onDone,
  business,
  disabled,
  disabledMessage,
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
  });

  if (!open || !business) return null;

  function updateField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "name") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (disabled) {
      toast.error(disabledMessage || "This action is not available.");
      return;
    }

    setLoading(true);

    try {
      const branchName = form.name.trim();
      const branchSlug = slugify(form.slug);

      if (!branchName) throw new Error("Branch name is required.");
      if (!branchSlug) throw new Error("Branch slug is required.");

      const { data: existingBranch, error: existingError } = await supabase
        .from("branches")
        .select("id")
        .eq("business_id", business.id)
        .eq("slug", branchSlug)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingBranch) {
        throw new Error("This branch slug already exists in this business.");
      }

      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert({
          business_id: business.id,
          name: branchName,
          slug: branchSlug,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram: form.instagram.trim() || null,
          is_main: false,
          status: "active",
        })
        .select("*")
        .single();

      if (branchError) throw branchError;

      const { error: menuError } = await supabase.from("menu_versions").insert({
        branch_id: branch.id,
        name: "Main Menu",
        status: "active",
        template_id: "classic",
        default_language: "ar",
        enabled_languages: ["ar"],
        primary_color: "#ff7a00",
        background_color: "#f7f4ef",
        text_color: "#111111",
      });

      if (menuError) throw menuError;

      toast.success("Branch created");

      setForm({
        name: "",
        slug: "",
        address: "",
        phone: "",
        whatsapp: "",
        instagram: "",
      });

      onDone();
    } catch (err) {
      toast.error(err.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="New Branch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {disabled && (
          <PlanLimitNotice
            title="Cannot create branch"
            text={disabledMessage}
          />
        )}

        <Field label="Branch name">
          <Input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Downtown Branch"
          />
        </Field>

        <Field label="Branch slug">
          <Input
            required
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            onBlur={() => updateField("slug", slugify(form.slug))}
            placeholder="downtown"
            dir="ltr"
          />
        </Field>

        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Street, city..."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <Field label="Instagram">
          <Input
            value={form.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="@restaurant"
            dir="ltr"
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          loadingText="Creating..."
          disabled={loading || disabled}
        >
          Create Branch
        </Button>
      </form>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function LoadingPage() {
  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
      <div className="h-12 w-72 animate-pulse rounded-2xl bg-white/10" />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-[28px] bg-white/10"
          />
        ))}
      </div>
    </main>
  );
}

function ErrorPage({ message }) {
  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
        {message}
      </p>
    </main>
  );
}
