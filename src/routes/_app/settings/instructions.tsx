import { createFileRoute } from "@tanstack/react-router";
import { InstructionsPage } from "@/features/settings-agent/instructions-page";

export const Route = createFileRoute("/_app/settings/instructions")({
  component: InstructionsPage,
});
