import { createFileRoute } from "@tanstack/react-router";
import { OrgMembersPage } from "@/features/settings-org/org-members-page";

export const Route = createFileRoute("/_app/settings/org/members")({
  component: OrgMembersPage,
});
