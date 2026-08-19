import { NotificationItem } from "@/types";
import { mockNotifications } from "@/mock/clinical";
import { mockDelay } from "./apiConfig";

// ----------------------------------------------------------------------------
// notificationService — GET /api/notifications (placeholder, not in the
// primary integration list but follows the same mock/replace pattern).
// ----------------------------------------------------------------------------

export const notificationService = {
  async list(): Promise<NotificationItem[]> {
    return mockDelay(mockNotifications, 300);
  },
};
