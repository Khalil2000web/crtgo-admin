import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { useConfirm } from "./ConfirmProvider";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Textarea,
} from "./ui";

const TEMPLATE_OPTIONS = [
  { id: "classic", label: "Classic", description: "Default scrolling menu." },
  {
    id: "clean_cards",
    label: "Clean Cards",
    description: "Section cards with separate section pages.",
  },
  { id: "modern", label: "Modern", description: "Split modern layout." },
  { id: "luxury", label: "Luxury", description: "Premium visual layout." },
];

const LANGUAGE_OPTIONS = [
  { id: "ar", label: "Arabic", native: "العربية" },
  { id: "he", label: "Hebrew", native: "עברית" },
  { id: "en", label: "English", native: "English" },
];

const KNOWN_LIMIT_KEYS = new Set([
  "max_branches",
  "max_items",
  "templates",
  "custom_cover",
  "section_pages",
  "languages",
  "qr_codes",
]);

const DEFAULT_FORM = {
  id: "",
  name: "",
  description: "",
  monthly_price: "",
  currency: "ILS",
  max_branches: 1,
  max_items: 20,
  templates: ["classic"],
  custom_cover: false,
  section_pages: true,
  languages: ["ar"],
  qr_codes: true,
  is_active: true,
  sort_order: 1,
  extra_limits_json: "{}",
};

async function loadPlans() {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data || [];
}

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

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeTemplates(value) {
  const templates = Array.isArray(value) ? value : ["classic"];
  const clean = unique(templates.map(normalizeTemplateId));

  return clean.length ? clean : ["classic"];
}

function normalizeLanguages(value) {
  const languages = Array.isArray(value) ? value : ["ar"];

  const clean = unique(
    languages
      .map((language) => String(language || "").toLowerCase())
      .filter((language) => LANGUAGE_OPTIONS.some((item) => item.id === language))
  );

  return clean.length ? clean : ["ar"];
}

function extractExtraLimits(limits) {
  const extra = {};

  Object.entries(limits || {}).forEach(([key, value]) => {
    if (!KNOWN_LIMIT_KEYS.has(key)) {
      extra[key] = value;
    }
  });

  return JSON.stringify(extra, null, 2);
}

function planToForm(plan) {
  const limits = plan?.limits || {};

  return {
    id: plan?.id || "",
    name: plan?.name || "",
    description: plan?.description || "",
    monthly_price: plan?.monthly_price ?? "",
    currency: plan?.currency || "ILS",
    max_branches: limits.max_branches ?? "",
    max_items: limits.max_items ?? "",
    templates: normalizeTemplates(limits.templates),
    custom_cover: Boolean(limits.custom_cover),
    section_pages: limits.section_pages !== false,
    languages: normalizeLanguages(limits.languages),
    qr_codes: limits.qr_codes !== false,
    is_active: plan?.is_active !== false,
    sort_order: plan?.sort_order ?? 1,
    extra_limits_json: extractExtraLimits(limits),
  };
}

function cleanPlanId(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, number);
}

function cleanLimit(value) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.floor(number));
}

function limitLabel(value) {
  if (value === null || value === undefined || value === "") return "∞";
  return value;
}

function parseExtraLimits(value) {
  const clean = String(value || "").trim();

  if (!clean) return {};

  const parsed = JSON.parse(clean);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Extra limits JSON must be an object.");
  }

  return parsed;
}

export default function OwnerPlansManager() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["owner-plans"],
    queryFn: loadPlans,
  });

  const usedPlanIds = useMemo(() => {
    return new Set(plans.map((plan) => plan.id));
  }, [plans]);

  useEffect(() => {
    if (!editingPlan) return;
    setForm(planToForm(editingPlan));
  }, [editingPlan]);

  function openNewPlan() {
    setEditingPlan(null);
    setForm({
      ...DEFAULT_FORM,
      sort_order: plans.length + 1,
    });
    setModalOpen(true);
  }

  function openEditPlan(plan) {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleTemplate(templateId) {
    setForm((current) => {
      const cleanTemplate = normalizeTemplateId(templateId);
      const exists = current.templates.includes(cleanTemplate);

      const nextTemplates = exists
        ? current.templates.filter((item) => item !== cleanTemplate)
        : [...current.templates, cleanTemplate];

      return {
        ...current,
        templates: nextTemplates.length ? nextTemplates : ["classic"],
      };
    });
  }

  function toggleLanguage(languageId) {
    setForm((current) => {
      const exists = current.languages.includes(languageId);

      const nextLanguages = exists
        ? current.languages.filter((item) => item !== languageId)
        : [...current.languages, languageId];

      return {
        ...current,
        languages: nextLanguages.length ? nextLanguages : ["ar"],
      };
    });
  }

  async function savePlan(e) {
    e.preventDefault();

    const planId = cleanPlanId(form.id);

    if (!planId) {
      toast.error("Plan ID is required");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    let extraLimits = {};

    try {
      extraLimits = parseExtraLimits(form.extra_limits_json);
    } catch (err) {
      toast.error(err.message || "Invalid extra limits JSON");
      return;
    }

    const ok = await confirm({
      title: editingPlan ? "Save plan changes?" : "Create new plan?",
      message: editingPlan
        ? "These changes will affect client limits and public menu behavior."
        : "This plan will become available for billing.",
      confirmText: editingPlan ? "Save plan" : "Create plan",
    });

    if (!ok) return;

    setSaving(true);

    try {
      if (!editingPlan && usedPlanIds.has(planId)) {
        throw new Error("A plan with this ID already exists.");
      }

      const limits = {
        ...extraLimits,
        max_branches: cleanLimit(form.max_branches),
        max_items: cleanLimit(form.max_items),
        templates: normalizeTemplates(form.templates),
        custom_cover: Boolean(form.custom_cover),
        section_pages: Boolean(form.section_pages),
        languages: normalizeLanguages(form.languages),
        qr_codes: Boolean(form.qr_codes),
      };

      const payload = {
        id: planId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        monthly_price:
          form.monthly_price === "" ? null : Number(form.monthly_price),
        currency: form.currency.trim().toUpperCase() || "ILS",
        is_active: Boolean(form.is_active),
        sort_order: cleanNumber(form.sort_order, 1),
        limits,
      };

      const { error } = await supabase
        .from("billing_plans")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      toast.success(editingPlan ? "Plan updated" : "Plan created");

      setModalOpen(false);
      setEditingPlan(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-plans"] }),
        queryClient.invalidateQueries({ queryKey: ["owner-billing"] }),
        queryClient.invalidateQueries({ queryKey: ["businesses"] }),
      ]);
    } catch (err) {
      toast.error(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan) {
    if (plan.id === "free") {
      toast.error("Do not delete the free plan. Deactivate it if needed.");
      return;
    }

    const ok = await confirm({
      title: "Delete plan?",
      message:
        "Only delete a plan if no client is using it. Otherwise, deactivate it instead.",
      confirmText: "Delete plan",
      danger: true,
    });

    if (!ok) return;

    setDeletingPlanId(plan.id);

    try {
      const { error } = await supabase
        .from("billing_plans")
        .delete()
        .eq("id", plan.id);

      if (error) throw error;

      toast.success("Plan deleted");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-plans"] }),
        queryClient.invalidateQueries({ queryKey: ["owner-billing"] }),
      ]);
    } catch (err) {
      toast.error(
        err.message ||
          "Could not delete plan. It may already be used by clients."
      );
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff7a00]">
            Owner Plans
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
            Plans, Prices & Limits
          </h2>

          <p className="mt-1 text-sm font-bold leading-6 text-white/35">
            Edit what every plan allows. These limits control the client UI and
            public menu behavior.
          </p>
        </div>

        <Button type="button" onClick={openNewPlan}>
          <Plus size={16} />
          New plan
        </Button>
      </div>

      {isLoading && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-bold text-white/35">
          Loading plans...
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm font-bold text-red-200">
          {error.message}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const limits = plan.limits || {};

          return (
            <div
              key={plan.id}
              className="rounded-[24px] border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black">{plan.name}</h3>

                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-white/30">
                    {plan.id}
                  </p>
                </div>

                <Badge tone={plan.is_active ? "success" : "warning"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="mt-4 text-2xl font-black tracking-[-0.05em]">
                {plan.monthly_price ?? 0} {plan.currency}
              </p>

              <div className="mt-4 grid gap-2 text-sm font-bold text-white/55">
                <PlanLimitLine
                  label="Branches"
                  value={limitLabel(limits.max_branches)}
                />
                <PlanLimitLine
                  label="Items"
                  value={limitLabel(limits.max_items)}
                />
                <PlanLimitLine
                  label="Templates"
                  value={
                    normalizeTemplates(limits.templates).join(", ") || "classic"
                  }
                />
                <PlanLimitLine
                  label="Languages"
                  value={normalizeLanguages(limits.languages).join(", ")}
                />
                <PlanLimitLine
                  label="Cover"
                  value={limits.custom_cover ? "Allowed" : "Locked"}
                />
                <PlanLimitLine
                  label="Section pages"
                  value={limits.section_pages === false ? "Locked" : "Allowed"}
                />
                <PlanLimitLine
                  label="QR codes"
                  value={limits.qr_codes === false ? "Locked" : "Allowed"}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditPlan(plan)}
                >
                  <Pencil size={14} />
                  Edit
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  loading={deletingPlanId === plan.id}
                  disabled={plan.id === "free"}
                  onClick={() => deletePlan(plan)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        title={editingPlan ? "Edit Plan" : "New Plan"}
        maxWidth="max-w-4xl"
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
      >
        <form onSubmit={savePlan} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Plan ID">
              <Input
                value={form.id}
                disabled={Boolean(editingPlan)}
                onChange={(e) => updateField("id", cleanPlanId(e.target.value))}
                placeholder="starter"
                dir="ltr"
              />
            </Field>

            <Field label="Plan name">
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Starter"
              />
            </Field>

            <Field label="Monthly price">
              <Input
                type="number"
                step="0.01"
                value={form.monthly_price}
                onChange={(e) => updateField("monthly_price", e.target.value)}
                placeholder="99"
                dir="ltr"
              />
            </Field>

            <Field label="Currency">
              <Input
                value={form.currency}
                onChange={(e) =>
                  updateField("currency", e.target.value.toUpperCase())
                }
                placeholder="ILS"
                dir="ltr"
              />
            </Field>

            <Field label="Max branches">
              <Input
                type="number"
                value={form.max_branches}
                onChange={(e) => updateField("max_branches", e.target.value)}
                placeholder="Leave empty for unlimited"
                dir="ltr"
              />
            </Field>

            <Field label="Max items">
              <Input
                type="number"
                value={form.max_items}
                onChange={(e) => updateField("max_items", e.target.value)}
                placeholder="Leave empty for unlimited"
                dir="ltr"
              />
            </Field>

            <Field label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => updateField("sort_order", e.target.value)}
                dir="ltr"
              />
            </Field>

            <div className="flex items-end">
              <label className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white/65">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                />
                Active plan
              </label>
            </div>
          </div>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe this plan..."
            />
          </Field>

          <div className="grid gap-4 lg:grid-cols-2">
            <FeatureBox title="Allowed templates">
              {TEMPLATE_OPTIONS.map((template) => (
                <CheckRow
                  key={template.id}
                  title={template.label}
                  description={template.description}
                  checked={form.templates.includes(template.id)}
                  onChange={() => toggleTemplate(template.id)}
                />
              ))}
            </FeatureBox>

            <FeatureBox title="Allowed languages">
              {LANGUAGE_OPTIONS.map((language) => (
                <CheckRow
                  key={language.id}
                  title={language.label}
                  description={language.native}
                  checked={form.languages.includes(language.id)}
                  onChange={() => toggleLanguage(language.id)}
                />
              ))}
            </FeatureBox>
          </div>

          <FeatureBox title="Feature switches">
            <CheckRow
              title="Allow custom cover"
              description="Client can upload and use public menu cover images."
              checked={form.custom_cover}
              onChange={() => updateField("custom_cover", !form.custom_cover)}
            />

            <CheckRow
              title="Allow section pages"
              description="Client can use templates that open each section as its own page."
              checked={form.section_pages}
              onChange={() => updateField("section_pages", !form.section_pages)}
            />

            <CheckRow
              title="Allow QR codes"
              description="Client can create and use permanent CRTGO QR links."
              checked={form.qr_codes}
              onChange={() => updateField("qr_codes", !form.qr_codes)}
            />
          </FeatureBox>

          <Field label="Extra limits JSON">
            <Textarea
              value={form.extra_limits_json}
              onChange={(e) => updateField("extra_limits_json", e.target.value)}
              dir="ltr"
              rows={6}
              placeholder={`{\n  "analytics": true,\n  "team_members": 2\n}`}
            />
          </Field>

          <Button type="submit" loading={saving} loadingText="Saving plan...">
            <Save size={16} />
            Save plan
          </Button>
        </form>
      </Modal>
    </Card>
  );
}

function FeatureBox({ title, children }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
      <p className="text-sm font-black text-white">{title}</p>

      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function CheckRow({ title, description, checked, onChange }) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black text-white/65">
      <span className="min-w-0">
        <span className="block text-white/80">{title}</span>
        {description && (
          <span className="mt-1 block text-xs font-bold leading-5 text-white/35">
            {description}
          </span>
        )}
      </span>

      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

function PlanLimitLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2">
      <span className="text-white/35">{label}</span>
      <span className="text-white/75">{value}</span>
    </div>
  );
}