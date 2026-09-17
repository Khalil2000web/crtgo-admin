import { useEffect, useMemo, useState } from "react";
import { CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { initializePaddle } from "@paddle/paddle-js";
import { supabase } from "../lib/supabase";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const [{ data: menuData, error: menuError }, { data: planData, error: planError }] = await Promise.all([
        supabase.from("menus").select("id, business_name, slug").eq("owner_id", user.id).maybeSingle(),
        supabase.from("billing_config").select("id, name, monthly_price, currency, is_active").eq("id", "standard").maybeSingle(),
      ]);

      if (menuError) throw menuError;
      if (planError) throw planError;

      setMenu(menuData || null);
      setPlan(planData || null);

      if (menuData) {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("menu_id", menuData.id)
          .maybeSingle();

        if (error) throw error;
        setSubscription(data || null);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const active = useMemo(
    () => ["active", "trialing"].includes(subscription?.status),
    [subscription]
  );

  const canOpenPortal = Boolean(
    subscription?.paddle_customer_id &&
    ["active", "trialing", "past_due", "paused", "canceled"].includes(subscription?.status)
  );

  async function refreshAfterCheckout() {
    for (const delay of [1000, 2500, 5000]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await load({ silent: true });
    }
  }

  async function startCheckout() {
    setBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-paddle-checkout-session",
        { body: {} }
      );

      if (error) throw error;

      if (data?.alreadyActive) {
        await load({ silent: true });
        toast.success("الاشتراك فعال.");
        return;
      }

      const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
      if (!token) throw new Error("VITE_PADDLE_CLIENT_TOKEN غير موجود.");

      const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT === "production"
        ? "production"
        : "sandbox";

      const paddle = await initializePaddle({
        token,
        environment,
        locale: "ar",
        eventCallback: async (event) => {
          if (event?.name === "checkout.completed") {
            toast.success("تم الدفع. جارٍ تحديث الاشتراك...");
            await refreshAfterCheckout();
          }
        },
      });

      if (!paddle) throw new Error("تعذر تشغيل Paddle.");

      paddle.Checkout.open({
        items: [{ priceId: data.checkout.priceId, quantity: 1 }],
        customer: data.checkout.customerEmail
          ? { email: data.checkout.customerEmail }
          : undefined,
        customData: data.checkout.customData,
        settings: {
          displayMode: "overlay",
          theme: "dark",
          locale: "ar",
        },
      });
    } catch (error) {
      toast.error(error?.message || "تعذر فتح الدفع.");
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-paddle-portal-session",
        { body: {} }
      );

      if (error) throw error;
      if (!data?.url) throw new Error("لم يتم إنشاء رابط الفوترة.");

      window.location.href = data.url;
    } catch (error) {
      toast.error(error?.message || "تعذر فتح إدارة الاشتراك.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Page><Loader2 className="animate-spin text-[#ff7a00]" /></Page>;
  }

  if (!menu) {
    return (
      <Page>
        <div className="rounded-[26px] border border-white/10 bg-[#111] p-6">
          <h1 className="text-2xl font-black">لا يوجد مطعم مرتبط بهذا الحساب.</h1>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-white/35">الفوترة</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">الاشتراك</h1>
          <p className="mt-2 text-sm font-bold text-white/35">{menu.business_name}</p>
        </div>

        <button
          onClick={() => load()}
          disabled={loading || busy}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/55 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} /> تحديث
        </button>
      </div>

      <div className="mt-8 max-w-2xl rounded-[28px] border border-white/10 bg-[#111] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black text-white/30">الخطة</p>
            <h2 className="mt-2 text-2xl font-black">{plan?.name || "CRTGO Menu"}</h2>
            <p className="mt-2 text-sm font-bold text-white/40">
              {plan ? `${Number(plan.monthly_price).toFixed(0)} ${plan.currency} شهرياً` : "—"}
            </p>
          </div>

          <div className={`w-fit rounded-full px-3 py-2 text-xs font-black ${statusTone(subscription?.status)}`}>
            {statusLabel(subscription?.status)}
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-sm font-bold text-white/45">
          {subscription?.next_billed_at && (
            <Row
              label="الدفعة القادمة"
              value={new Date(subscription.next_billed_at).toLocaleDateString("ar-IL")}
            />
          )}
          {subscription?.current_period_end && (
            <Row
              label="نهاية الفترة"
              value={new Date(subscription.current_period_end).toLocaleDateString("ar-IL")}
            />
          )}
          <Row label="السعر" value={plan ? `${Number(plan.monthly_price).toFixed(0)} ${plan.currency}` : "—"} />
        </div>

        <button
          onClick={canOpenPortal ? openPortal : startCheckout}
          disabled={busy || !plan?.is_active}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-black text-black disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={17} className="animate-spin" />
          ) : canOpenPortal ? (
            <ExternalLink size={17} />
          ) : (
            <CreditCard size={17} />
          )}
          {canOpenPortal ? "إدارة الاشتراك" : active ? "الاشتراك فعال" : "الاشتراك الآن"}
        </button>
      </div>
    </Page>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-white/75">{value}</span>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    active: "فعال",
    trialing: "تجريبي",
    incomplete: "غير مكتمل",
    past_due: "دفعة متأخرة",
    paused: "موقوف",
    canceled: "ملغي",
  };

  return labels[status] || "غير مشترك";
}

function statusTone(status) {
  if (["active", "trialing"].includes(status)) {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (status === "past_due") {
    return "bg-amber-500/15 text-amber-300";
  }

  if (["canceled", "paused"].includes(status)) {
    return "bg-red-500/10 text-red-300";
  }

  return "bg-white/5 text-white/45";
}

function Page({ children }) {
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}
