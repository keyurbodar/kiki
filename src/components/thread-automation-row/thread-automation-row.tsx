import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, type SVGProps, useState } from "react";
import { automationsAtom, toThreadAutomations } from "./automations-data";
import { formatDateTime } from "./format";

const rowClass =
  "flex w-full flex-col gap-0.5 rounded-(--radius) px-2 py-1.5 text-left text-sm";
const rowInteractiveClass =
  "cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";
const lineClass = "flex min-w-0 items-center gap-2";
const iconClass = "flex size-4 shrink-0 items-center justify-center";
const metaClass =
  "flex min-w-0 items-center gap-1.5 pl-6 text-xs text-muted-foreground-2";
const labelClass =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

function CalendarClockGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.75879 10.1637L3.62703 15.0877C3.91474 16.7194 5.47072 17.8089 7.1024 17.5212L10.0972 16.9931M2.75879 10.1637L2.58514 9.17888C2.29743 7.5472 3.38694 5.99122 5.01862 5.70351L11.9123 4.48797C13.544 4.20026 15.0999 5.28977 15.3876 6.92145C15.4835 7.46535 15.1204 7.984 14.5765 8.07991L2.75879 10.1637Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20C19.3137 20 22 17.3137 22 14C22 10.6863 19.3137 8 16 8C12.6863 8 10 10.6863 10 14C10 17.3137 12.6863 20 16 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 12V14L17.6667 15.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type ThreadAutomationRowProps = {
  automationId: string;
  /** The name to show until the automation itself has loaded. */
  name: string;
  /** Leads the second line, for example "Runs in this thread". */
  lead?: ReactNode;
  className?: string;
  /** The organization whose automations list the row reads. */
  orgId?: string;
};

/** One automation in a thread's overview, opening the automation's page. */
export function ThreadAutomationRow({
  orgId,
  ...props
}: ThreadAutomationRowProps) {
  return orgId === undefined ? (
    <ThreadAutomationRowView {...props} />
  ) : (
    <LoadedThreadAutomationRow orgId={orgId} {...props} />
  );
}

function LoadedThreadAutomationRow({
  orgId,
  ...props
}: ThreadAutomationRowProps & { orgId: string }) {
  const automations = toThreadAutomations(useAtomValue(automationsAtom(orgId)));
  return (
    <ThreadAutomationRowView
      {...props}
      automation={automations.find((row) => row.id === props.automationId)}
    />
  );
}

function ThreadAutomationRowView({
  automationId,
  name,
  lead,
  className,
  automation,
}: Omit<ThreadAutomationRowProps, "orgId"> & {
  automation?: ReturnType<typeof toThreadAutomations>[number];
}) {
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  const title = automation?.name || name;
  const schedule = automation?.schedule;
  return (
    <button
      data-track-owner="shared/thread-automation-row.tsx#ThreadAutomationRow:button.1"
      type="button"
      className={[rowClass, rowInteractiveClass, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${title}, open automation`}
      onClick={() =>
        void navigate({
          to: "/automation/$automationId",
          params: { automationId },
        })
      }
    >
      <span className={lineClass}>
        <span className={iconClass}>
          <CalendarClockGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-2" />
        </span>
        <span className={`${labelClass} font-medium text-foreground`}>
          {title}
        </span>
        {automation?.enabled === false ? (
          <span className="shrink-0 rounded-(--radius) bg-section px-1 text-2xs text-muted-foreground-3">
            disabled
          </span>
        ) : automation?.nextRunAt === undefined ? null : (
          <span className="shrink-0 text-xs text-muted-foreground-2">
            next {formatDateTime(automation.nextRunAt, now)}
          </span>
        )}
      </span>
      <span className={metaClass}>
        {lead !== undefined && <span className="shrink-0">{lead}</span>}
        {lead !== undefined && schedule !== undefined && (
          <span aria-hidden>·</span>
        )}
        {schedule !== undefined && (
          <span className={labelClass}>{schedule}</span>
        )}
      </span>
    </button>
  );
}
