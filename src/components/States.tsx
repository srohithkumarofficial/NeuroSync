import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 size={22} className="animate-spin text-clinical" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <Inbox size={28} className="text-ink-faint mb-1" />
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-sm text-ink-faint max-w-sm">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <AlertCircle size={28} className="text-critical mb-1" />
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-sm text-ink-faint max-w-sm">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-clinical border border-clinical/30 bg-clinical-light px-3 py-1.5 rounded hover:bg-clinical/10 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
