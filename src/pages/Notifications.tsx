import { useEffect, useState } from "react";
import { NotificationItem } from "@/types";
import { notificationService } from "@/services/notificationService";
import { NotificationPanel } from "@/components/NotificationPanel";
import { LoadingState, EmptyState } from "@/components/States";

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    notificationService.list().then(setItems);
  }, []);

  if (!items) return <LoadingState label="Loading notifications…" />;

  const filtered = filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Notifications</h1>
        <div className="flex gap-1.5">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm border capitalize ${
                filter === f ? "bg-clinical text-white border-clinical" : "bg-surface text-ink-muted border-border hover:bg-surface-sunken"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <NotificationPanel notifications={filtered} />
      )}
    </div>
  );
}
