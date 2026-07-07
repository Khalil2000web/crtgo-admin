import { supabase } from "./supabase";

const LOCKED_STATUSES = new Set(["paused", "canceled", "past_due"]);
const SUPPORTED_LANGUAGES = ["ar", "he", "en"];

const SAFE_EMPTY_LIMITS = {
  max_branches: 0,
  max_items: 0,
  templates: [],
  custom_cover: false,
  section_pages: false,
  languages: [],
  qr_codes: false,
};

export function normalizeTemplateId(value) {
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
  const templates = Array.isArray(value) ? value : [];

  return unique(templates.map(normalizeTemplateId));
}

function normalizeLanguages(value) {
  const languages = Array.isArray(value) ? value : [];

  return unique(
    languages
      .map((language) => String(language || "").toLowerCase())
      .filter((language) => SUPPORTED_LANGUAGES.includes(language))
  );
}

function normalizeLimitNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  if (String(value).toLowerCase() === "unlimited") return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.floor(number));
}

function limitToNumber(value) {
  const clean = normalizeLimitNumber(value);

  if (clean === null) return Infinity;

  return clean;
}

export function normalizeLimits(limits) {
  const source =
    limits && typeof limits === "object" && !Array.isArray(limits)
      ? limits
      : {};

  return {
    ...source,
    max_branches: normalizeLimitNumber(source.max_branches),
    max_items: normalizeLimitNumber(source.max_items),
    templates: normalizeTemplates(source.templates),
    custom_cover: source.custom_cover === true,
    section_pages: source.section_pages === true,
    languages: normalizeLanguages(source.languages),
    qr_codes: source.qr_codes === true,
  };
}

async function loadPlan(planId) {
  const cleanPlanId = String(planId || "").trim();

  if (!cleanPlanId) return null;

  const { data, error } = await supabase
    .from("billing_plans")
    .select(`
      id,
      name,
      description,
      monthly_price,
      currency,
      is_active,
      limits
    `)
    .eq("id", cleanPlanId)
    .maybeSingle();

  if (error) throw error;

  return data || null;
}

function makePlanMissingBilling(businessId, planId = "free") {
  return {
    business_id: businessId,
    plan_id: planId,
    status: "plan_missing",
    plan: null,
    limits: SAFE_EMPTY_LIMITS,
    planMissing: true,
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
        is_active,
        limits
      )
    `)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const freePlan = await loadPlan("free");

    if (!freePlan) {
      return makePlanMissingBilling(businessId, "free");
    }

    return {
      business_id: businessId,
      plan_id: freePlan.id,
      status: "active",
      plan: freePlan,
      limits: normalizeLimits(freePlan.limits),
      planMissing: false,
    };
  }

  const plan = data.billing_plans || (await loadPlan(data.plan_id));

  if (!plan) {
    return makePlanMissingBilling(businessId, data.plan_id || "unknown");
  }

  return {
    ...data,
    plan,
    limits: normalizeLimits(plan.limits),
    planMissing: false,
  };
}

export function isSubscriptionLocked(billing) {
  const status = billing?.status || "active";

  return Boolean(
    billing?.planMissing ||
      LOCKED_STATUSES.has(status) ||
      billing?.plan?.is_active === false
  );
}

export function canCreateBranch(billing, currentBranchCount) {
  if (isSubscriptionLocked(billing)) return false;

  const max = limitToNumber(billing?.limits?.max_branches);

  return currentBranchCount < max;
}

export function canCreateItem(billing, currentItemCount) {
  if (isSubscriptionLocked(billing)) return false;

  const max = limitToNumber(billing?.limits?.max_items);

  return currentItemCount < max;
}

export function canUseTemplate(billing, templateId) {
  if (isSubscriptionLocked(billing)) return false;

  const wantedTemplate = normalizeTemplateId(templateId);
  const templates = normalizeTemplates(billing?.limits?.templates);

  if (wantedTemplate === "clean_cards" && !canUseSectionPages(billing)) {
    return false;
  }

  return templates.includes(wantedTemplate);
}

export function canUseCustomCover(billing) {
  if (isSubscriptionLocked(billing)) return false;

  return billing?.limits?.custom_cover === true;
}

export function canUseSectionPages(billing) {
  if (isSubscriptionLocked(billing)) return false;

  return billing?.limits?.section_pages === true;
}

export function canUseLanguage(billing, languageCode) {
  if (isSubscriptionLocked(billing)) return false;

  const language = String(languageCode || "").toLowerCase();
  const languages = normalizeLanguages(billing?.limits?.languages);

  return languages.includes(language);
}

export function getAllowedLanguages(billing) {
  if (isSubscriptionLocked(billing)) return [];

  return normalizeLanguages(billing?.limits?.languages);
}

export function canUseQrCodes(billing) {
  if (isSubscriptionLocked(billing)) return false;

  return billing?.limits?.qr_codes === true;
}

export function formatLimit(value) {
  if (value === null || value === undefined || value === "") return "∞";

  return String(value);
}

export function getLimitMessage(type, billing) {
  const planName = billing?.plan?.name || billing?.plan_id || "this plan";

  if (billing?.planMissing) {
    return `No billing plan is configured for this business. Create or fix the "${billing?.plan_id || "free"}" plan in Owner Plans.`;
  }

  if (billing?.plan?.is_active === false) {
    return `${planName} is inactive. Activate the plan from Owner Plans or move this client to another plan.`;
  }

  if (isSubscriptionLocked(billing)) {
    return `This business subscription is ${billing?.status}. Editing is locked.`;
  }

  if (type === "branches") {
    return `${planName} allows up to ${formatLimit(
      billing?.limits?.max_branches
    )} branches.`;
  }

  if (type === "items") {
    return `${planName} allows up to ${formatLimit(
      billing?.limits?.max_items
    )} items.`;
  }

  if (type === "templates") {
    return `${planName} does not include this template.`;
  }

  if (type === "cover") {
    return `${planName} does not include custom cover images.`;
  }

  if (type === "section_pages") {
    return `${planName} does not include separate section pages.`;
  }

  if (type === "languages") {
    return `${planName} does not include this language.`;
  }

  if (type === "qr") {
    return `${planName} does not include QR codes.`;
  }

  if (type === "locked") {
    return `${planName} is currently locked.`;
  }

  return `This action is not available on ${planName}.`;
}