import { createFileRoute } from "@tanstack/react-router";
import { InvitesPage } from "@/features/onboarding/invites";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/invites")({
  head: () => ({ meta: [{ title: pageTitle("Invites") }] }),
  component: InvitesPage,
});
