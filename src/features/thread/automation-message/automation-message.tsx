import { type ComponentProps, type ReactNode, useState } from "react";
import { formatEventTime } from "@/features/thread/setup-failure-card";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export const AUTOMATION_FALLBACK_NAME = "Automation";

export const automationName = (
  automations: readonly { id: string; name: string }[],
  automationId: string,
) =>
  automations.find((a) => a.id === automationId)?.name ??
  AUTOMATION_FALLBACK_NAME;

const CLAMP_CHARS = 420;
const CLAMP_LINES = 9;

export const shouldClampMessage = (text: string) =>
  text.length > CLAMP_CHARS || text.split("\n").length > CLAMP_LINES;

export type AutomationMessageProps = Omit<
  ComponentProps<"div">,
  "children" | "title"
> & {
  title?: ReactNode;
  detail?: ReactNode;
  date?: Date;
  body?: string;
  files?: ReactNode;
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

export function AutomationMessage({
  title = AUTOMATION_FALLBACK_NAME,
  detail,
  date,
  body = "",
  files,
  expanded,
  onToggleExpanded,
  className,
  ...props
}: AutomationMessageProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const open = expanded ?? localExpanded;
  const clamp = shouldClampMessage(body);
  const toggle = () =>
    onToggleExpanded ? onToggleExpanded() : setLocalExpanded(!localExpanded);
  return (
    <div
      data-slot="automation-message"
      className={["flex min-w-0 flex-col gap-1.5 py-2 items-start", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div
        data-slot="message-header"
        className="flex max-w-full min-w-0 items-center gap-1.5 text-xs leading-4"
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          <Icon name="calendar-clock" className="size-4" />
        </span>
        <span className="min-w-0 text-pretty">
          <span className="font-medium text-foreground">{title}</span>
          {detail !== undefined && (
            <span className="pl-1.5 text-muted-foreground-2">{detail}</span>
          )}
        </span>
        {date !== undefined && (
          <time
            dateTime={date.toISOString()}
            className="shrink-0 text-xs whitespace-nowrap text-muted-foreground-2 tabular-nums select-none"
          >
            {formatEventTime(date)}
          </time>
        )}
      </div>
      {(body !== "" || files !== undefined) && (
        <div className="flex max-w-[77%] min-w-0 flex-col items-start gap-1.5">
          {body !== "" && (
            <div className="max-w-full min-w-0 rounded-(--radius-card) bg-secondary px-3 py-2 wrap-anywhere">
              {/* biome-ignore lint/a11y/noStaticElementInteractions: the clamped body toggles on click like Capy's; the sr-only button is the keyboard path */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users toggle with the button below */}
              <div
                data-slot="clamped-body"
                onClick={clamp ? toggle : undefined}
                className={[
                  "text-sm leading-normal whitespace-pre-wrap",
                  clamp && "cursor-pointer",
                  clamp && !open && "line-clamp-4",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {body}
              </div>
              {clamp && (
                <span className="sr-only focus-within:not-sr-only">
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-expanded={open}
                    onClick={toggle}
                  >
                    {open ? "Show less" : "Show more"}
                  </Button>
                </span>
              )}
            </div>
          )}
          {files}
        </div>
      )}
    </div>
  );
}
