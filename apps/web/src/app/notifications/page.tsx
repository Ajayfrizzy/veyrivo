import { AppShell } from "@/components/layout/app-shell";
import { NotificationInbox } from "@/features/notifications/notification-inbox";
export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationInbox />
    </AppShell>
  );
}
