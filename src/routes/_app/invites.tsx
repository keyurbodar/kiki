import { createFileRoute } from "@tanstack/react-router";
import { InvitesPage } from "@/features/onboarding/invites";

export const Route = createFileRoute("/_app/invites")({
  component: InvitesPage,
});
