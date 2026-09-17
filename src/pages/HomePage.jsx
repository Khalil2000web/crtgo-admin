import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleCheck,
  CircleDashed,
  CreditCard,
  ExternalLink,
  Globe2,
  Loader2,
  Menu as MenuIcon,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function HomePage() {
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

      const { data: menuData } = await supabase
        .from("menus")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

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
          const { count } = await supabase
            .from("items")
            .select("id", { count: "exact", head: true })
            .in("category_id", ids);
          itemCount = count || 0;
        }

        if (!alive) return;
        setCounts({ categories: categoryCount || 0, items: itemCount });
        setSubscription(subscriptionData || null);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const publicUrl = useMemo(
    () => (menu ? `https://menu.crtrgo.com/${menu.slug}` : ""),
    [menu]
  );

  if (loading) {
    return <Page><Loader2 className="animate-spin text-[#ff7a00]" /></Page>;
  }

  if (!menu) {
    return (
      <Page>
        <div className="max-w-2xl rounded-[28px] border border-white/10 bg-[#111] p-7">
          <p className="text-xs font-black text-white/35">الرئيسية</p>
          <h1 className="mt-2 text-3xl font-black">لم يتم ربط مطعم بالحساب</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-white/40">بعد إضافة المطعم إلى الحساب ستظهر إعدادات القائمة والفوترة هنا.</p>
        </div>
      </Page>
    );
  }

  const languages = menu.enabled_languages || [menu.default_language || "ar"];
  const setup = [
    { label: "بيانات المطعم", done: Boolean(menu.business_name) },
    { label: "الأقسام", done: counts.categories > 0 },
    { label: "العناصر", done: counts.items > 0 },
    { label: "اللغات", done: languages.length > 0 },
    { label: "نشر القائمة", done: Boolean(menu.is_published) },
  ];
  const doneCount = setup.filter((row) => row.done).length;
  const progress = Math.round((doneCount / setup.length) * 100);

  return (
    <Page>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-white/35">الرئيسية</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">{menu.business_name}</h1>
          <p className="mt-2 text-sm font-bold text-white/30" dir="ltr">menu.crtrgo.com/{menu.slug}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/menu" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-black text-black">
            تعديل القائمة <ArrowLeft size={16} />
          </Link>
          {menu.is_published && (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.04]">
              فتح القائمة <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<MenuIcon size={18} />} label="الأقسام" value={counts.categories} />
        <Stat icon={<Package size={18} />} label="العناصر" value={counts.items} />
        <Stat icon={<Globe2 size={18} />} label="اللغات" value={languages.length} />
        <Stat icon={<CreditCard size={18} />} label="الاشتراك" value={statusLabel(subscription?.status)} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#111] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">إعداد القائمة</h2>
              <p className="mt-2 text-sm font-bold text-white/35">الأشياء الأساسية المطلوبة قبل الاستخدام.</p>
            </div>
            <div className="text-2xl font-black text-[#ff7a00]">{progress}%</div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-[#ff7a00]" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {setup.map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                {row.done ? (
                  <CircleCheck size={18} className="text-emerald-400" />
                ) : (
                  <CircleDashed size={18} className="text-white/25" />
                )}
                <span className="text-sm font-black text-white/70">{row.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <Link to="/menu" className="rounded-[26px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
            <MenuIcon className="text-[#ff7a00]" />
            <h2 className="mt-5 text-xl font-black">القائمة</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/35">الأقسام، العناصر، الأسعار، الصور واللغات.</p>
          </Link>

          <Link to="/billing" className="rounded-[26px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
            <CreditCard className="text-[#ff7a00]" />
            <h2 className="mt-5 text-xl font-black">الفوترة</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/35">الخطة الحالية وحالة الدفع.</p>
          </Link>
        </section>
      </div>
    </Page>
  );
}

function statusLabel(status) {
  const labels = {
    active: "فعال",
    trialing: "تجريبي",
    incomplete: "غير مكتمل",
    past_due: "متأخر",
    paused: "موقوف",
    canceled: "ملغي",
  };
  return labels[status] || "غير مشترك";
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111] p-5">
      <div className="flex items-center gap-2 text-[#ff7a00]">
        {icon}
        <span className="text-xs font-black text-white/30">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
    </div>
  );
}

function Page({ children }) {
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}
