import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

const sections = ["Profile", "Hospital / Clinic", "Notifications", "Security", "AI Settings", "Model Information"] as const;
type Section = (typeof sections)[number];

export function Settings() {
  const { clinician } = useAuth();
  const [active, setActive] = useState<Section>("Profile");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto" aria-label="Settings sections">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`text-left px-3 py-2 rounded-sm text-sm font-medium whitespace-nowrap ${
                active === s ? "bg-clinical-light text-clinical-dark" : "text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="panel p-6">
          {active === "Profile" && (
            <div className="space-y-4 max-w-md">
              <Field label="Name" value={clinician?.name ?? ""} />
              <Field label="Role" value={clinician?.role ?? ""} />
              <Field label="Hospital / Clinic" value={clinician?.hospital ?? ""} />
            </div>
          )}
          {active === "Hospital / Clinic" && (
            <div className="space-y-4 max-w-md">
              <Field label="Institution" value="Ashworth Neurology & MS Center" />
              <Field label="Department" value="Neurology — Multiple Sclerosis Program" />
              <Field label="Location" value="Building B, 3rd Floor" />
            </div>
          )}
          {active === "Notifications" && (
            <div className="space-y-3 max-w-md text-sm">
              {["New MRI analysis ready for review", "Longitudinal comparison available", "Report requires approval", "Cognitive assessment completed", "Evidence verification requires review"].map((n) => (
                <label key={n} className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">{n}</span>
                  <input type="checkbox" defaultChecked className="accent-clinical" />
                </label>
              ))}
            </div>
          )}
          {active === "Security" && (
            <div className="space-y-4 max-w-md text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Two-factor authentication</span><span className="text-stable font-medium">Enabled</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Session timeout</span><span className="text-ink font-medium">30 minutes</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Role-based access</span><span className="text-ink font-medium">Neurologist — full clinical access</span></div>
              <button className="text-sm font-medium text-critical border border-critical/30 bg-critical-light px-4 py-2 rounded-sm">Log out of all sessions</button>
            </div>
          )}
          {active === "AI Settings" && (
            <div className="space-y-4 max-w-md text-sm">
              <label className="flex items-center justify-between">
                <span className="text-ink-muted">Show AI confidence percentages</span>
                <input type="checkbox" defaultChecked className="accent-clinical" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-ink-muted">Require clinician approval before report export</span>
                <input type="checkbox" defaultChecked className="accent-clinical" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-ink-muted">Enable evidence verification firewall</span>
                <input type="checkbox" defaultChecked disabled className="accent-clinical" />
              </label>
            </div>
          )}
          {active === "Model Information" && (
            <div className="space-y-3 max-w-lg text-sm">
              <ModelRow name="MS lesion segmentation model" version="mock v1.0" connected />
              <ModelRow name="Prediction model" version="mock v1.0" connected />
              <ModelRow name="LLM explanation service" version="mock v1.0" connected />
              <ModelRow name="Evidence verification engine" version="mock v1.0" connected />
              <ModelRow name="Spinal MRI module" version="not available" connected={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-faint uppercase tracking-wide mb-1">{label}</label>
      <input readOnly value={value} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface-muted" />
    </div>
  );
}

function ModelRow({ name, version, connected }: { name: string; version: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0">
      <div>
        <p className="text-ink font-medium">{name}</p>
        <p className="text-xs text-ink-faint mono-num">{version}</p>
      </div>
      <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-stable" : "text-ink-faint"}`}>
        {connected ? <Wifi size={14} /> : <WifiOff size={14} />} {connected ? "Connected" : "Offline"}
      </span>
    </div>
  );
}
