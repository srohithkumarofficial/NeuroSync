import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  GitCompareArrows,
  ShieldCheck,
  Brain,
  AudioLines,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Activity,
} from "lucide-react";
import { USE_REAL_MRI_AI } from "@/services/mriService";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/mri/upload", label: "MRI Analysis", icon: ScanLine },
  { to: "/longitudinal", label: "Longitudinal", icon: GitCompareArrows },
  { to: "/evidence", label: "Clinical Evidence", icon: ShieldCheck },
  { to: "/cognitive", label: "Cognitive Assessment", icon: Brain },
  { to: "/speech", label: "Speech Assessment", icon: AudioLines },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export function Sidebar() {
  const modelStatusClass = USE_REAL_MRI_AI ? "bg-stable" : "bg-warn";
  const modelStatusText = USE_REAL_MRI_AI ? "Segmentation model configured" : "Segmentation model URL missing";

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface hidden md:flex md:flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded bg-clinical flex items-center justify-center">
          <Activity size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-semibold text-ink text-sm">NeuroSync</p>
          <p className="text-[11px] text-ink-faint">Clinical Decision Support</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Primary">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium mb-0.5 transition-colors ${
                isActive ? "bg-clinical-light text-clinical-dark" : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border text-[11px] text-ink-faint leading-snug">
        <p className="font-medium text-ink-muted">Model status</p>
        <p className="flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${modelStatusClass}`} /> {modelStatusText}
        </p>
        <p className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stable inline-block" /> LLM connected
        </p>
      </div>
    </aside>
  );
}
