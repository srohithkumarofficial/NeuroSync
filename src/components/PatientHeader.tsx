import { Patient } from "@/types";
import { MRIStatusBadge } from "./StatusBadge";

export function PatientHeader({ patient }: { patient: Patient }) {
  return (
    <div className="panel p-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-ink">{patient.name}</h1>
          <span className="mono-num text-sm text-ink-faint">{patient.id}</span>
        </div>
        <p className="text-sm text-ink-muted mt-1">
          {patient.age} yrs · {patient.sex === "female" ? "Female" : patient.sex === "male" ? "Male" : "Other"} · DOB {patient.dateOfBirth}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-sm">
        <MRIStatusBadge status={patient.mriStatus} />
        <p className="text-ink-faint text-xs">Assigned: {patient.assignedClinician}</p>
        <p className="text-ink-faint text-xs">Last visit: {patient.lastVisit}</p>
      </div>
    </div>
  );
}
