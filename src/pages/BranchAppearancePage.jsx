import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  LayoutTemplate,
  Lock,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { getPublicMenuUrl } from "../lib/urls";
import BranchTabs from "../components/BranchTabs";
import ImageUploadField from "../components/ImageUploadField";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
} from "../components/ui";

import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canUseCustomCover,
  canUseSectionPages,
  canUseTemplate,
  getLimitMessage,
  isSubscriptionLocked,
} from "../lib/billing";
import PlanLimitNotice from "../components/PlanLimitNotice";

async function loadBranch(branchId) {
  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      slug,
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
        template_id,
        logo_url,
        cover_url,
        primary_color,
        background_color,
        text_color
      )
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;
  return data;
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    badge: "Default",
    description: "A full scrolling menu with a strong restaurant landing area.",
    preview: "classic",
  },
  {
    id: "clean_cards",
    name: "Clean Cards",
    badge: "Section Pages",
    description:
      "Section cards first, then each section opens as its own page. Requires section pages in the plan.",
    preview: "cards",
  },
  {
    id: "modern",
    name: "Modern",
    badge: "Wide",
    description: "A modern split layout with the brand panel beside the menu.",
    preview: "modern",
  },
  {
    id: "luxury",
    name: "Luxury",
    badge: "Premium",
    description: "Large hero, premium spacing, and stronger visual branding.",
    preview: "luxury",
  },
];

function normalizeTemplateId(value) {
  const template = String(value || "classic").toLowerCase();

  if (template === "modern") return "modern";
  if (template === "luxury") return "luxury";

  if (
    ["clean", "clean_cards", "clean-cards", "template_clean_cards"].includes(
      template
    )
  ) {
    return "clean_cards";
  }

  return "classic";
}

function requiresSectionPages(templateId) {
  return normalizeTemplateId(templateId) === "clean_cards";
}

export default function BranchAppearancePage() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [localForm, setLocalForm] = useState(null);

  const {
    data: branch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-appearance", branchId],
    queryFn: () => loadBranch(branchId),
    enabled: Boolean(branchId),
  });

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const menu = useMemo(() => {
    return (
      branch?.menu_versions?.find((item) => item.status === "active") ||
      branch?.menu_versions?.[0] ||
      null
    );
  }, [branch]);

  const initialForm = useMemo(() => {
    return {
      template_id: normalizeTemplateId(menu?.template_id || "classic"),
      logo_url: menu?.logo_url || "",
      cover_url: menu?.cover_url || "",
      primary_color: menu?.primary_color || "#ff7a00",
      background_color: menu?.background_color || "#090909",
      text_color: menu?.text_color || "#ffffff",
    };
  }, [menu]);

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));
  const customCoverLocked = Boolean(billing && !canUseCustomCover(billing));
  const sectionPagesLocked = Boolean(billing && !canUseSectionPages(billing));

  const selectedTemplateLocked = Boolean(
    billing && !canUseTemplate(billing, form.template_id)
  );

  const appearanceLocked =
    archived ||
    billingLoading ||
    Boolean(billingError) ||
    subscriptionLocked;

  const customCoverDisabled = appearanceLocked || customCoverLocked;

  const lockMessage = archived
    ? "Restore this branch before editing appearance."
    : billingLoading
      ? "Billing is still loading. Try again in a second."
      : billingError
        ? billingError.message
        : subscriptionLocked
          ? getLimitMessage("locked", billing)
          : "";

  const coverLockMessage = customCoverLocked
    ? getLimitMessage("cover", billing)
    : lockMessage;

  const selectedTemplateLockMessage = selectedTemplateLocked
    ? requiresSectionPages(form.template_id) && sectionPagesLocked
      ? getLimitMessage("section_pages", billing)
      : getLimitMessage("templates", billing)
    : "";

  const publicUrl =
    branch?.businesses?.slug && branch?.slug
      ? getPublicMenuUrl(branch.businesses.slug, branch.slug)
      : null;

  function updateField(key, value) {
    setLocalForm((current) => ({
      ...(current || initialForm),
      [key]: value,
    }));
  }

  function discard() {
    setLocalForm(null);
    toast.success("Changes discarded");
  }

  function getTemplateLockMessage(templateId) {
    if (!billing) return "";

    if (requiresSectionPages(templateId) && !canUseSectionPages(billing)) {
      return getLimitMessage("section_pages", billing);
    }

    return getLimitMessage("templates", billing);
  }

  function selectTemplate(templateId) {
    if (appearanceLocked) {
      toast.error(lockMessage || "Appearance editing is locked.");
      return;
    }

    if (billing && !canUseTemplate(billing, templateId)) {
      toast.error(getTemplateLockMessage(templateId));
      return;
    }

    updateField("template_id", normalizeTemplateId(templateId));
  }

  async function save() {
    if (!dirty || !menu) return;

    if (appearanceLocked) {
      toast.error(lockMessage || "Appearance editing is locked.");
      return;
    }

    if (selectedTemplateLocked) {
      toast.error(selectedTemplateLockMessage);
      return;
    }

    if (customCoverLocked && form.cover_url !== initialForm.cover_url) {
      toast.error(getLimitMessage("cover", billing));
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("menu_versions")
        .update({
          template_id: normalizeTemplateId(form.template_id),
          logo_url: form.logo_url.trim() || null,
          cover_url: form.cover_url.trim() || null,
          primary_color: form.primary_color || "#ff7a00",
          background_color: form.background_color || "#090909",
          text_color: form.text_color || "#ffffff",
        })
        .eq("id", menu.id);

      if (error) throw error;

      toast.success("Appearance saved");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["branch-appearance", branchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["branch-menu", branchId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["business", branch.business_id],
        }),
      ]);

      setLocalForm(null);
    } catch (err) {
      toast.error(err.message || "Failed to save appearance");
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

  if (error || !branch || !menu) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Menu not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="Appearance"
        subtitle={`Customize logo, cover, colors, and template for ${branch.name}.`}
        action={
          <div className="flex gap-2">
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
              >
                <ExternalLink size={17} />
                Preview
              </a>
            )}

            <Button
              type="button"
              loading={saving}
              loadingText="Saving..."
              disabled={!dirty || appearanceLocked || selectedTemplateLocked}
              onClick={save}
            >
              <Save size={17} />
              Save
            </Button>
          </div>
        }
      />

      <BranchTabs branchId={branchId} />

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-5 sm:px-6">
        {appearanceLocked && (
          <PlanLimitNotice
            title={archived ? "Branch archived" : "Appearance locked"}
            text={lockMessage}
          />
        )}

        {customCoverLocked && !appearanceLocked && (
          <PlanLimitNotice
            title="Custom cover locked"
            text={getLimitMessage("cover", billing)}
          />
        )}

        {selectedTemplateLocked && !appearanceLocked && (
          <PlanLimitNotice
            title={
              requiresSectionPages(form.template_id) && sectionPagesLocked
                ? "Section pages locked"
                : "Template locked"
            }
            text={selectedTemplateLockMessage}
          />
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="grid min-w-0 gap-5">
            <Card className="min-w-0 p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Template
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                Choose how the public menu looks. Owner Plans controls which
                templates and section-page layouts are available.
              </p>

              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {TEMPLATES.map((template) => {
                  const active = form.template_id === template.id;
                  const templateLocked = Boolean(
                    billing && !canUseTemplate(billing, template.id)
                  );
                  const templateLockMessage = templateLocked
                    ? getTemplateLockMessage(template.id)
                    : "";

                  return (
                    <button
                      key={template.id}
                      type="button"
                      disabled={appearanceLocked || templateLocked}
                      onClick={() => selectTemplate(template.id)}
                      className={`group min-w-0 rounded-[26px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        active
                          ? "border-[#ff7a00] bg-[#ff7a00]/10 shadow-xl shadow-[#ff7a00]/5"
                          : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <TemplatePreview
                        type={template.preview}
                        primary={form.primary_color}
                        background={form.background_color}
                        text={form.text_color}
                        locked={templateLocked}
                      />

                      <div className="mt-4 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black">
                            {template.name}
                          </h3>

                          <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                            {template.description}
                          </p>

                          {templateLocked && (
                            <p className="mt-2 text-xs font-bold leading-5 text-red-200/60">
                              {templateLockMessage}
                            </p>
                          )}
                        </div>

                        {active && (
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ff7a00] text-black">
                            <Check size={15} />
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            active
                              ? "warning"
                              : templateLocked
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {active
                            ? "Selected"
                            : templateLocked
                              ? "Locked"
                              : "Available"}
                        </Badge>

                        <span className="text-xs font-black uppercase tracking-[0.14em] text-white/25">
                          {template.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Images
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                Upload the logo and cover image used on the public menu.
              </p>

              <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
                <ImageUploadField
                  label="Logo"
                  value={form.logo_url}
                  onChange={(url) => updateField("logo_url", url)}
                  folder="menu-logo"
                  disabled={appearanceLocked}
                  disabledReason={lockMessage}
                  hint={
                    form.logo_url
                      ? "Logo is added. Change or delete it."
                      : "Add a logo for the public menu header."
                  }
                />

                <ImageUploadField
                  label="Cover image"
                  value={form.cover_url}
                  onChange={(url) => updateField("cover_url", url)}
                  folder="menu-cover"
                  disabled={customCoverDisabled}
                  disabledReason={coverLockMessage}
                  hint={
                    customCoverLocked
                      ? getLimitMessage("cover", billing)
                      : form.cover_url
                        ? "Cover image is added. Change or delete it."
                        : "Add a cover image for the public menu hero."
                  }
                />
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Colors
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                Choose the brand accent and base colors used by the scrolling
                templates.
              </p>

              <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-3">
                <ColorField
                  label="Primary color"
                  value={form.primary_color}
                  disabled={appearanceLocked}
                  onChange={(value) => updateField("primary_color", value)}
                />

                <ColorField
                  label="Background"
                  value={form.background_color}
                  disabled={appearanceLocked}
                  onChange={(value) => updateField("background_color", value)}
                />

                <ColorField
                  label="Text"
                  value={form.text_color}
                  disabled={appearanceLocked}
                  onChange={(value) => updateField("text_color", value)}
                />
              </div>
            </Card>
          </div>

          <aside className="min-w-0 2xl:sticky 2xl:top-6 2xl:self-start">
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                Live preview
              </p>

              <div
                className="mt-4 overflow-hidden rounded-[28px] border border-white/10"
                style={{
                  backgroundColor: form.background_color,
                  color: form.text_color,
                }}
              >
                <div className="relative h-40 bg-black/10">
                  {form.cover_url && !customCoverLocked ? (
                    <img
                      src={form.cover_url}
                      alt=""
                      className="h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center px-4 text-center text-sm font-black"
                      style={{ color: form.text_color, opacity: 0.45 }}
                    >
                      {customCoverLocked
                        ? "Cover locked by plan"
                        : "No cover image"}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                      {form.logo_url ? (
                        <img
                          src={form.logo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-black opacity-40">
                          Logo
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-black">
                        {branch.name}
                      </h3>

                      <p className="truncate text-xs font-bold opacity-50">
                        {form.template_id} template
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-5 rounded-2xl px-4 py-2 text-sm font-black"
                    style={{
                      backgroundColor: form.primary_color,
                      color: "#000",
                    }}
                  >
                    Example action
                  </button>

                  <div className="mt-5 grid gap-2">
                    <div className="h-4 w-3/4 rounded-full bg-white/15" />
                    <div className="h-4 w-1/2 rounded-full bg-white/10" />
                    <div
                      className="h-10 rounded-2xl"
                      style={{ backgroundColor: `${form.primary_color}33` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {dirty && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-[24px] border border-[#ff7a00]/20 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:left-[19rem]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#ffbd7c]">
              You have unsaved appearance changes
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
                disabled={appearanceLocked || selectedTemplateLocked}
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

function ColorField({ label, value, onChange, disabled }) {
  return (
    <Field label={label}>
      <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
        <Input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 cursor-pointer p-1"
        />

        <p className="mt-3 text-sm font-black text-white/70" dir="ltr">
          {value}
        </p>
      </div>
    </Field>
  );
}

function TemplatePreview({ type, primary, background, text, locked }) {
  if (locked) {
    return (
      <div className="grid h-32 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Lock size={26} className="text-white/25" />
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="h-32 rounded-2xl border border-white/10 bg-[#f7f4ef] p-3">
        <div className="h-8 rounded-xl bg-black" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-white shadow-sm" />
          <div className="h-14 rounded-xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (type === "modern") {
    return (
      <div
        className="grid h-32 grid-cols-[38%_1fr] gap-2 rounded-2xl border border-white/10 p-3"
        style={{ backgroundColor: background, color: text }}
      >
        <div className="rounded-xl bg-white/10" />
        <div className="grid gap-2">
          <div className="h-5 rounded-full bg-white/15" />
          <div
            className="h-16 rounded-xl"
            style={{ backgroundColor: `${primary}44` }}
          />
        </div>
      </div>
    );
  }

  if (type === "luxury") {
    return (
      <div
        className="h-32 rounded-2xl border border-white/10 p-3"
        style={{ backgroundColor: background, color: text }}
      >
        <div className="grid h-full place-items-center rounded-xl bg-white/10">
          <div className="text-center">
            <LayoutTemplate className="mx-auto" size={22} />
            <div
              className="mx-auto mt-3 h-2 w-20 rounded-full"
              style={{ backgroundColor: primary }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-32 rounded-2xl border border-white/10 p-3"
      style={{ backgroundColor: background, color: text }}
    >
      <div className="h-12 rounded-xl bg-white/10" />
      <div className="mt-3 grid gap-2">
        <div className="h-3 rounded-full bg-white/15" />
        <div className="h-3 w-2/3 rounded-full bg-white/10" />
        <div
          className="h-6 rounded-xl"
          style={{ backgroundColor: `${primary}55` }}
        />
      </div>
    </div>
  );
}