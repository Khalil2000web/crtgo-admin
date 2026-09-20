import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, ExternalLink, Loader2, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";

export default function QrPage() {
  const qrWrapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData.user;
        if (!user) return;

        const { data, error } = await supabase
          .from("menus")
          .select("id, slug, business_name, is_published")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (active) setMenu(data || null);
      } catch (error) {
        toast.error(error?.message || "تعذر تحميل رمز QR.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const publicUrl = useMemo(() => {
    const slug = String(menu?.slug || "").trim().toLowerCase();
    return slug ? `https://${slug}.crtgo.com` : "";
  }, [menu?.slug]);

  async function copyLink() {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("تم نسخ رابط القائمة.");
    } catch {
      toast.error("تعذر نسخ الرابط.");
    }
  }

  function downloadQr() {
    const canvas = qrWrapRef.current?.querySelector("canvas");
    if (!canvas || !menu?.slug) {
      toast.error("تعذر تجهيز صورة QR.");
      return;
    }

    const link = document.createElement("a");
    link.download = `crtgo-${menu.slug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (loading) {
    return (
      <Page>
        <Loader2 className="animate-spin text-[#ff7a00]" />
      </Page>
    );
  }

  if (!menu) {
    return (
      <Page>
        <div className="rounded-[28px] border border-white/10 bg-[#111] p-6">
          <h1 className="text-2xl font-black">لا توجد قائمة مرتبطة بهذا الحساب.</h1>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <p className="text-xs font-black text-white/35">رمز QR</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">رمز القائمة</h1>
        <p className="mt-2 text-sm font-bold text-white/35">{menu.business_name}</p>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#ff7a00] text-black">
              <QrCode size={21} />
            </div>
            <div>
              <h2 className="text-lg font-black">رابط القائمة</h2>
              <p className="mt-1 text-xs font-bold text-white/35">
                هذا الرابط هو الذي يفتحه الزبون بعد مسح الرمز.
              </p>
            </div>
          </div>

          <div
            className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-sm text-white/70"
            dir="ltr"
          >
            {publicUrl}
          </div>

          {!menu.is_published && (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-sm font-bold text-amber-100">
              القائمة غير منشورة حالياً. يمكنك تجهيز رمز QR الآن، لكن الرابط لن يكون متاحاً للزبائن حتى تنشر القائمة.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Copy size={16} />
              نسخ الرابط
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ExternalLink size={16} />
              فتح القائمة
            </a>
          </div>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
          <div className="text-center">
            <p className="text-xs font-black text-white/30">جاهز للطباعة</p>
            <h2 className="mt-2 text-xl font-black">امسح لفتح القائمة</h2>
          </div>

          <div
            ref={qrWrapRef}
            className="mx-auto mt-5 grid w-fit place-items-center rounded-[28px] bg-white p-5"
          >
            <QRCodeCanvas
              value={publicUrl}
              size={260}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <button
            type="button"
            onClick={downloadQr}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3.5 text-sm font-black text-black transition hover:brightness-105 active:scale-[0.99]"
          >
            <Download size={17} />
            تنزيل PNG
          </button>

          <p className="mt-3 text-center text-xs font-bold leading-5 text-white/30">
            يمكنك استخدام الصورة على الطاولات، الملصقات، الفواتير أو أي مادة مطبوعة.
          </p>
        </aside>
      </div>
    </Page>
  );
}

function Page({ children }) {
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}
