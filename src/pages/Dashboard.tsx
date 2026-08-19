import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Patient, NotificationItem, AuditEvent } from "@/types";
import { patientService } from "@/services/patientService";
import { notificationService } from "@/services/notificationService";
import { auditService } from "@/services/auditService";
import { MetricCard } from "@/components/MetricCard";
import { MRIStatusBadge, PredictionBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/States";
import { AlertTriangle, FileCheck, GitCompareArrows, ScanLine } from "lucide-react";

export function Dashboard() {
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<(AuditEvent & { patientName: string })[]>([]);

  useEffect(() => {
    Promise.all([patientService.listPatients(), notificationService.list()]).then(([list, alerts]) => {
      setPatients(list);
      setNotifications(alerts);
      return Promise.all(list.map((patient) => auditService.getTrail(patient.id).then((events) => events.map((event) => ({ ...event, patientName: patient.name })))));
    }).then((events) => setRecentActivity(events.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6)));
  }, []);

  if (!patients) return <LoadingState label="Loading dashboard…" />;

  const requiresReview = patients.filter((p) => p.mriStatus === "requires_review").length;
  const pendingAnalysis = patients.filter((p) => p.mriStatus === "pending_review" || p.mriStatus === "not_started").length;
  const awaitingApproval = patients.filter((p) => p.lastReportStatus === "awaiting_approval" || p.lastReportStatus === "draft").length;
  const scheduled = patients.filter((p) => p.cognitiveStatus === "scheduled").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-faint mt-0.5">What requires your attention today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard label="Active patients" value={patients.length} />
        <MetricCard label="Requires review" value={requiresReview} emphasis />
        <MetricCard label="MRI pending" value={pendingAnalysis} />
        <MetricCard label="Reports awaiting approval" value={awaitingApproval} />
        <MetricCard label="Cognitive sessions scheduled" value={scheduled} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Recent patients</h2>
            <Link to="/patients" className="text-sm text-clinical font-medium hover:underline">View all patients</Link>
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-surface-muted text-ink-faint text-xs uppercase tracking-wide">
                <tr>
                  <th scope="col" className="text-left font-medium px-4 py-2.5">Patient</th>
                  <th scope="col" className="text-left font-medium px-4 py-2.5">Age</th>
                  <th scope="col" className="text-left font-medium px-4 py-2.5">Last visit</th>
                  <th scope="col" className="text-left font-medium px-4 py-2.5">MRI status</th>
                  <th scope="col" className="text-left font-medium px-4 py-2.5">Prediction</th>
                  <th scope="col" className="text-left font-medium px-4 py-2.5 sr-only">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-surface-muted/60">
                    <td className="px-4 py-2.5">
                      <p className="text-ink font-medium">{p.name}</p>
                      <p className="text-xs text-ink-faint mono-num">{p.id}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink-muted">{p.age}</td>
                    <td className="px-4 py-2.5 text-ink-muted mono-num">{p.lastVisit}</td>
                    <td className="px-4 py-2.5"><MRIStatusBadge status={p.mriStatus} /></td>
                    <td className="px-4 py-2.5"><PredictionBadge label={p.predictionStatus} size="sm" /></td>
                    <td className="px-4 py-2.5 text-right">
                      <Link to={`/patients/${p.id}`} className="text-xs font-medium text-clinical hover:underline">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ink">Alerts</h2>
          <div className="panel divide-y divide-border">
            {notifications.slice(0, 5).map((n) => (
              <Link key={n.id} to={n.patientId ? `/patients/${n.patientId}` : "#"} className="flex items-start gap-2.5 p-3.5 hover:bg-surface-muted block">
                <AlertIcon type={n.type} />
                <div>
                  <p className="text-sm text-ink leading-snug">{n.message}</p>
                  <p className="text-xs text-ink-faint mt-1 mono-num">{new Date(n.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="text-base font-semibold text-ink pt-2">Recent activity</h2>
          <div className="panel divide-y divide-border">
            {recentActivity.map((e) => (
              <div key={e.id + e.timestamp} className="p-3.5">
                <p className="text-sm text-ink">{e.description}</p>
                <p className="text-xs text-ink-faint mt-1">{e.patientName} · {new Date(e.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertIcon({ type }: { type: NotificationItem["type"] }) {
  const cls = "shrink-0 mt-0.5";
  switch (type) {
    case "new_lesion": return <AlertTriangle size={16} className={`${cls} text-warn`} />;
    case "mri_ready": return <ScanLine size={16} className={`${cls} text-clinical`} />;
    case "longitudinal_ready": return <GitCompareArrows size={16} className={`${cls} text-clinical`} />;
    case "report_approval": return <FileCheck size={16} className={`${cls} text-warn`} />;
    default: return <AlertTriangle size={16} className={`${cls} text-ink-faint`} />;
  }
}
