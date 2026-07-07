import { Link, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  LinkIcon,
  Lock,
  Power,
  QrCode,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../lib/supabase";
import { getPublicMenuUrl } from "../lib/urls";
import BranchTabs from "../components/BranchTabs";
import { useConfirm } from "../components/ConfirmProvider";
import PlanLimitNotice from "../components/PlanLimitNotice";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
} from "../components/ui";
import { useBusinessBilling } from "../hooks/useBusinessBilling";
import {
  canUseQrCodes,
  getLimitMessage,
  isSubscriptionLocked,
} from "../lib/billing";

async function loadQrPayload(branchId) {
  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select(`
      id,
      name,
      slug,
      status,
      business_id,
      businesses (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("id", branchId)
    .single();

  if (branchError) throw branchError;

  const { data: qr, error: qrError } = await supabase
    .from("branch_qr_codes")
    .select("*")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (qrError) throw qrError;

  return {
    branch,
    qr,
  };
}

function getPublicMenuBaseUrl() {
  const envUrl =
    import.meta.env.VITE_PUBLIC_MENU_BASE_URL ||
    import.meta.env.VITE_MENU_PUBLIC_BASE_URL ||
    "https://menu.crtgo.com";

  return String(envUrl).replace(/\/+$/, "");
}

function getPermanentQrUrl(code) {
  return `${getPublicMenuBaseUrl()}/q/${code}`;
}

function cleanFileName(value) {
  return String(value || "crtgo-menu")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function generateShortCode(length = 8) {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  return Array.from(values)
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}

export default function BranchQrPage() {
  const { branchId } = useParams();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const qrRef = useRef(null);

  const [customLabel, setCustomLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branch-qr", branchId],
    queryFn: () => loadQrPayload(branchId),
    enabled: Boolean(branchId),
  });

  const branch = data?.branch || null;
  const qr = data?.qr || null;
  const business = branch?.businesses || null;

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useBusinessBilling(branch?.business_id);

  const archived = branch?.status === "archived";
  const subscriptionLocked = Boolean(billing && isSubscriptionLocked(billing));
  const qrPlanLocked = Boolean(billing && !canUseQrCodes(billing));

  const qrLocked =
    archived ||
    billingLoading ||
    Boolean(billingError) ||
    subscriptionLocked ||
    qrPlanLocked;

  const qrLockMessage = archived
    ? "Restore this branch before using QR codes."
    : billingLoading
      ? "Billing is still loading. Try again in a second."
      : billingError
        ? billingError.message
        : subscriptionLocked
          ? getLimitMessage("locked", billing)
          : qrPlanLocked
            ? getLimitMessage("qr", billing)
            : "";

  const directMenuUrl =
    business && branch ? getPublicMenuUrl(business.slug, branch.slug) : "";

  const permanentUrl = qr?.code ? getPermanentQrUrl(qr.code) : "";
  const title =
    customLabel.trim() ||
    (business && branch ? `${business.name} - ${branch.name}` : "CRTGO Menu");

  const filename = cleanFileName(
    business && branch
      ? `${business.slug}-${branch.slug}-qr`
      : "crtgo-menu-qr"
  );

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["branch-qr", branchId] });
  }

  async function createPermanentQr() {
    if (!branch || !business) return;

    if (qrLocked) {
      toast.error(qrLockMessage || "QR codes are locked.");
      return;
    }

    setCreating(true);

    try {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const code = generateShortCode(8);

        const { error } = await supabase.from("branch_qr_codes").insert({
          business_id: business.id,
          branch_id: branch.id,
          code,
          enabled: true,
        });

        if (!error) {
          toast.success("Permanent QR created");
          await refresh();
          return;
        }

        if (!String(error.message || "").toLowerCase().includes("duplicate")) {
          throw error;
        }
      }

      throw new Error("Could not create a unique QR code. Try again.");
    } catch (err) {
      toast.error(err.message || "Failed to create QR code");
    } finally {
      setCreating(false);
    }
  }

  async function toggleQrEnabled() {
    if (!qr) return;

    if (qrLocked) {
      toast.error(qrLockMessage || "QR codes are locked.");
      return;
    }

    const nextEnabled = !qr.enabled;

    const ok = await confirm({
      title: nextEnabled ? "Enable QR code?" : "Disable QR code?",
      message: nextEnabled
        ? "This QR code will start redirecting to the public menu again."
        : "The printed QR code will stop opening the menu until you enable it again.",
      confirmText: nextEnabled ? "Enable QR" : "Disable QR",
      danger: !nextEnabled,
    });

    if (!ok) return;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("branch_qr_codes")
        .update({
          enabled: nextEnabled,
        })
        .eq("id", qr.id);

      if (error) throw error;

      toast.success(nextEnabled ? "QR enabled" : "QR disabled");
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to update QR");
    } finally {
      setUpdating(false);
    }
  }

  async function regenerateQrCode() {
    if (!qr) return;

    if (qrLocked) {
      toast.error(qrLockMessage || "QR codes are locked.");
      return;
    }

    const ok = await confirm({
      title: "Regenerate QR code?",
      message:
        "This creates a new short QR link. Any old printed QR codes will stop working.",
      confirmText: "Regenerate",
      danger: true,
    });

    if (!ok) return;

    setRegenerating(true);

    try {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const code = generateShortCode(8);

        const { error } = await supabase
          .from("branch_qr_codes")
          .update({
            code,
            enabled: true,
            scan_count: 0,
            last_scanned_at: null,
          })
          .eq("id", qr.id);

        if (!error) {
          toast.success("QR code regenerated");
          await refresh();
          return;
        }

        if (!String(error.message || "").toLowerCase().includes("duplicate")) {
          throw error;
        }
      }

      throw new Error("Could not generate a unique code. Try again.");
    } catch (err) {
      toast.error(err.message || "Failed to regenerate QR");
    } finally {
      setRegenerating(false);
    }
  }

  async function copyPermanentLink() {
    if (!permanentUrl) return;

    try {
      await navigator.clipboard.writeText(permanentUrl);
      toast.success("Permanent QR link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function copyDirectMenuLink() {
    if (!directMenuUrl) return;

    try {
      await navigator.clipboard.writeText(directMenuUrl);
      toast.success("Public menu link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function downloadQrOnly() {
    if (qrLocked) {
      toast.error(qrLockMessage || "QR codes are locked.");
      return;
    }

    const canvas = qrRef.current?.querySelector("canvas");

    if (!canvas) {
      toast.error("QR code is not ready yet");
      return;
    }

    downloadCanvas(canvas, `${filename}.png`);
  }

  function downloadPrintCard() {
    if (qrLocked) {
      toast.error(qrLockMessage || "QR codes are locked.");
      return;
    }

    const sourceCanvas = qrRef.current?.querySelector("canvas");

    if (!sourceCanvas) {
      toast.error("QR code is not ready yet");
      return;
    }

    const canvas = document.createElement("canvas");
    const scale = 2;

    canvas.width = 900 * scale;
    canvas.height = 1200 * scale;

    const ctx = canvas.getContext("2d");

    ctx.scale(scale, scale);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 900, 1200);

    ctx.fillStyle = "#000000";
    ctx.font = "900 56px Arial";
    ctx.textAlign = "center";
    wrapText(ctx, title, 450, 125, 720, 62);

    ctx.fillStyle = "#ff7a00";
    roundRect(ctx, 315, 210, 270, 54, 27);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "900 24px Arial";
    ctx.fillText("SCAN MENU", 450, 245);

    ctx.drawImage(sourceCanvas, 225, 320, 450, 450);

    ctx.fillStyle = "#111111";
    ctx.font = "900 34px Arial";
    ctx.fillText(branch.name, 450, 850);

    ctx.fillStyle = "#555555";
    ctx.font = "700 24px Arial";
    wrapText(ctx, permanentUrl, 450, 905, 680, 34);

    ctx.fillStyle = "#999999";
    ctx.font = "900 20px Arial";
    ctx.fillText("POWERED BY CRTGO", 450, 1120);

    downloadCanvas(canvas, `${filename}-print-card.png`);
  }

  if (isLoading) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="mt-5 h-[620px]" />
      </main>
    );
  }

  if (error || !branch) {
    return (
      <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] p-5 text-white">
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message || "Branch not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white">
      <PageHeader
        eyebrow="Branch Settings"
        title="QR Code"
        subtitle={`Generate and control the permanent QR code for ${branch.name}.`}
        action={
          qr ? (
            <a
              href={permanentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.075] hover:text-white"
            >
              <ExternalLink size={17} />
              Open QR
            </a>
          ) : null
        }
      />

      <BranchTabs branchId={branchId} />

      {qrLocked && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <PlanLimitNotice
            title={archived ? "Branch archived" : "QR codes locked"}
            text={qrLockMessage}
          />
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6">
        <Link
          to={`/business/${branch.business_id}`}
          className="inline-flex items-center gap-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to business
        </Link>

        {!qr ? (
          <Card className="mt-5 p-6">
            <div className="mx-auto max-w-xl text-center">
              <div
                className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl ${
                  qrLocked
                    ? "bg-white/10 text-white/30"
                    : "bg-[#ff7a00] text-black"
                }`}
              >
                {qrLocked ? <Lock size={30} /> : <QrCode size={30} />}
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.06em]">
                Create permanent QR
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-white/40">
                This creates a permanent short link. The QR will keep working
                even if the business slug or branch slug changes later.
              </p>

              <Button
                type="button"
                className="mt-6"
                loading={creating}
                loadingText="Creating QR..."
                disabled={qrLocked}
                onClick={createPermanentQr}
              >
                <QrCode size={17} />
                Create QR Code
              </Button>
            </div>
          </Card>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-5">
              <Card className={`p-5 ${qrLocked ? "opacity-75" : ""}`}>
                <div className="flex items-start gap-4">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${
                      qrLocked
                        ? "bg-white/10 text-white/35"
                        : "bg-[#ff7a00] text-black"
                    }`}
                  >
                    {qrLocked ? <Lock size={25} /> : <QrCode size={25} />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-[-0.05em]">
                        Permanent QR
                      </h2>

                      <Badge tone={qr.enabled ? "success" : "danger"}>
                        {qr.enabled ? "Active" : "Disabled"}
                      </Badge>

                      {qrLocked && <Badge tone="danger">Plan locked</Badge>}
                    </div>

                    <p className="mt-2 text-sm font-bold leading-6 text-white/40">
                      This QR points to a stable CRTGO short link, then redirects
                      to the current public menu URL.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <Field label="Permanent QR link">
                    <div className="flex gap-2">
                      <Input value={permanentUrl} readOnly dir="ltr" />

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={copyPermanentLink}
                      >
                        <Copy size={16} />
                        Copy
                      </Button>
                    </div>
                  </Field>

                  <Field label="Current public menu target">
                    <div className="flex gap-2">
                      <Input value={directMenuUrl} readOnly dir="ltr" />

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={copyDirectMenuLink}
                      >
                        <Copy size={16} />
                        Copy
                      </Button>
                    </div>
                  </Field>

                  <Field
                    label="Print label"
                    hint="Optional. This text appears on the print card."
                  >
                    <Input
                      value={customLabel}
                      disabled={qrLocked}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder={`${business?.name} - ${branch.name}`}
                    />
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={downloadQrOnly}
                      disabled={qrLocked}
                    >
                      <Download size={16} />
                      Download QR PNG
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={downloadPrintCard}
                      disabled={qrLocked}
                    >
                      <Download size={16} />
                      Download Print Card
                    </Button>

                    <Button
                      type="button"
                      variant={qr.enabled ? "danger" : "secondary"}
                      loading={updating}
                      loadingText={qr.enabled ? "Disabling..." : "Enabling..."}
                      disabled={qrLocked}
                      onClick={toggleQrEnabled}
                    >
                      <Power size={16} />
                      {qr.enabled ? "Disable QR" : "Enable QR"}
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      loading={regenerating}
                      loadingText="Regenerating..."
                      disabled={qrLocked}
                      onClick={regenerateQrCode}
                    >
                      <RefreshCw size={16} />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/30">
                  <LinkIcon size={14} />
                  Analytics
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Stat label="Short code" value={qr.code} />
                  <Stat label="Scans" value={qr.scan_count || 0} />
                  <Stat
                    label="Last scan"
                    value={
                      qr.last_scanned_at
                        ? new Date(qr.last_scanned_at).toLocaleString()
                        : "—"
                    }
                  />
                </div>
              </Card>
            </div>

            <aside className="grid gap-5 xl:sticky xl:top-6 xl:self-start">
              <Card className="p-5">
                <h2 className="text-2xl font-black tracking-[-0.05em]">
                  Preview
                </h2>

                <div className="mt-5 overflow-hidden rounded-[30px] bg-white p-5 text-center text-black">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-black/35">
                    CRTGO MENU
                  </p>

                  <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                    {title}
                  </h3>

                  <div
                    ref={qrRef}
                    className="mx-auto mt-6 grid h-[280px] w-[280px] place-items-center rounded-[28px] border border-black/10 bg-white p-4"
                  >
                    <QRCodeCanvas
                      value={permanentUrl}
                      size={240}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-5 text-lg font-black">{branch.name}</p>

                  <p
                    className="mx-auto mt-2 max-w-xs break-all text-xs font-bold leading-5 text-black/45"
                    dir="ltr"
                  >
                    {permanentUrl}
                  </p>

                  <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-black/30">
                    Powered by CRTGO
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function downloadCanvas(canvas, filename) {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY);
  }
}