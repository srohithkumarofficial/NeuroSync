import { useState } from "react";
import { Layers, ZoomIn, ZoomOut, Move, SlidersHorizontal } from "lucide-react";

type Plane = "axial" | "coronal" | "sagittal";

// NOTE: This is a mock imaging viewer for prototype purposes. It renders a
// generated placeholder graphic, NOT a real patient scan. Wire this up to a
// real NIfTI/DICOM viewer (e.g. Cornerstone.js / niivue) when the backend is
// connected — the control surface below is designed to map directly onto it.
export function MRIViewer({ hasComparison }: { hasComparison: boolean }) {
  const [plane, setPlane] = useState<Plane>("axial");
  const [overlay, setOverlay] = useState(true);
  const [opacity, setOpacity] = useState(55);
  const [slice, setSlice] = useState(58);
  const [compare, setCompare] = useState<"current" | "previous">("current");

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-muted">
        <div className="flex gap-1">
          {(["axial", "coronal", "sagittal"] as Plane[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlane(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm capitalize ${
                plane === p ? "bg-clinical text-white" : "text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {hasComparison && (
            <div className="flex gap-1 mr-2">
              {(["previous", "current"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCompare(c)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm capitalize ${
                    compare === c ? "bg-clinical-light text-clinical-dark" : "text-ink-muted hover:bg-surface-sunken"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <button aria-label="Zoom in" className="p-1.5 rounded-sm text-ink-faint hover:bg-surface-sunken hover:text-ink"><ZoomIn size={15} /></button>
          <button aria-label="Zoom out" className="p-1.5 rounded-sm text-ink-faint hover:bg-surface-sunken hover:text-ink"><ZoomOut size={15} /></button>
          <button aria-label="Pan" className="p-1.5 rounded-sm text-ink-faint hover:bg-surface-sunken hover:text-ink"><Move size={15} /></button>
          <button aria-label="Window and level controls" className="p-1.5 rounded-sm text-ink-faint hover:bg-surface-sunken hover:text-ink"><SlidersHorizontal size={15} /></button>
        </div>
      </div>

      <div className="relative bg-[#0B0E14] aspect-[4/3] flex items-center justify-center">
        <MockBrainSlice plane={plane} slice={slice} overlay={overlay} opacity={opacity} />
        <div className="absolute top-3 left-3 text-[11px] mono-num text-white/70 leading-relaxed">
          <p>{plane.toUpperCase()} · SLICE {slice}/120</p>
          <p>{compare === "current" ? "CURRENT SCAN" : "PREVIOUS SCAN"} · MOCK RENDER</p>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-white/80">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#E0895F]" /> Detected lesion
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} className="accent-clinical" />
          <Layers size={13} /> Lesion segmentation overlay
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-muted flex-1 min-w-[160px]">
          Opacity
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            disabled={!overlay}
            className="flex-1 accent-clinical"
            aria-label="Overlay opacity"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-muted flex-1 min-w-[160px]">
          Slice
          <input
            type="range"
            min={1}
            max={120}
            value={slice}
            onChange={(e) => setSlice(Number(e.target.value))}
            className="flex-1 accent-clinical"
            aria-label="Slice position"
          />
        </label>
      </div>
    </div>
  );
}

function MockBrainSlice({ plane, overlay, opacity }: { plane: Plane; slice: number; overlay: boolean; opacity: number }) {
  // Deterministic generated placeholder — NOT a real MRI image.
  const cx = plane === "sagittal" ? 46 : 50;
  return (
    <svg viewBox="0 0 200 200" className="w-4/5 h-4/5" role="img" aria-label={`Mock ${plane} brain MRI placeholder`}>
      <defs>
        <radialGradient id="brainGrad" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#3a3f4a" />
          <stop offset="70%" stopColor="#20232b" />
          <stop offset="100%" stopColor="#111318" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy="100" rx="70" ry="82" fill="url(#brainGrad)" stroke="#4a505c" strokeWidth="1" />
      <ellipse cx={cx} cy="100" rx="40" ry="52" fill="none" stroke="#5a606c" strokeWidth="0.6" opacity="0.5" />
      <path d={`M${cx - 20} 60 Q${cx} 70 ${cx + 20} 60`} stroke="#5a606c" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d={`M${cx - 25} 140 Q${cx} 150 ${cx + 25} 140`} stroke="#5a606c" strokeWidth="0.5" fill="none" opacity="0.4" />
      {overlay && (
        <g opacity={opacity / 100}>
          <circle cx={cx - 18} cy="78" r="4.5" fill="#E0895F" />
          <circle cx={cx + 12} cy="70" r="3.2" fill="#E0895F" />
          <circle cx={cx - 8} cy="120" r="5.5" fill="#E0895F" />
          <circle cx={cx + 20} cy="110" r="3" fill="#E0895F" />
          <circle cx={cx + 2} cy="140" r="2.6" fill="#E0895F" />
        </g>
      )}
    </svg>
  );
}
