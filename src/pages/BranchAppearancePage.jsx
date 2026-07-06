import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import BranchTabs from "../components/BranchTabs";
import ImageUploadField from "../components/ImageUploadField";
import {
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
      status,
      business_id,
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
    name: "Clean Cards",
    description: "Section cards with separate section pages.",
  },
  {
    id: "modern",
    name: "One Page",
    description: "All sections and items in one scrolling menu.",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Premium layout for stronger brands.",
  },
];

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
      template_id: menu?.template_id || "classic",
      logo_url: menu?.logo_url || "",
      cover_url: menu?.cover_url || "",
      primary_color: menu?.primary_color || "#ff7a00",
    };
  }, [menu]);

  const form = localForm || initialForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));
  const customCoverLocked = Boolean(billing && !canUseCustomCover(billing));
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

  function selectTemplate(templateId) {
    if (appearanceLocked) {
      toast.error(lockMessage || "Appearance editing is locked.");
      return;
    }

    if (billing && !canUseTemplate(billing, templateId)) {
      toast.error(getLimitMessage("templates", billing));
      return;
    }

    updateField("template_id", templateId);
  }

  async function save() {
    if (!dirty || !menu) return;

    if (appearanceLocked) {
      toast.error(lockMessage || "Appearance editing is locked.");
      return;
    }

    if (selectedTemplateLocked) {
      toast.error(getLimitMessage("templates", billing));
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
          template_id: form.template_id,
          logo_url: form.logo_url.trim() || null,
          cover_url: form.cover_url.trim() || null,
          primary_color: form.primary_color || "#ff7a00",

          // Kept fixed because public templates now use a clean white base.
          background_color: "#f7f4ef",
          text_color: "#111111",
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
        subtitle={`Customize logo, cover, accent color, and template for ${branch.name}.`}
        action={
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
            title="Template locked"
            text={getLimitMessage("templates", billing)}
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

        <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid min-w-0 gap-5">
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
                    form.cover_url
                      ? "Cover image is added. Change or delete it."
                      : "Add a cover image for the public menu hero."
                  }
                />
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Accent Color
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                Choose one brand color. The template keeps the clean background
                and readable text automatically.
              </p>

              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                <Field label="Primary color">
                  <Input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateField("primary_color", e.target.value)
                    }
                    disabled={appearanceLocked}
                  />
                </Field>

                <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
                    Current accent
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-2xl border border-white/10"
                      style={{ backgroundColor: form.primary_color }}
                    />

                    <p
                      className="text-sm font-black text-white/70"
                      dir="ltr"
                    >
                      {form.primary_color}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Template
              </h2>

              <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                Choose the public menu layout style. Locked templates depend on
                the client plan.
              </p>

              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
                {TEMPLATES.map((template) => {
                  const active = form.template_id === template.id;
                  const templateLocked = Boolean(
                    billing && !canUseTemplate(billing, template.id)
                  );

                  return (
                    <button
                      key={template.id}
                      type="button"
                      disabled={appearanceLocked || templateLocked}
                      onClick={() => selectTemplate(template.id)}
                      className={`min-w-0 rounded-[24px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        active
                          ? "border-[#ff7a00] bg-[#ff7a00]/10"
                          : "border-white/10 bg-black/25 hover:border-white/20"
                      }`}
                    >
                      <div className="grid h-28 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        {templateLocked ? (
                          <Lock size={24} className="text-white/25" />
                        ) : (
                          <div
                            className="h-12 w-20 rounded-2xl"
                            style={{ backgroundColor: form.primary_color }}
                          />
                        )}
                      </div>

                      <h3 className="mt-4 truncate text-lg font-black">
                        {template.name}
                      </h3>

                      <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                        {template.description}
                      </p>

                      <p
                        className={`mt-4 text-xs font-black uppercase tracking-[0.18em] ${
                          active
                            ? "text-[#ffbd7c]"
                            : templateLocked
                              ? "text-red-200/60"
                              : "text-white/25"
                        }`}
                      >
                        {active
                          ? "Selected"
                          : templateLocked
                            ? "Locked"
                            : "Choose"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="min-w-0 2xl:sticky 2xl:top-6 2xl:self-start">
            <Card className="min-w-0 overflow-hidden p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/30">
                Live preview
              </p>

              <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#f7f4ef] text-[#111111]">
                <div className="h-36 bg-black/10">
                  {form.cover_url ? (
                    <img
                      src={form.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm font-black opacity-40">
                      No cover image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/10">
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