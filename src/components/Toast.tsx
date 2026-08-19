import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error";
  text: string;
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === "success";
  return (
    <div
      role="status"
      className={`flex items-start gap-2 p-3 rounded-md shadow-pop border text-sm ${
        isSuccess ? "bg-surface border-stable/30 text-ink" : "bg-surface border-critical/30 text-ink"
      }`}
    >
      {isSuccess ? <CheckCircle2 size={16} className="text-stable shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-critical shrink-0 mt-0.5" />}
      <span className="flex-1">{toast.text}</span>
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification" className="text-ink-faint hover:text-ink">
        <X size={14} />
      </button>
    </div>
  );
}
