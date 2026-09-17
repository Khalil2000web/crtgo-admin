import { useEffect, useMemo, useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { initializePaddle } from "@paddle/paddle-js";
import { supabase } from "../lib/supabase";
import { useAdminI18n } from "../lib/adminI18n";

export default function BillingPage() {
  const { language } = useAdminI18n();
  const ar = language === "ar";
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);

  async function load() {
    setLoading(true);
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
        const { data, error } = await supabase.from("subscriptions").select("*").eq("menu_id", menuData.id).maybeSingle();
        if (error) throw error;
        setSubscription(data || null);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const active = useMemo(() => ["active", "trialing"].includes(subscription?.status), [subscription]);

  async function startCheckout() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paddle-checkout-session", { body: {} });
      if (error) throw error;
      if (data?.alreadyActive) {
        await load();
        return toast.success(ar ? "الاشتراك فعّال بالفعل." : "Your subscription is already active.");
      }

      const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
      if (!token) throw new Error("Missing VITE_PADDLE_CLIENT_TOKEN");
      const environment = import.meta.env.VITE_PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
      const paddle = await initializePaddle({ token, environment });
      if (!paddle) throw new Error("Paddle failed to initialize.");

      paddle.Checkout.open({
        items: [{ priceId: data.checkout.priceId, quantity: 1 }],
        customer: data.checkout.customerEmail ? { email: data.checkout.customerEmail } : undefined,
        customData: data.checkout.customData,
        settings: { displayMode: "overlay", theme: "dark" },
      });
    } catch (error) {
      toast.error(error?.message || (ar ? "تعذر فتح الدفع." : "Could not open checkout."));
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paddle-portal-session", { body: {} });
      if (error) throw error;
      if (!data?.url) throw new Error("No billing portal URL returned.");
      window.location.href = data.url;
    } catch (error) {
      toast.error(error?.message || (ar ? "تعذر فتح بوابة الفوترة." : "Could not open billing portal."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Page><Loader2 className="animate-spin text-[#ff7a00]"/></Page>;
  if (!menu) return <Page><div className="rounded-[26px] border border-white/10 bg-[#111] p-6"><h1 className="text-2xl font-black">{ar ? "لم يتم تفعيل مطعم لهذا الحساب بعد." : "No restaurant has been provisioned for this account yet."}</h1></div></Page>;

  return (
    <Page>
      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff7a00]">CRTGO BILLING</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">{ar ? "الفوترة" : "Billing"}</h1>
      <p className="mt-2 text-sm font-bold text-white/35">{menu.business_name}</p>

      <div className="mt-8 max-w-2xl rounded-[28px] border border-white/10 bg-[#111] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">{ar ? "الخطة" : "Plan"}</p>
            <h2 className="mt-2 text-2xl font-black">{plan?.name || "CRTGO Menu"}</h2>
            <p className="mt-2 text-sm font-bold text-white/40">{plan ? `${plan.monthly_price} ${plan.currency} / ${ar ? "شهرياً" : "month"}` : "—"}</p>
          </div>
          <div className={`rounded-full px-3 py-2 text-xs font-black ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/45"}`}>{subscription?.status || (ar ? "غير مشترك" : "No subscription")}</div>
        </div>

        {subscription?.current_period_end && <p className="mt-5 text-xs font-bold text-white/35">{ar ? "نهاية الفترة الحالية:" : "Current period ends:"} {new Date(subscription.current_period_end).toLocaleDateString()}</p>}

        <button onClick={active ? openPortal : startCheckout} disabled={busy} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-black text-black disabled:opacity-60">
          {busy ? <Loader2 size={17} className="animate-spin"/> : active ? <ExternalLink size={17}/> : <CreditCard size={17}/>} {active ? (ar ? "إدارة الاشتراك" : "Manage subscription") : (ar ? "بدء الاشتراك" : "Start subscription")}
        </button>
      </div>
    </Page>
  );
}

function Page({ children }) { return <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">{children}</div>; }
