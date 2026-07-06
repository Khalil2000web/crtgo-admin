import { supabase } from "./supabase";

export const FALLBACK_LIMITS = {
  max_branches: 1,
  max_items: 20,
  templates: ["classic"],
  custom_cover: false,
  section_pages: true,
};

export function normalizeLimits(limits) {
  return {
    ...FALLBACK_LIMITS,
    ...(limits || {}),
    templates: Array.isArray(limits?.templates)
      ? limits.templates
      : FALLBACK_LIMITS.templates,
  };
}

export async function loadBusinessBilling(businessId) {
  if (!businessId) return null;

  const { data, error } = await supabase
    .from("business_subscriptions")
    .select(`
      business_id,
      plan_id,
      status,
      current_period_end,
      last_payment_amount,
      currency,
      payment_method,
      internal_note,
      updated_at,
      billing_plans (
        id,
        name,
        description,
        monthly_price,
        currency,
        limits
      )
    `)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      business_id: businessId,
      plan_id: "free",
      status: "active",
      plan: {
        id: "free",
        name: "Free",
        limits: FALLBACK_LIMITS,
      },
      limits: FALLBACK_LIMITS,
    };
  }

  const plan = data.billing_plans || null;
  const limits = normalizeLimits(plan?.limits);

  return {
    ...data,
    plan,
    limits,
  };
}

export function isSubscriptionLocked(billing) {
  const status = billing?.status || "active";

  return status === "paused" || status === "canceled" || status === "past_due";
}

export function canCreateBranch(billing, currentBranchCount) {
  if (isSubscriptionLocked(billing)) return false;

  const max = Number(billing?.limits?.max_branches ?? 1);

  return currentBranchCount < max;
}

export function canCreateItem(billing, currentItemCount) {
  if (isSubscriptionLocked(billing)) return false;

  const max = Number(billing?.limits?.max_items ?? 20);

  return currentItemCount < max;
}

export function canUseTemplate(billing, templateId) {
  if (isSubscriptionLocked(billing)) return false;

  const templates = billing?.limits?.templates || ["classic"];

  return templates.includes(templateId);
}

export function canUseCustomCover(billing) {
  if (isSubscriptionLocked(billing)) return false;

  return Boolean(billing?.limits?.custom_cover);
}

export function getLimitMessage(type, billing) {
  const planName = billing?.plan?.name || billing?.plan_id || "your plan";

  if (isSubscriptionLocked(billing)) {
    return `This business subscription is ${billing?.status}. Editing is locked.`;
  }

  if (type === "branches") {
    return `${planName} allows up to ${billing?.limits?.max_branches} branches.`;
  }

  if (type === "items") {
    return `${planName} allows up to ${billing?.limits?.max_items} items.`;
  }

  if (type === "templates") {
    return `${planName} does not include this template.`;
  }

  if (type === "cover") {
    return `${planName} does not include custom cover images.`;
  }

  return `This action is not available on ${planName}.`;
}