import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <section className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="text-xl font-black tracking-[-0.03em] text-white">
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
      </section>
    </div>
  );
}