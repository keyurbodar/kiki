import { createFileRoute } from "@tanstack/react-router";
import { OrgIdentityPage } from "@/features/settings-org/org-identity-page";

export const Route = createFileRoute("/_app/settings/org/identity")({
  component: OrgIdentityPage,
});
