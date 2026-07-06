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
  { id: "classic", label: "Clean Cards" },
  { id: "modern", label: "One Page" },
  { id: "luxury", label: "Luxury" },
];

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
  is_active: true,
  sort_order: 1,
};

async function loadPlans() {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data || [];
}

function planToForm(plan) {
  const limits = plan?.limits || {};

  return {
    id: plan?.id || "",
    name: plan?.name || "",
    description: plan?.description || "",
    monthly_price: plan?.monthly_price ?? "",
    currency: plan?.currency || "ILS",
    max_branches: limits.max_branches ?? 1,
    max_items: limits.max_items ?? 20,
    templates: Array.isArray(limits.templates) ? limits.templates : ["classic"],
    custom_cover: Boolean(limits.custom_cover),
    section_pages: limits.section_pages !== false,
    is_active: plan?.is_active !== false,
    sort_order: plan?.sort_order ?? 1,
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
      const exists = current.templates.includes(templateId);

      const nextTemplates = exists
        ? current.templates.filter((item) => item !== templateId)
        : [...current.templates, templateId];

      return {
        ...current,
        templates: nextTemplates.length ? nextTemplates : ["classic"],
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

    const ok = await confirm({
      title: editingPlan ? "Save plan changes?" : "Create new plan?",
      message: editingPlan
        ? "These changes will affect client limits and available features."
        : "This plan will become available for billing.",
      confirmText: editingPlan ? "Save plan" : "Create plan",
    });

    if (!ok) return;

    setSaving(true);

    try {
      if (!editingPlan && usedPlanIds.has(planId)) {
        throw new Error("A plan with this ID already exists.");
      }

      const payload = {
        id: planId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        monthly_price:
          form.monthly_price === "" ? null : Number(form.monthly_price),
        currency: form.currency.trim().toUpperCase() || "ILS",
        is_active: Boolean(form.is_active),
        sort_order: cleanNumber(form.sort_order, 1),
        limits: {
          max_branches: cleanNumber(form.max_branches, 1),
          max_items: cleanNumber(form.max_items, 20),
          templates: form.templates.length ? form.templates : ["classic"],
          custom_cover: Boolean(form.custom_cover),
          section_pages: Boolean(form.section_pages),
        },
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
            Edit what every plan allows. These limits control the client UI.
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
                  value={limits.max_branches ?? "∞"}
                />
                <PlanLimitLine label="Items" value={limits.max_items ?? "∞"} />
                <PlanLimitLine
                  label="Templates"
                  value={(limits.templates || []).join(", ") || "—"}
                />
                <PlanLimitLine
                  label="Cover"
                  value={limits.custom_cover ? "Allowed" : "Locked"}
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
                onChange={(e) =>
                  updateField("monthly_price", e.target.value)
                }
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
                dir="ltr"
              />
            </Field>

            <Field label="Max items">
              <Input
                type="number"
                value={form.max_items}
                onChange={(e) => updateField("max_items", e.target.value)}
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

          <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-black text-white">Allowed templates</p>

            <div className="mt-3 grid gap-2">
              {TEMPLATE_OPTIONS.map((template) => (
                <label
                  key={template.id}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-white/65"
                >
                  <span>{template.label}</span>

                  <input
                    type="checkbox"
                    checked={form.templates.includes(template.id)}
                    onChange={() => toggleTemplate(template.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white/65">
              <span>Allow custom cover</span>

              <input
                type="checkbox"
                checked={form.custom_cover}
                onChange={(e) => updateField("custom_cover", e.target.checked)}
              />
            </label>

            <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white/65">
              <span>Allow section pages</span>

              <input
                type="checkbox"
                checked={form.section_pages}
                onChange={(e) => updateField("section_pages", e.target.checked)}
              />
            </label>
          </div>

          <Button type="submit" loading={saving} loadingText="Saving plan...">
            <Save size={16} />
            Save plan
          </Button>
        </form>
      </Modal>
    </Card>
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