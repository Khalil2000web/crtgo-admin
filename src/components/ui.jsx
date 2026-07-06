import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  className = "",
  disabled,
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-[#ff7a00] text-black hover:bg-white active:scale-[0.98] shadow-lg shadow-[#ff7a00]/10",
    secondary:
      "border border-white/10 bg-white/[0.045] text-white/70 hover:bg-white/[0.075] hover:text-white",
    ghost: "text-white/45 hover:bg-white/[0.05] hover:text-white",
    danger:
      "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/15",
  };

  const sizes = {
    sm: "min-h-9 px-3 text-xs rounded-xl",
    md: "min-h-11 px-4 text-sm rounded-2xl",
    lg: "min-h-12 px-5 text-sm rounded-2xl",
  };

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-black transition disabled:pointer-events-none disabled:opacity-50 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? loadingText : children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-[#111111]/95 shadow-xl shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.05] text-white/50",
    success: "border-green-400/20 bg-green-500/10 text-green-200",
    warning: "border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ffbd7c]",
    danger: "border-red-400/20 bg-red-500/10 text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${
        tones[tone] || tones.neutral
      }`}
    >
      {children}
    </span>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>

      {children}

      {hint && (
        <span className="text-xs font-bold leading-5 text-white/30">
          {hint}
        </span>
      )}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-[#ff7a00] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 transition focus:border-[#ff7a00] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none transition focus:border-[#ff7a00] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      {children}
    </select>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  maxWidth = "max-w-xl",
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`max-h-[90vh] w-full ${maxWidth} overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-2xl shadow-black/50`}
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-xl font-black tracking-[-0.03em]">
                {title}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/45 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            <div className="max-h-[calc(90vh-82px)] overflow-y-auto p-5">
              {children}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/85 px-4 py-5 backdrop-blur-xl sm:px-6">
      <div className="flex flex-row justify-between gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff7a00]">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.06em] sm:text-3xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 hidden max-w-sm text-sm font-bold leading-6 text-white/40 md:block">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-[28px] border border-white/10 bg-white/[0.045] ${className}`}
    />
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <section className="rounded-[30px] border border-dashed border-white/10 bg-[#111111]/95 p-10 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-[#ff7a00]">
        {icon}
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-[-0.05em]">{title}</h2>

      <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-white/42">
        {text}
      </p>

      {action && <div className="mt-7">{action}</div>}
    </section>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-2 min-w-0 break-words text-lg font-black tracking-[-0.03em] text-white">
        {value}
      </p>
    </div>
  );
}

export function InlineLoader({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/45">
      <Loader2 size={16} className="animate-spin text-[#ff7a00]" />
      {text}
    </div>
  );
}