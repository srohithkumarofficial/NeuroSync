import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({ title, onClose, children, width = "max-w-lg" }: { title: string; onClose: () => void; children: React.ReactNode; width?: string }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-surface rounded-md shadow-pop w-full ${width} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="text-ink-faint hover:text-ink p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
