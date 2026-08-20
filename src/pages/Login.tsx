import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("arjunraj@gmail.com");
  const [password, setPassword] = useState("arjunraj");
  const [remember, setRemember] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // error already surfaced via useAuth
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-9 h-9 rounded bg-clinical flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink text-lg leading-none">NeuroSync</p>
            <p className="text-xs text-ink-faint">Clinical Decision Support Platform</p>
          </div>
        </div>

        <div className="panel p-7">
          <h1 className="text-lg font-semibold text-ink mb-1">Sign in to your account</h1>
          <p className="text-sm text-ink-faint mb-6">Ashworth Neurology &amp; MS Center</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-muted mb-1.5">Email or username</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:border-clinical outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-muted mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full border border-border rounded-sm px-3 py-2 text-sm focus:border-clinical outline-none"
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-muted">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-clinical" />
                Remember me
              </label>
              <button type="button" className="text-clinical font-medium hover:underline">Forgot password?</button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-critical bg-critical-light border border-critical/30 rounded-sm px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-clinical text-white text-sm font-medium py-2.5 rounded-sm hover:bg-clinical-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-ink-faint px-2">
          <ShieldCheck size={14} className="shrink-0 mt-0.5 text-stable" />
          <p>This system contains protected health information. Access is logged and restricted to authorized clinical staff. By signing in you agree to your institution's acceptable use policy.</p>
        </div>
        <div className="mt-2 flex items-center gap-2 justify-center text-xs text-ink-faint">
          <Lock size={12} /> Secured clinical session
        </div>
      </div>
    </div>
  );
}
