import { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [loading, setLoading] = useState(false);

  const confirm = useMemo(() => {
    return (options = {}) =>
      new Promise((resolve) => {
        setConfirmState({
          title: options.title || "Are you sure?",
          message: options.message || "This action cannot be undone.",
          confirmText: options.confirmText || "Confirm",
          cancelText: options.cancelText || "Cancel",
          danger: Boolean(options.danger),
          icon: options.icon || null,
          resolve,
        });
      });
  }, []);

  async function handleConfirm() {
    if (!confirmState) return;

    setLoading(true);

    try {
      confirmState.resolve(true);
      setConfirmState(null);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (!confirmState) return;

    confirmState.resolve(false);
    setConfirmState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AnimatePresence>
        {confirmState && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#111111] p-5 shadow-2xl shadow-black/50"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                  confirmState.danger
                    ? "border-red-400/20 bg-red-500/10 text-red-200"
                    : "border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ffb36b]"
                }`}
              >
                {confirmState.icon ||
                  (confirmState.danger ? (
                    <Trash2 size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  ))}
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">
                {confirmState.title}
              </h2>

              <p className="mt-2 text-sm font-bold leading-6 text-white/45">
                {confirmState.message}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/60 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                >
                  {confirmState.cancelText}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black transition disabled:opacity-50 ${
                    confirmState.danger
                      ? "bg-red-500 text-white hover:bg-red-400"
                      : "bg-[#ff7a00] text-black hover:bg-white"
                  }`}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {confirmState.confirmText}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return confirm;
}