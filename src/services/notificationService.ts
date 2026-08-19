import { NotificationItem } from "@/types";
import { apiFetch } from "./apiConfig";

// ----------------------------------------------------------------------------
// Notification reads are owned by the backend database.
// ----------------------------------------------------------------------------

export const notificationService = {
  async list(): Promise<NotificationItem[]> {
    return apiFetch<NotificationItem[]>("/api/notifications");
  },
};
