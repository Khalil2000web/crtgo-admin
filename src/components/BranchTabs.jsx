import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Info,
  Languages,
  Lock,
  Menu,
  Palette,
  QrCode,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useAdminI18n } from "../lib/adminI18n";
import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canUseQrCodes,
  getAllowedLanguages,
  isSubscriptionLocked,
} from "../lib/billing";

async function loadBranchTabsMeta(branchId) {
  if (!branchId) return null;

  const { data, error } = await supabase
    .from("branches")
    .select(`
      id,
      status,
      business_id
    `)
    .eq("id", branchId)
    .single();

  if (error) throw error;

  return data;
}

export default function BranchTabs({ branchId }) {
  const { t } = useAdminI18n();

  const { data: branchMeta } = useQuery({
    queryKey: ["branch-tabs-meta", branchId],
    queryFn: () => loadBranchTabsMeta(branchId),
    enabled: Boolean(branchId),
  });

  const { data: billing, isLoading: billingLoading } = useBusinessBilling(
    branchMeta?.business_id
  );

  const lockedState = useMemo(() => {
    const branchArchived = branchMeta?.status === "archived";
    const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));

    const globalLocked = branchArchived || subscriptionLocked;

    const allowedLanguages = billing ? getAllowedLanguages(billing) : [];
    const noLanguagesAllowed =
      Boolean(billing) && !billingLoading && allowedLanguages.length === 0;

    const qrLocked =
      globalLocked || Boolean(billing && !canUseQrCodes(billing));

    return {
      globalLocked,
      branchArchived,
      subscriptionLocked,
      languagesLocked: globalLocked || noLanguagesAllowed,
      qrLocked,
      allowedLanguages,
    };
  }, [branchMeta?.status, billing, billingLoading]);

  const tabs = [
    {
      to: `/branch/${branchId}/general`,
      label: t("branchTabs.general"),
      icon: <Info size={16} />,
      locked: lockedState.globalLocked,
    },
    {
      to: `/branch/${branchId}/menu`,
      label: t("branchTabs.menu"),
      icon: <Menu size={16} />,
      locked: lockedState.globalLocked,
    },
    {
      to: `/branch/${branchId}/appearance`,
      label: t("branchTabs.appearance"),
      icon: <Palette size={16} />,
      locked: lockedState.globalLocked,
    },
    {
      to: `/branch/${branchId}/hours`,
      label: t("branchTabs.hours"),
      icon: <Clock size={16} />,
      locked: lockedState.globalLocked,
    },
    {
      to: `/branch/${branchId}/languages`,
      label: t("branchTabs.languages"),
      icon: <Languages size={16} />,
      locked: lockedState.languagesLocked,
      badge:
        lockedState.allowedLanguages.length > 0
          ? lockedState.allowedLanguages.join(", ").toUpperCase()
          : null,
    },
    {
      to: `/branch/${branchId}/qr`,
      label: t("branchTabs.qr"),
      icon: <QrCode size={16} />,
      locked: lockedState.qrLocked,
    },
  ];

  return (
    <div className="overflow-x-auto border-b border-white/10 px-4 py-6 sm:px-6">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition ${
                isActive
                  ? tab.locked
                    ? "bg-red-500/15 text-red-100 ring-1 ring-red-400/20"
                    : "bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/10"
                  : tab.locked
                    ? "border border-red-400/15 bg-red-500/10 text-red-100/60 hover:bg-red-500/15 hover:text-red-100"
                    : "border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white"
              }`
            }
          >
            {tab.icon}
            {tab.label}

            {tab.badge && !tab.locked && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white/45">
                {tab.badge}
              </span>
            )}

            {tab.locked && <Lock size={13} />}
          </NavLink>
        ))}
      </div>
    </div>
  );
}