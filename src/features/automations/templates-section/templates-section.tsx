import { Link } from "@tanstack/react-router";
import { cx } from "@/components/view-toolbar";
import { Badge } from "@/primitives/badge";
import { cardVariants } from "@/primitives/card";
import {
  TriggerIcon,
  type TriggerType,
  triggerTypeLabels,
} from "../automations-list/triggers";
import {
  type AutomationTemplate,
  automationTemplates,
  templateStatus,
} from "./templates";

const track = (owner: string) =>
  `features/automations/templates-section.tsx#${owner}`;

/** The anchor Start from template scrolls to. */
export const templatesSectionId = "automation-templates";

function TemplateCard({ template }: { template: AutomationTemplate }) {
  const sources = [
    ...new Set(template.triggers.map((trigger) => trigger.type)),
  ] as TriggerType[];
  const comingSoon = templateStatus(template) === "coming_soon";
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className="flex shrink-0 items-center gap-1">
          {sources.map((type) => (
            <TriggerIcon key={type} type={type} />
          ))}
        </span>
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {template.name}
        </span>
      </span>
      <span className="line-clamp-2 text-sm font-normal text-muted-foreground-2">
        {template.description}
      </span>
      <span className="flex flex-wrap items-center gap-1.5 pt-1.5">
        {sources.map((type) => (
          <Badge key={type} size="base">
            <TriggerIcon type={type} className="size-(--icon-xs)" />
            {triggerTypeLabels[type]}
          </Badge>
        ))}
        {comingSoon ? <Badge color="neutral">Coming soon</Badge> : null}
      </span>
    </>
  );
  if (comingSoon)
    return (
      <div
        aria-disabled="true"
        className={cx(cardVariants(), "gap-1.5 p-4 opacity-70")}
      >
        {body}
      </div>
    );
  return (
    <Link
      data-track-owner={track("TemplatesSection:Link.1")}
      to="/automation/new"
      search={{ template: template.id }}
      className={cx(cardVariants({ variant: "interactive" }), "gap-1.5 p-4")}
    >
      {body}
    </Link>
  );
}

/** Templates header and the grid of template cards under the list. */
export function TemplatesSection() {
  return (
    <div id={templatesSectionId} className="mt-1 scroll-mt-2">
      <div className="flex h-9 w-full items-center gap-2 rounded-(--radius-card) bg-section px-2 text-sm font-medium text-foreground">
        <span className="w-4 shrink-0" />
        Templates
        <span className="font-normal text-muted-foreground-2 tabular-nums">
          {automationTemplates.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 px-0.5 pt-2 @lg/list:grid-cols-2">
        {automationTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
