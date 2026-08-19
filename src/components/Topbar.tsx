import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Topbar({ unreadCount }: { unreadCount: number }) {
  const { clinician, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/patients?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
      <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface-sunken rounded-sm px-3 py-1.5 w-80 max-w-full border border-transparent focus-within:border-clinical/40">
        <Search size={15} className="text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name or ID"
          aria-label="Search patients"
          className="bg-transparent outline-none text-sm w-full placeholder:text-ink-faint"
        />
      </form>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck size={14} className="text-stable" />
          Secure session
        </div>
        <button
          onClick={() => navigate("/notifications")}
          aria-label={`Notifications, ${unreadCount} unread`}
          className="relative p-2 rounded-sm hover:bg-surface-sunken text-ink-muted"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-critical text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-clinical-light text-clinical-dark flex items-center justify-center text-xs font-semibold">
            {clinician?.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-ink">{clinician?.name}</p>
            <p className="text-[11px] text-ink-faint">{clinician?.role}</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="ml-1 p-2 rounded-sm hover:bg-surface-sunken text-ink-faint hover:text-ink">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
