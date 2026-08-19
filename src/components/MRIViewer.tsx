export function MRIViewer({ hasComparison: _hasComparison }: { hasComparison: boolean }) {
  return <div className="panel p-5"><h2 className="text-base font-semibold text-ink mb-2">MRI viewer</h2><p className="text-sm text-ink-muted">The real NIfTI segmentation mask is stored by the MRI service. Browser-renderable image slices are not currently provided by the backend, so no generated image or overlay is displayed.</p></div>;
}
