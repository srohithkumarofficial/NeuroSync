import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-ink-faint mb-2">404</p>
      <h1 className="text-lg font-semibold text-ink mb-2">Page not found</h1>
      <Link to="/dashboard" className="text-sm text-clinical font-medium hover:underline">Return to dashboard</Link>
    </div>
  );
}
