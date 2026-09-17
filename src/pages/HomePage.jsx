import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Menu as MenuIcon, CreditCard, CircleCheck, CircleDashed, Store, Globe2 } from "lucide-react";
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

  if (loading) return <Page><Loader2 className="animate-spin text-[#ff7a00]" /></Page>;

  if (!menu) {
    return (
      <Page>
        <div className="max-w-2xl rounded-[30px] border border-white/10 bg-[#111] p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff7a00]">CRTGO</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">حسابك جاهز</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-white/45">لم يتم ربط مطعم بهذا الحساب بعد. بعد تفعيل المطعم من طرف CRTGO ستظهر أدوات الإدارة هنا تلقائياً.</p>
        </div>
      </Page>
    );
  }

  const languages = menu.enabled_languages || [menu.default_language || "ar"];
  const setup = [
    { label: "اسم المطعم", done: Boolean(menu.business_name) },
    { label: "أقسام القائمة", done: counts.categories > 0 },
    { label: "عناصر القائمة", done: counts.items > 0 },
    { label: "لغات القائمة", done: languages.length > 0 },
    { label: "نشر القائمة", done: Boolean(menu.is_published) },
  ];
  const doneCount = setup.filter((row) => row.done).length;
  const progress = Math.round((doneCount / setup.length) * 100);

  return (
    <Page>
      <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#101010] p-7 sm:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff7a00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/10 px-3 py-2 text-xs font-black text-[#ff9b3d]">
              <Store size={14} /> لوحة المطعم
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{menu.business_name}</h1>
            <p className="mt-3 text-sm font-bold text-white/35" dir="ltr">menu.crtrgo.com/{menu.slug}</p>
            <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-white/45">من هنا تدير قائمتك، الأسعار، الصور، اللغات وحالة الاشتراك. كل شيء المهم موجود في مكان واحد وبشكل بسيط.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3 text-sm font-black text-black">
              إدارة القائمة <ArrowLeft size={16} />
            </Link>
            {menu.is_published && (
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.04]">
                فتح القائمة <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<MenuIcon size={18} />} label="الأقسام" value={counts.categories} />
        <Stat icon={<Store size={18} />} label="العناصر" value={counts.items} />
        <Stat icon={<Globe2 size={18} />} label="اللغات" value={languages.length} />
        <Stat icon={<CreditCard size={18} />} label="الاشتراك" value={subscription?.status || "غير مشترك"} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#111] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-white/30">حالة الإعداد</p>
              <h2 className="mt-2 text-2xl font-black">جهوزية القائمة</h2>
            </div>
            <div className="text-3xl font-black text-[#ff7a00]">{progress}%</div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-[#ff7a00]" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {setup.map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                {row.done ? <CircleCheck size={18} className="text-emerald-400" /> : <CircleDashed size={18} className="text-white/25" />}
                <span className="text-sm font-black text-white/75">{row.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <Link to="/menu" className="group rounded-[26px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
            <MenuIcon className="text-[#ff7a00]" />
            <h2 className="mt-5 text-2xl font-black">القائمة</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/35">عدّل الأقسام والعناصر والأسعار والصور واللغات والتوفر.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#ff8f28]">فتح الإدارة <ArrowLeft size={15} /></span>
          </Link>

          <Link to="/billing" className="group rounded-[26px] border border-white/10 bg-[#111] p-6 transition hover:border-[#ff7a00]/40">
            <CreditCard className="text-[#ff7a00]" />
            <h2 className="mt-5 text-2xl font-black">الفوترة</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/35">عرض الخطة الحالية وحالة الاشتراك وإدارة الدفع.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#ff8f28]">عرض الفوترة <ArrowLeft size={15} /></span>
          </Link>
        </section>
      </div>
    </Page>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#111] p-5">
      <div className="flex items-center gap-2 text-[#ff7a00]">{icon}<span className="text-xs font-black text-white/30">{label}</span></div>
      <p className="mt-4 text-2xl font-black">{value}</p>
    </div>
  );
}

function Page({ children }) {
  return <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}
