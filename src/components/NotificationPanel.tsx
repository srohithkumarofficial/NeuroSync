import { NotificationItem } from "@/types";
import { AlertTriangle, FileCheck, GitCompareArrows, Brain, ScanLine, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

const typeMeta: Record<NotificationItem["type"], { icon: React.ReactNode; label: string }> = {
  mri_ready: { icon: <ScanLine size={16} className="text-clinical" />, label: "MRI analysis" },
  new_lesion: { icon: <AlertTriangle size={16} className="text-warn" />, label: "Lesion activity" },
  longitudinal_ready: { icon: <GitCompareArrows size={16} className="text-clinical" />, label: "Longitudinal comparison" },
  report_approval: { icon: <FileCheck size={16} className="text-warn" />, label: "Report" },
  cognitive_complete: { icon: <Brain size={16} className="text-stable" />, label: "Cognitive assessment" },
  evidence_review: { icon: <ShieldAlert size={16} className="text-critical" />, label: "Evidence review" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationPanel({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <div className="panel divide-y divide-border">
      {notifications.map((n) => {
        const meta = typeMeta[n.type];
        const content = (
          <div className={`flex items-start gap-3 p-4 ${!n.read ? "bg-clinical-50" : ""}`}>
            <div className="mt-0.5">{meta.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-ink">{n.message}</p>
              <p className="text-xs text-ink-faint mt-1">{meta.label} · {timeAgo(n.timestamp)}</p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-clinical mt-1.5 shrink-0" aria-label="Unread" />}
          </div>
        );
        return n.patientId ? (
          <Link key={n.id} to={`/patients/${n.patientId}`} className="block hover:bg-surface-muted">
            {content}
          </Link>
        ) : (
          <div key={n.id}>{content}</div>
        );
      })}
    </div>
  );
}
