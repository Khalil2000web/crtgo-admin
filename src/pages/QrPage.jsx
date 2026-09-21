import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  QrCode,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";

export default function QrPage() {
  const rawQrRef = useRef(null);
  const rawDownloadQrRef = useRef(null);
  const cardQrRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCard, setDownloadingCard] = useState(false);
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
          .select(
            "id, slug, business_name, is_published, logo_url, accent_color, background_color, text_color"
          )
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
    return slug ? `https://${slug}.crtrgo.com` : "";
  }, [menu?.slug]);

  const palette = useMemo(
    () => ({
      accent: normalizeColor(menu?.accent_color, "#ff7a00"),
      background: normalizeColor(menu?.background_color, "#f7f7f5"),
      text: normalizeColor(menu?.text_color, "#171717"),
    }),
    [menu?.accent_color, menu?.background_color, menu?.text_color]
  );

  async function copyLink() {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("تم نسخ رابط القائمة.");
    } catch {
      toast.error("تعذر نسخ الرابط.");
    }
  }

  function downloadRawQr() {
    const canvas = rawDownloadQrRef.current?.querySelector("canvas");

    if (!canvas || !menu?.slug) {
      toast.error("تعذر تجهيز صورة QR.");
      return;
    }

    downloadDataUrl(canvas.toDataURL("image/png"), `crtgo-${menu.slug}-qr.png`);
  }

  async function downloadTableCard() {
    const qrCanvas = cardQrRef.current?.querySelector("canvas");

    if (!qrCanvas || !menu?.slug) {
      toast.error("تعذر تجهيز بطاقة QR.");
      return;
    }

    setDownloadingCard(true);

    try {
      const width = 1200;
      const height = 1600;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("تعذر إنشاء البطاقة.");

      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = palette.accent;
      ctx.fillRect(0, 0, width, 190);

      let logoDrawn = false;

      if (menu.logo_url) {
        try {
          const image = await loadImage(menu.logo_url);
          const size = 150;
          const x = width / 2 - size / 2;
          const y = 115;

          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, y + size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, y, size, size);
          ctx.drawImage(image, x, y, size, size);
          ctx.restore();

          ctx.strokeStyle = palette.background;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(width / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();

          logoDrawn = true;
        } catch {
          logoDrawn = false;
        }
      }

      const titleTop = logoDrawn ? 330 : 270;

      ctx.fillStyle = palette.text;
      ctx.textAlign = "center";
      ctx.direction = "rtl";
      ctx.font = "900 58px sans-serif";
      drawWrappedText(
        ctx,
        menu.business_name || "CRTGO Menu",
        width / 2,
        titleTop,
        940,
        72,
        2
      );

      ctx.font = "800 44px sans-serif";
      ctx.fillStyle = mixColor(palette.text, palette.background, 0.35);
      ctx.fillText("امسح لعرض القائمة", width / 2, titleTop + 135);

      const qrBox = 760;
      const qrX = (width - qrBox) / 2;
      const qrY = titleTop + 205;

      roundRect(ctx, qrX - 40, qrY - 40, qrBox + 80, qrBox + 80, 54);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.drawImage(qrCanvas, qrX, qrY, qrBox, qrBox);

      ctx.direction = "ltr";
      ctx.fillStyle = mixColor(palette.text, palette.background, 0.38);
      ctx.font = "700 31px sans-serif";
      ctx.fillText(publicUrl.replace(/^https:\/\//, ""), width / 2, qrY + qrBox + 105);

      ctx.fillStyle = palette.text;
      ctx.font = "900 34px sans-serif";
      ctx.fillText("POWERED BY CRTGO", width / 2, height - 95);

      downloadDataUrl(
        canvas.toDataURL("image/png"),
        `crtgo-${menu.slug}-table-card.png`
      );
    } catch (error) {
      toast.error(error?.message || "تعذر تنزيل بطاقة الطاولة.");
    } finally {
      setDownloadingCard(false);
    }
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

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
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

          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="flex items-center gap-2 text-[#ff7a00]">
              <ImageIcon size={18} />
              <h2 className="text-lg font-black text-white">تنزيلات جاهزة</h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={downloadRawQr}
                className="rounded-[22px] border border-white/10 bg-black/20 p-5 text-right transition hover:border-[#ff7a00]/35"
              >
                <Download size={19} className="text-[#ff7a00]" />
                <h3 className="mt-4 font-black">QR فقط</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-white/30">
                  صورة PNG نظيفة لاستخدامها في أي تصميم.
                </p>
              </button>

              <button
                type="button"
                onClick={downloadTableCard}
                disabled={downloadingCard}
                className="rounded-[22px] border border-white/10 bg-black/20 p-5 text-right transition hover:border-[#ff7a00]/35 disabled:opacity-50"
              >
                {downloadingCard ? (
                  <Loader2 size={19} className="animate-spin text-[#ff7a00]" />
                ) : (
                  <ImageIcon size={19} className="text-[#ff7a00]" />
                )}
                <h3 className="mt-4 font-black">بطاقة للطاولة</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-white/30">
                  تصميم 1200×1600 جاهز للطباعة بألوان وهوية المطعم.
                </p>
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-white/10 bg-[#111] p-5 sm:p-6">
          <div className="text-center">
            <p className="text-xs font-black text-white/30">معاينة بطاقة الطاولة</p>
            <h2 className="mt-2 text-xl font-black">جاهزة للطباعة</h2>
          </div>

          <div
            className="mx-auto mt-5 overflow-hidden rounded-[30px] border border-white/10 shadow-2xl"
            style={{
              backgroundColor: palette.background,
              color: palette.text,
            }}
          >
            <div className="h-16" style={{ backgroundColor: palette.accent }} />

            <div className="-mt-9 px-5 pb-6 text-center">
              {menu.logo_url ? (
                <img
                  src={menu.logo_url}
                  alt=""
                  className="mx-auto size-20 rounded-full border-[5px] object-cover"
                  style={{ borderColor: palette.background }}
                />
              ) : (
                <div
                  className="mx-auto grid size-20 place-items-center rounded-full border-[5px] bg-white text-black"
                  style={{ borderColor: palette.background }}
                >
                  <QrCode size={27} />
                </div>
              )}

              <h3 className="mt-4 text-xl font-black">{menu.business_name}</h3>
              <p className="mt-1 text-sm font-bold opacity-55">امسح لعرض القائمة</p>

              <div
                ref={rawQrRef}
                className="mx-auto mt-5 grid w-fit place-items-center rounded-[24px] bg-white p-4"
              >
                <QRCodeCanvas
                  value={publicUrl}
                  size={230}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <p className="mt-4 text-[11px] font-bold opacity-45" dir="ltr">
                {publicUrl.replace(/^https:\/\//, "")}
              </p>

              <p className="mt-5 text-[10px] font-black tracking-[0.16em] opacity-45">
                POWERED BY CRTGO
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadTableCard}
            disabled={downloadingCard}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7a00] px-5 py-3.5 text-sm font-black text-black transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          >
            {downloadingCard ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            تنزيل بطاقة الطاولة
          </button>
        </aside>
      </div>

      <div ref={rawDownloadQrRef} className="fixed -left-[9999px] -top-[9999px]">
        <QRCodeCanvas
          value={publicUrl}
          size={1024}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      <div ref={cardQrRef} className="fixed -left-[9999px] -top-[9999px]">
        <QRCodeCanvas
          value={publicUrl}
          size={760}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
    </Page>
  );
}

function Page({ children }) {
  return <div className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div>;
}

function normalizeColor(value, fallback) {
  const clean = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(clean) ? clean.toLowerCase() : fallback;
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;

    if (lines.length >= maxLines - 1) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function mixColor(foreground, background, backgroundWeight = 0.5) {
  const a = hexToRgb(foreground);
  const b = hexToRgb(background);
  const weight = Math.max(0, Math.min(1, backgroundWeight));

  const channel = (first, second) =>
    Math.round(first * (1 - weight) + second * weight);

  return `rgb(${channel(a.r, b.r)}, ${channel(a.g, b.g)}, ${channel(a.b, b.b)})`;
}

function hexToRgb(hex) {
  const clean = normalizeColor(hex, "#000000").slice(1);

  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}
