import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPage } from "@/features/settings-org/org-audit-log-page";

export const Route = createFileRoute("/_app/settings/org/audit-log")({
  component: AuditLogPage,
});
