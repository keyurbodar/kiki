import { createFileRoute } from "@tanstack/react-router";
import { CloudCredentialsPage } from "@/features/settings-integrations/cloud-credentials";

export const Route = createFileRoute("/_app/settings/cloud-credentials")({
  component: CloudCredentialsPage,
});
