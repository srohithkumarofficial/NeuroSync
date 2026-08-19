import { AuditEvent } from "@/types";
import { User, Cpu, Sparkles, Settings2 } from "lucide-react";

const actorMeta: Record<AuditEvent["actor"], { icon: React.ReactNode; label: string }> = {
  system: { icon: <Settings2 size={14} />, label: "System" },
  ai_model: { icon: <Cpu size={14} />, label: "AI Model" },
  llm: { icon: <Sparkles size={14} />, label: "LLM" },
  clinician: { icon: <User size={14} />, label: "Clinician" },
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative border-l border-border ml-2">
      {events.map((e) => (
        <li key={e.id} className="mb-5 ml-5 last:mb-0">
          <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-surface border border-border-strong text-ink-faint">
            {actorMeta[e.actor].icon}
          </span>
          <p className="text-xs mono-num text-ink-faint">{new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {actorMeta[e.actor].label}</p>
          <p className="text-sm text-ink mt-0.5">{e.description}</p>
        </li>
      ))}
    </ol>
  );
}
