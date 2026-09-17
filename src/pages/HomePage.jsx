import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Menu as MenuIcon, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAdminI18n } from "../lib/adminI18n";

export default function HomePage() {
  const { language } = useAdminI18n();
  const ar = language === "ar";
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [counts, setCounts] = useState({ categories: 0, items: 0 });
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: menuData } = await supabase.from("menus").select("*").eq("owner_id", user.id).maybeSingle();
      if (!alive) return;
      setMenu(menuData || null);

      if (menuData) {
        const [{ count: categoryCount }, { data: categories }, { data: subscriptionData }] = await Promise.all([
          supabase.from("categories").select("id", { count: "exact", head: true }).eq("menu_id", menuData.id),
          supabase.from("categories").select("id").eq("menu_id", menuData.id),
          supabase.from("subscriptions").select("*").eq("menu_id", menuData.id).maybeSingle(),
        ]);
        const ids = (categories || []).map((row) => row.id);
        let itemCount = 0;
        if (ids.length) {
          const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).in("category_id", ids);
          itemCount = count || 0;
        }
        if (!alive) return;
        setCounts({ categories: categoryCount || 0, items: itemCount });
        setSubscription(subscriptionData || null);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  const publicUrl = useMemo(() => menu ? `https://menu.crtrgo.com/${menu.slug}` : "", [menu]);

  if (loading) return <Page><Loader2 className="animate-spin text-[#ff7a00]"/></Page>;

  if (!menu) {
    return (
      <Page>
        <div className="max-w-2xl rounded-[28px] border border-white/10 bg-[#111] p-7">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff7a00]">CRTGO</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.055em]">{ar ? "حسابك جاهز، لكن القائمة لم تُفعّل بعد" : "Your account is ready, but your menu is not provisioned yet"}</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-white/45">{ar ? "نحن ننشئ المطاعم من جهة CRTGO فقط. بعد إضافة مطعمك ستظهر لك أدوات القائمة والفوترة هنا تلقائياً." : "CRTGO provisions restaurants manually. Once your restaurant is added, your menu and billing tools will appear here automatically."}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff7a00]">CRTGO MENU</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">{menu.business_name}</h1>
          <p className="mt-2 text-sm font-bold text-white/35" dir="ltr">/{menu.slug}</p>
        </div>
        {menu.is_published && <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.04]"><ExternalLink size={16}/>{ar ? "فتح القائمة" : "Open menu"}</a>}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label={ar ? "الأقسام" : "Categories"} value={counts.categories}/>
        <Stat label={ar ? "العناصر" : "Items"} value={counts.items}/>
        <Stat label={ar ? "الحالة" : "Status"} value={subscription?.status || (ar ? "غير مشترك" : "No subscription")}/>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/menu" className="rounded-[24px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
          <MenuIcon className="text-[#ff7a00]"/>
          <h2 className="mt-5 text-2xl font-black">{ar ? "إدارة القائمة" : "Manage menu"}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-white/35">{ar ? "الأقسام، الأسعار، الصور، التوفر والنشر." : "Categories, prices, images, availability and publishing."}</p>
        </Link>
        <Link to="/billing" className="rounded-[24px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
          <CreditCard className="text-[#ff7a00]"/>
          <h2 className="mt-5 text-2xl font-black">{ar ? "الفوترة" : "Billing"}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-white/35">{ar ? "الخطة الحالية، حالة الاشتراك وإدارة الدفع." : "Current plan, subscription status and payment management."}</p>
        </Link>
      </div>
    </Page>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-[22px] border border-white/10 bg-[#111] p-5"><p className="text-xs font-black text-white/30">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
function Page({ children }) { return <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">{children}</div>; }
