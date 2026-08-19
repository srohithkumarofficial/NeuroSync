import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useEffect, useState } from "react";
import { notificationService } from "@/services/notificationService";

export function AppLayout() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationService.list().then((items) => {
      setUnread(items.filter((n) => !n.read).length);
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar unreadCount={unread} />
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
