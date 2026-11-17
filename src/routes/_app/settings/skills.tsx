import { createFileRoute } from "@tanstack/react-router";
import { SkillsPage } from "@/features/settings-agent/skills-page";

export const Route = createFileRoute("/_app/settings/skills")({
  component: SkillsPage,
});
