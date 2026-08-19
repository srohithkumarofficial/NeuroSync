import { useState } from "react";
import { Lesion } from "@/types";
import { LesionStatusBadge } from "./StatusBadge";
import { Modal } from "./Modal";

export function LesionTable({ lesions }: { lesions: Lesion[] }) {
  const [selected, setSelected] = useState<Lesion | null>(null);
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <caption className="sr-only">Detected lesions table</caption>
        <thead className="bg-surface-muted text-ink-faint text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="text-left font-medium px-4 py-2.5">Lesion</th>
            <th scope="col" className="text-left font-medium px-4 py-2.5">Location</th>
            <th scope="col" className="text-left font-medium px-4 py-2.5">Volume</th>
            <th scope="col" className="text-left font-medium px-4 py-2.5">Status</th>
            <th scope="col" className="text-left font-medium px-4 py-2.5 sr-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lesions.map((l) => (
            <tr key={l.id} className="border-t border-border hover:bg-surface-muted/60">
              <td className="px-4 py-2.5 mono-num text-ink">Lesion #{l.index}</td>
              <td className="px-4 py-2.5 text-ink-muted">{l.location}</td>
              <td className="px-4 py-2.5 mono-num text-ink-muted">{l.volumeML.toFixed(2)} mL</td>
              <td className="px-4 py-2.5"><LesionStatusBadge status={l.status} /></td>
              <td className="px-4 py-2.5 text-right">
                <button
                  onClick={() => setSelected(l)}
                  className="text-xs font-medium text-clinical hover:underline"
                >
                  View detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <Modal title={`Lesion #${selected.index}`} onClose={() => setSelected(null)} width="max-w-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-faint">Approximate volume</dt><dd className="mono-num text-ink font-medium">{selected.volumeML.toFixed(2)} mL</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Location</dt><dd className="text-ink">{selected.location}</dd></div>
            <div className="flex justify-between items-center"><dt className="text-ink-faint">Status</dt><dd><LesionStatusBadge status={selected.status} /></dd></div>
          </dl>
        </Modal>
      )}
    </div>
  );
}
