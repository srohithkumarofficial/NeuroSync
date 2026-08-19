export function Help() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ink">Help &amp; System Information</h1>

      <div className="panel p-5 space-y-2">
        <h2 className="text-sm font-semibold text-ink">About NeuroSync</h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          NeuroSync is a clinical decision-support platform that assists neurologists and radiologists in analyzing brain MRI for
          multiple sclerosis-supporting imaging patterns. NeuroSync does not diagnose MS and does not replace a neurologist. All
          AI-generated output requires clinician review before it becomes part of a patient's clinical record.
        </p>
      </div>

      <div className="panel p-5 space-y-2">
        <h2 className="text-sm font-semibold text-ink">Intended use</h2>
        <ul className="list-disc list-inside text-sm text-ink-muted space-y-1">
          <li>Brain MRI lesion segmentation and measurement (spinal MRI not currently supported)</li>
          <li>Longitudinal comparison of lesion activity across visits</li>
          <li>Evidence-grounded AI explanations with a verification layer</li>
          <li>Clinician-supervised cognitive practice and monitoring</li>
          <li>Clinician-approved structured report generation</li>
        </ul>
      </div>

      <div className="panel p-5 space-y-2">
        <h2 className="text-sm font-semibold text-ink">Support</h2>
        <p className="text-sm text-ink-muted">For technical issues, contact your institution's clinical informatics team.</p>
      </div>

      <div className="panel p-5 space-y-1 text-xs text-ink-faint">
        <p>NeuroSync — Clinical Decision Support Platform</p>
        <p>Environment: connected clinical application</p>
      </div>
    </div>
  );
}
