import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  auditChangeFieldLabels,
  auditEmptyValueLabels,
  auditFactLabels,
} from "./audit-catalog";
import {
  actionLabel,
  actorName,
  changedFieldsFact,
  changeLabel,
  hasDetails,
  isShownChange,
  isShownFact,
  isSupportedEvent,
  personName,
  subjectLabel,
} from "./audit-format";
import {
  AgentFlowIcon,
  ChevronDownSmallIcon,
  ChevronRightSmallIcon,
  CircleInfoIcon,
  ClockIcon,
  CrossSmallIcon,
  FingerPrintIcon,
  LockIcon,
  UserIcon,
} from "./audit-icons";
import {
  ActorAvatar,
  ActorLabel,
  Avatar,
  cx,
  factIcons,
  ghostButtonClassName,
  subjectKinds,
} from "./audit-parts";
import type { AuditChange, AuditEvent, AuditFact } from "./audit-schema";
import { changedLineCount, lineDiff } from "./line-diff";
import { formatTimestamp } from "./relative-time";

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-start gap-2 py-0.5">
      <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 pointer-coarse:w-28 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
        {icon}
        {label}
      </span>
      <div className="flex min-h-6 min-w-0 flex-1 items-center gap-2">
        {children}
      </div>
    </div>
  );
}

function Separator() {
  return (
    <div
      role="none"
      className="h-(--border-width-hairline) w-full shrink-0 bg-border-1"
    />
  );
}

function ValueChange({
  from,
  to,
  empty,
}: {
  from: string | null;
  to: string | null;
  empty: string;
}) {
  return (
    <span className="flex min-h-5.5 max-w-full flex-wrap items-center gap-1 self-start rounded-(--radius-sm) bg-secondary px-1.5 py-0.5 text-xs">
      <span className="break-words text-muted-foreground-1">
        {from ?? empty}
      </span>
      <ChevronRightSmallIcon className="size-3 shrink-0 text-icon-muted" />
      <span className="break-words font-medium text-foreground">
        {to ?? empty}
      </span>
    </span>
  );
}

function TextChange({
  change,
}: {
  change: Extract<AuditChange, { _tag: "text" }>;
}) {
  const [open, setOpen] = useState(false);
  const lines =
    change.from === null && change.to === null
      ? []
      : lineDiff(change.from ?? "", change.to ?? "");
  if (lines.length === 0)
    return (
      <span className="text-xs text-muted-foreground-2">
        Too long to record
      </span>
    );
  const count = changedLineCount(lines);
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground-1">
          {count === 1 ? "1 line changed" : `${count} lines changed`}
          {change.truncated ? ", shortened" : ""}
        </span>
        <Button
          data-track-owner="features/settings/org-audit-log-page.tsx#TextChange:Button.1"
          variant="ghost"
          size="xs"
          className={ghostButtonClassName("xs")}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide" : "Show"}
          <ChevronDownSmallIcon className={cx(open && "rotate-180")} />
        </Button>
      </span>
      {open ? (
        <span className="flex flex-col overflow-clip rounded-(--radius-button) border-hairline border-border-2 bg-card font-mono text-xs">
          {lines
            .filter((line) => line.sign !== " ")
            .map((line, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: diff lines repeat and keep their order
                key={index}
                className={cx(
                  "flex gap-2 px-2.5 py-0.75",
                  line.sign === "-"
                    ? "bg-(--diff-del-wash)"
                    : "bg-(--diff-add-wash)",
                )}
              >
                <span
                  className={
                    line.sign === "-" ? "text-diff-del" : "text-diff-add"
                  }
                >
                  {line.sign === "-" ? "−" : "+"}
                </span>
                <span className="min-w-0 flex-1 break-words whitespace-pre-wrap text-foreground">
                  {line.text}
                </span>
              </span>
            ))}
        </span>
      ) : null}
    </span>
  );
}

function ChangeValue({ change }: { change: AuditChange }) {
  switch (change._tag) {
    case "value":
      return (
        <ValueChange
          from={change.from}
          to={change.to}
          empty={auditEmptyValueLabels[change.field] ?? "None"}
        />
      );
    case "text":
      return <TextChange change={change} />;
    case "list":
      return (
        <span className="flex flex-col gap-1 text-xs">
          {change.added.length > 0 ? (
            <span className="break-words">
              <span className="text-muted-foreground-1">
                {change.field === "setup_sections" ? "Edited " : "Added "}
              </span>
              {change.added.join(", ")}
            </span>
          ) : null}
          {change.removed.length > 0 ? (
            <span className="break-words">
              <span className="text-muted-foreground-1">Removed </span>
              {change.removed.join(", ")}
            </span>
          ) : null}
          {change.truncated ? (
            <span className="text-muted-foreground-2">and more</span>
          ) : null}
        </span>
      );
    case "secret":
      return (
        <span className="flex min-h-5.5 items-center gap-1 self-start rounded-(--radius-sm) bg-secondary px-1.5 text-xs text-muted-foreground-1">
          <LockIcon className="size-3 text-icon-muted" />
          Changed (hidden)
        </span>
      );
  }
}

function Changes({ event }: { event: AuditEvent }) {
  const changed = changedFieldsFact(event);
  const changes = event.changes.filter(isShownChange);
  if (changes.length === 0 && changed === undefined) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground-1">
        Changes
      </span>
      {changes.map((change, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: changes have no id and keep their order
        <div key={index} className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground-2">
            {changeLabel(change)}
          </span>
          <ChangeValue change={change} />
        </div>
      ))}
      {changed !== undefined && changed.value._tag === "list" ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground-2">Changed</span>
          <span className="text-sm text-foreground">
            {changed.value.items
              .map((field) => auditChangeFieldLabels[field] ?? field)
              .join(", ")}
          </span>
          <span className="text-xs text-muted-foreground-2">
            Values not recorded
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ThreadValue({
  code,
  title,
  jamId,
}: {
  code: string | null;
  title: string | null;
  jamId: string;
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
      <Link
        data-track-owner="features/settings/org-audit-log-page.tsx#ThreadValue:Link.1"
        to="/thread/$threadId"
        params={{ threadId: jamId }}
        className="shrink-0 rounded font-medium text-(--text-link) underline-offset-2 outline-none hover:underline focus-visible:outline-ring-inset"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {code ?? "Open thread"}
      </Link>
      {title === null ? null : (
        <span className="min-w-0 break-words">{title}</span>
      )}
    </span>
  );
}

const notVisible = (
  <span className="text-muted-foreground-2">Not visible to you</span>
);

function FactValue({ fact }: { fact: AuditFact }) {
  const value = fact.value;
  switch (value._tag) {
    case "text":
      return <span className="break-words">{value.text}</span>;
    case "list":
      return <span className="break-words">{value.items.join(", ")}</span>;
    case "change":
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground-1">
            {value.from ?? "None"}
          </span>
          <ChevronRightSmallIcon className="size-(--icon-xs) shrink-0 text-icon-muted" />
          <span>{value.to ?? "None"}</span>
        </span>
      );
    case "people":
      return (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {value.people.map((person) => (
            <span key={person.userId} className="flex items-center gap-1.5">
              <Avatar
                size="xs"
                src={person.imageUrl}
                name={personName(person)}
              />
              {personName(person)}
            </span>
          ))}
        </span>
      );
    case "thread":
      return value.thread === null ? (
        notVisible
      ) : (
        <ThreadValue
          code={value.thread.code}
          title={value.thread.title}
          jamId={value.thread.jamId}
        />
      );
  }
}

function Facts({ event }: { event: AuditEvent }) {
  const supported = isSupportedEvent(event);
  const subject = supported ? event.subject : null;
  const kind =
    subject === null || subject.kind === null
      ? null
      : subjectKinds[subject.kind];
  const changed = changedFieldsFact(event);
  const facts = supported
    ? event.facts.filter((fact) => fact !== changed && isShownFact(fact))
    : [];
  return (
    <div className="flex flex-col gap-0.5 text-sm text-foreground">
      <DetailRow icon={<UserIcon />} label="Actor">
        <ActorLabel event={event} />
      </DetailRow>
      {kind !== null && subject?.person != null ? (
        <DetailRow icon={<UserIcon />} label={kind.label}>
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              size="xs"
              src={subject.person.imageUrl}
              name={personName(subject.person)}
            />
            <span className="truncate">{personName(subject.person)}</span>
          </span>
        </DetailRow>
      ) : null}
      {event.viaAgent ? (
        <DetailRow icon={<AgentFlowIcon />} label="Thread">
          {event.thread === null ? (
            notVisible
          ) : (
            <ThreadValue
              code={event.thread.code}
              title={event.thread.title}
              jamId={event.thread.jamId}
            />
          )}
        </DetailRow>
      ) : null}
      {event.viaAgent ? (
        <DetailRow icon={<UserIcon />} label="On behalf of">
          <span className="flex min-w-0 items-center gap-1.5">
            {event.actor._tag === "human" ? (
              <Avatar
                size="xs"
                src={event.actor.person.imageUrl}
                name={personName(event.actor.person)}
              />
            ) : null}
            <span className="truncate">{actorName(event.actor)}</span>
          </span>
        </DetailRow>
      ) : null}
      {facts.map((fact, index) => (
        <DetailRow
          // biome-ignore lint/suspicious/noArrayIndexKey: facts have no id and keep their order
          key={index}
          icon={factIcons[fact.key] ?? <CircleInfoIcon />}
          label={auditFactLabels[fact.key]}
        >
          <FactValue fact={fact} />
        </DetailRow>
      ))}
      <DetailRow icon={<ClockIcon />} label="Time">
        <span className="tabular-nums">{formatTimestamp(event.createdAt)}</span>
      </DetailRow>
      <DetailRow icon={<FingerPrintIcon />} label="Event ID">
        <span className="truncate text-xs text-muted-foreground-2">
          {event.id}
        </span>
      </DetailRow>
    </div>
  );
}

/** The details card beside the table for the selected event. */
export function AuditInspector({
  event,
  onClose,
}: {
  event: AuditEvent;
  onClose: () => void;
}) {
  const subject = subjectLabel(event);
  return (
    <Card
      aria-label="Audit event details"
      className="sticky top-4 flex w-85 shrink-0 flex-col gap-3.5 overflow-clip rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card p-4 shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <ActorAvatar event={event} size="inspector" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {actionLabel(event)}
          </span>
          {subject === null ? null : (
            <span
              className="truncate text-sm text-muted-foreground-1"
              title={subject}
            >
              {subject}
            </span>
          )}
        </div>
        <Button
          data-track-owner="features/settings/org-audit-log-page.tsx#AuditInspector:Button[Close details]"
          variant="ghost"
          size="icon-xs"
          className={ghostButtonClassName("icon-xs")}
          aria-label="Close details"
          onClick={onClose}
        >
          <CrossSmallIcon />
        </Button>
      </div>
      <Separator />
      {hasDetails(event) ? (
        <>
          <Changes event={event} />
          <Separator />
        </>
      ) : null}
      <Facts event={event} />
    </Card>
  );
}

/** The same details as the inspector, laid out for the narrow-screen sheet. */
export function AuditSheetDetails({ event }: { event: AuditEvent }) {
  const subject = subjectLabel(event);
  return (
    <>
      <div className="flex items-center gap-2.5">
        <ActorAvatar event={event} size="base" />
        <span className="flex min-w-0 flex-col gap-0.5 text-base font-medium text-foreground">
          <span>{actionLabel(event)}</span>
          {subject === null ? null : (
            <span className="break-words text-sm font-normal text-muted-foreground-1">
              {subject}
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-4 pb-8">
        {isSupportedEvent(event) ? <Changes event={event} /> : null}
        <Facts event={event} />
      </div>
    </>
  );
}
