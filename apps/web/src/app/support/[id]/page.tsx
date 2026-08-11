import { AppShell } from "@/components/layout/app-shell";
import { TicketConversation } from "@/features/support/components/ticket-conversation";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <TicketConversation ticketId={id} />
    </AppShell>
  );
}
