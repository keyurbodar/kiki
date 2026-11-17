import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { CapyMark } from "@/components/app-sidebar/capy-mark";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { auditSubjectKindLabels } from "./audit-catalog";
import {
  actionLabel,
  actorLine,
  actorParts,
  subjectLabel,
} from "./audit-format";
import {
  AgentFlowIcon,
  ArrowDownIcon,
  Box2Icon,
  BubbleWideIcon,
  BuildingsIcon,
  CalendarClockIcon,
  ChipIcon,
  CircleInfoIcon,
  CreditCardIcon,
  DevicesIcon,
  Folder1Icon,
  HistoryIcon,
  Key2Icon,
  PeopleIcon,
  PuzzleIcon,
  ReviewStarIcon,
  RobotIcon,
  ServerIcon,
  SettingsGearIcon,
  TagIcon,
  UserIcon,
} from "./audit-icons";
import type { AuditEvent, AuditFamily, AuditSubjectKind } from "./audit-schema";
import { formatRelativeTime, formatTimestamp } from "./relative-time";

export const cx = (
  ...parts: ReadonlyArray<string | false | null | undefined>
) => parts.filter(Boolean).join(" ");

const ghostButtonSizes = {
  xs: "h-(--h-control-xs) px-2 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-(--icon-xs)",
  sm: "h-(--h-control-sm) px-2.5 md:px-2 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
  "icon-xs":
    "size-(--h-control-xs) [&_svg:not([class*='size-'])]:size-(--icon-xs)",
  "icon-base":
    "size-(--h-control-base) [&_svg:not([class*='size-'])]:size-(--icon-base)",
} as const;

/**
 * Capy's ghost Button classes for the sizes this page uses. The Button primitive's
 * cva is still empty in kiki, so the page passes them until it is filled.
 */
export const ghostButtonClassName = (size: keyof typeof ghostButtonSizes) =>
  cx(
    "relative inline-flex w-fit shrink-0 cursor-pointer items-center justify-center rounded border-hairline border-transparent bg-transparent font-medium whitespace-nowrap text-muted-foreground-1 outline-none select-none transition-colors duration-100 hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset active:brightness-97 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 data-[popup-open]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
    ghostButtonSizes[size],
  );

export const familyIcons: Record<AuditFamily, ReactNode> = {
  members: <PeopleIcon />,
  api_keys: <Key2Icon />,
  automations: <CalendarClockIcon />,
  projects: <Box2Icon />,
  models: <ChipIcon />,
  integrations: <PuzzleIcon />,
  mcp: <ServerIcon />,
  devices: <DevicesIcon />,
  review: <ReviewStarIcon />,
  billing: <CreditCardIcon />,
  tags_folders: <TagIcon />,
  threads: <BubbleWideIcon />,
  drive: <Folder1Icon />,
  organization: <BuildingsIcon />,
};

export const subjectKinds: Record<
  AuditSubjectKind,
  { readonly label: string; readonly icon: ReactNode }
> = {
  member: { label: auditSubjectKindLabels.member, icon: <UserIcon /> },
  invitation: { label: auditSubjectKindLabels.invitation, icon: <UserIcon /> },
  domain: { label: auditSubjectKindLabels.domain, icon: <BuildingsIcon /> },
  api_key: { label: auditSubjectKindLabels.api_key, icon: <Key2Icon /> },
  service_user: {
    label: auditSubjectKindLabels.service_user,
    icon: <RobotIcon />,
  },
  device: { label: auditSubjectKindLabels.device, icon: <DevicesIcon /> },
  automation: {
    label: auditSubjectKindLabels.automation,
    icon: <CalendarClockIcon />,
  },
  project: { label: auditSubjectKindLabels.project, icon: <Box2Icon /> },
  mcp_server: {
    label: auditSubjectKindLabels.mcp_server,
    icon: <ServerIcon />,
  },
  tag: { label: auditSubjectKindLabels.tag, icon: <TagIcon /> },
  folder: { label: auditSubjectKindLabels.folder, icon: <Box2Icon /> },
  model: { label: auditSubjectKindLabels.model, icon: <ChipIcon /> },
  provider: { label: auditSubjectKindLabels.provider, icon: <ChipIcon /> },
  repository: { label: auditSubjectKindLabels.repository, icon: <Box2Icon /> },
  feature: { label: auditSubjectKindLabels.feature, icon: <CircleInfoIcon /> },
  organization: {
    label: auditSubjectKindLabels.organization,
    icon: <BuildingsIcon />,
  },
  pull_request: {
    label: auditSubjectKindLabels.pull_request,
    icon: <Box2Icon />,
  },
};

export const factIcons: Readonly<Record<string, ReactNode>> = {
  role: <UserIcon />,
  member: <UserIcon />,
  people: <PeopleIcon />,
  owner: <UserIcon />,
  thread: <AgentFlowIcon />,
  model: <ChipIcon />,
  reasoning: <ChipIcon />,
  machine: <ChipIcon />,
  version: <HistoryIcon />,
  repositories: <Box2Icon />,
  amount: <CreditCardIcon />,
  credits: <CreditCardIcon />,
  price: <CreditCardIcon />,
};

export const subjectKindOf = (event: AuditEvent) =>
  subjectLabel(event) === null || event.subject.kind === null
    ? null
    : subjectKinds[event.subject.kind];

const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return `${words[0]?.[0] ?? ""}${words.length > 1 ? (words.at(-1)?.[0] ?? "") : ""}`.toUpperCase();
};

const avatarSizes = {
  xs: "size-4 text-[0.5rem]",
  row: "size-4.5 text-[0.4375rem]",
  sm: "size-6 text-[0.625rem]",
  inspector: "size-7 text-[0.6875rem]",
  base: "size-8 text-xs",
} as const;

export type AvatarSize = keyof typeof avatarSizes;

export type AvatarProps = {
  src: string | null;
  name: string;
  size?: AvatarSize;
};

/** A person's picture, or their initials when there is none or it fails to load. */
export function Avatar({ src, name, size = "sm" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src !== null && src !== "" && !failed)
    return (
      <span
        className={cx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary",
          avatarSizes[size],
        )}
      >
        <img
          src={src}
          alt={name}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "flex shrink-0 items-center justify-center rounded bg-muted font-medium text-foreground",
        avatarSizes[size],
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Capy's mark for agent actions, a person's avatar, or a tile for API keys and the system. */
export function ActorAvatar({
  event,
  size = "sm",
}: {
  event: AuditEvent;
  size?: AvatarSize;
}) {
  if (event.viaAgent)
    return (
      <CapyMark className={cx("shrink-0 justify-center", avatarSizes[size])} />
    );
  if (event.actor._tag === "human")
    return (
      <Avatar
        size={size}
        src={event.actor.person.imageUrl}
        name={
          event.actor.person.name ??
          event.actor.person.email ??
          "Unknown person"
        }
      />
    );
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded bg-secondary text-foreground [&_svg]:size-[58%]",
        avatarSizes[size],
      )}
    >
      {event.actor._tag === "service" ? <RobotIcon /> : <SettingsGearIcon />}
    </span>
  );
}

export function ActorLabel({ event }: { event: AuditEvent }) {
  const [name, qualifier] = actorParts(event);
  return (
    <span
      className="flex min-w-0 items-center gap-1.5 text-sm text-foreground"
      title={qualifier === null ? name : `${name} ${qualifier}`}
    >
      <ActorAvatar event={event} size="row" />
      <span className="min-w-0 truncate">{name}</span>
      {qualifier === null ? null : (
        <span className="min-w-0 shrink-[1000] truncate text-muted-foreground-1">
          {qualifier}
        </span>
      )}
    </span>
  );
}

export const auditColumns =
  "calc(var(--spacing) * 17) calc(var(--spacing) * 37.5) calc(var(--spacing) * 37.5) minmax(var(--table-fluid-min), 1fr)";

export function AuditTable({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders the ledger as a CSS grid with table roles
    <div
      role="table"
      style={{ gridTemplateColumns: auditColumns }}
      className={cx(
        "isolate grid w-full overflow-x-auto overscroll-x-contain [--table-fluid-min:0] [--table-lead-min:0]",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderRow({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders rows as grid divs
    // biome-ignore lint/a11y/useFocusableInteractive: the row is handled by its child button
    <div
      role="row"
      className={cx(
        "col-span-full grid h-8 grid-cols-subgrid items-center",
        className,
      )}
      {...props}
    />
  );
}

const headCellClassName =
  "flex min-w-0 items-center pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none";

export function TableHead({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders headers as grid divs
    // biome-ignore lint/a11y/useFocusableInteractive: the header holds a button
    <div
      role="columnheader"
      className={cx(headCellClassName, "gap-0.5", className)}
      {...props}
    />
  );
}

export type SortableTableHeadProps = Omit<ComponentProps<"div">, "onClick"> & {
  direction?: "ascending" | "descending";
  onSort: () => void;
};

export function SortableTableHead({
  direction,
  onSort,
  className,
  children,
  ...props
}: SortableTableHeadProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders headers as grid divs
    // biome-ignore lint/a11y/useFocusableInteractive: the header holds a button
    <div
      role="columnheader"
      aria-sort={direction ?? "none"}
      className={cx(headCellClassName, className)}
      {...props}
    >
      <button
        type="button"
        className="flex cursor-pointer items-center gap-0.5 rounded outline-none hover:text-foreground focus-visible:outline-ring-inset"
        onClick={onSort}
      >
        {children}
        {direction === undefined ? null : (
          <ArrowDownIcon
            className={cx(
              "size-3 shrink-0 text-foreground",
              direction === "ascending" && "rotate-180",
            )}
          />
        )}
      </button>
    </div>
  );
}

export type TableRowProps = ComponentProps<"div"> & { interactive?: boolean };

export function TableRow({
  interactive = true,
  className,
  ...props
}: TableRowProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders rows as grid divs
    // biome-ignore lint/a11y/useFocusableInteractive: the row is handled by its child button
    <div
      role="row"
      className={cx(
        "relative col-span-full grid grid-cols-subgrid",
        interactive &&
          "before:absolute before:inset-y-0 before:rounded before:transition-colors before:duration-100 hover:before:bg-section",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders cells as grid divs
    // biome-ignore lint/a11y/useFocusableInteractive: the row is handled by its child button
    <div
      role="cell"
      className={cx(
        "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        className,
      )}
      {...props}
    />
  );
}

function WhenLabel({
  event,
  className,
}: {
  event: AuditEvent;
  className: string;
}) {
  const createdAt = event.createdAt;
  return (
    <span className={className} title={formatTimestamp(createdAt)}>
      {formatRelativeTime(createdAt, { minified: true })}
    </span>
  );
}

export type LedgerRowProps = {
  event: AuditEvent;
  selected: boolean;
  divided: boolean;
  onToggle: () => void;
};

/** One event in the wide table; clicking it opens or closes the inspector. */
export function LedgerRow({
  event,
  selected,
  divided,
  onToggle,
}: LedgerRowProps) {
  const subject = subjectLabel(event);
  const kind = subjectKindOf(event);
  const action = actionLabel(event);
  return (
    <TableRow
      data-track-owner="features/settings/org-audit-log-page.tsx#LedgerRow:TableRow[onClick=onToggle]"
      tabIndex={0}
      aria-selected={selected}
      className={cx(
        "cursor-pointer outline-none before:inset-x-0 focus-visible:outline-ring-inset",
        selected && "before:bg-secondary hover:before:bg-secondary",
        divided && "border-b-hairline border-border-1",
      )}
      onClick={onToggle}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
        keyEvent.preventDefault();
        onToggle();
      }}
    >
      <TableCell className="pl-2.5">
        <WhenLabel
          event={event}
          className="text-xs text-muted-foreground-2 tabular-nums"
        />
      </TableCell>
      <TableCell>
        <ActorLabel event={event} />
      </TableCell>
      <TableCell>
        <span
          className="truncate text-sm font-medium text-foreground"
          title={action}
        >
          {action}
        </span>
      </TableCell>
      <TableCell className="gap-1.5 [&_svg]:size-(--icon-xs) [&_svg]:shrink-0 [&_svg]:text-icon-muted">
        {subject === null ? null : (
          <>
            {kind?.icon}
            <span
              className="truncate text-sm text-muted-foreground-1"
              title={subject}
            >
              {subject}
            </span>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

/** One event in the narrow list; tapping it opens the details sheet. */
export function AuditListRow({
  event,
  onOpen,
}: {
  event: AuditEvent;
  onOpen: () => void;
}) {
  const subject = subjectLabel(event);
  return (
    <button
      data-track-owner="features/settings/org-audit-log-page.tsx#AuditListRow:button[onClick=onOpen]"
      type="button"
      onClick={onOpen}
      className="flex min-h-14 w-full cursor-pointer items-center gap-2.5 border-b-hairline border-border-1 py-2 text-left outline-none focus-visible:outline-ring-inset"
    >
      <ActorAvatar event={event} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {actionLabel(event)}
          {subject === null ? null : ` · ${subject}`}
        </span>
        <span className="truncate text-sm text-muted-foreground-1">
          {actorLine(event)}
        </span>
      </span>
      <WhenLabel
        event={event}
        className="shrink-0 text-sm text-muted-foreground-2 tabular-nums"
      />
    </button>
  );
}

function LoadingSkeleton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <SkeletonPanel
      role="status"
      aria-label="Loading audit events"
      className={cx(
        "opacity-100 transition-opacity duration-base ease-out-quint starting:opacity-0",
        className,
      )}
    >
      <div
        aria-hidden
        className="contents [&>*]:animate-skeleton-pulse motion-reduce:[&>*]:animate-none"
      >
        {children}
      </div>
    </SkeletonPanel>
  );
}

const skeletonWidths = ["w-28", "w-20", "w-32", "w-24", "w-36"];

export function TableSkeleton() {
  return (
    <LoadingSkeleton className="col-span-full grid grid-cols-subgrid">
      {Array.from({ length: 10 }, (_, index) => (
        <TableRow
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
          key={index}
          interactive={false}
          className="border-b-hairline border-border-1"
        >
          <TableCell className="pl-2.5">
            <div className="h-2 w-5 rounded bg-secondary" />
          </TableCell>
          <TableCell className="gap-1.5">
            <div className="size-4.5 shrink-0 rounded-full bg-secondary" />
            <div className="h-2.5 w-16 rounded bg-secondary" />
          </TableCell>
          <TableCell>
            <div
              className={cx(
                "h-2.5 rounded bg-secondary",
                skeletonWidths[index % skeletonWidths.length],
              )}
            />
          </TableCell>
          <TableCell>
            <div
              className={cx(
                "h-2.5 rounded bg-secondary",
                skeletonWidths[(index + 2) % skeletonWidths.length],
              )}
            />
          </TableCell>
        </TableRow>
      ))}
    </LoadingSkeleton>
  );
}

export function ListSkeleton() {
  return (
    <LoadingSkeleton className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
          key={index}
          className="flex min-h-14 items-center gap-2.5 border-b-hairline border-border-1"
        >
          <div className="size-6 shrink-0 rounded-full bg-secondary" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div
              className={cx(
                "h-2.5 rounded bg-secondary",
                index % 2 === 0 ? "w-48" : "w-40",
              )}
            />
            <div className="h-2 w-24 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </LoadingSkeleton>
  );
}

/** Centered note under the table: empty, filtered-empty, failed or not allowed. */
export function AuditNotice({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <span className="text-sm font-normal text-muted-foreground-2">
        {children}
      </span>
      {action}
    </div>
  );
}
