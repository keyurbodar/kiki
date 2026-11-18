import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import { SettingsPage } from "@/components/settings-page";
import {
  auditMembersAtom,
  auditPageAtom,
  auditPagesAtom,
} from "@/data/atoms/audit.ts";
import { organizationsAtom } from "@/data/atoms/session.ts";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuContent,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import {
  SideSheet,
  SideSheetContent,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import { auditFamilyLabels } from "./audit-catalog";
import {
  type ActorChoice,
  type AuditFilters,
  auditQueryKey,
  decodePageResult,
  defaultAuditFilters,
  hasActiveFilters,
  isSameActor,
  memberLabel,
  mergeAuditPages,
  parseAuditMembers,
} from "./audit-filters";
import { actionLabel, actorParts, subjectLabel } from "./audit-format";
import { AuditInspector, AuditSheetDetails } from "./audit-inspector";
import {
  AuditNotice,
  AuditTable,
  Avatar,
  LedgerRow,
  ListSkeleton,
  SortableTableHead,
  TableHead,
  TableHeaderRow,
  TableRow,
  TableSkeleton,
} from "./audit-parts";
import type { AuditEvent, AuditFamily } from "./audit-schema";
import { formatRelativeTime } from "./relative-time";

const clockIcon = <Icon name="clock-alert" size="xs" />;
const searchIcon = <Icon name="deep-search" size="xs" />;
const filterIcon = <Icon name="settings-slider-hor" size="xs" />;
const closeIcon = <Icon name="x" size="xs" />;

const debounceMs = 250;
const timestampBase = 1772432400000;

function useOrgId() {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? (organizations.value[0]?.id as string | undefined)
    : undefined;
}

/** The organizations read, so a failed one is not mistaken for "no org yet". */
function useOrgRead() {
  return useAtomValue(organizationsAtom);
}

function useDebounced(value: string, delay = debounceMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(width < 48rem)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(width < 48rem)");
    const update = (event: MediaQueryListEvent | MediaQueryList) =>
      setNarrow(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

const actorChoices: ReadonlyArray<ActorChoice> = [
  { kind: "human", userId: "self" },
  { kind: "agent" },
  { kind: "service" },
  { kind: "system" },
];

export function AuditLogPage() {
  return (
    <SettingsPage
      title="Audit log"
      description="Who changed what in this organization"
      width="wide"
    >
      <AuditLogLoader />
    </SettingsPage>
  );
}

function AuditLogLoader() {
  const orgId = useOrgId();
  const orgRead = useOrgRead();
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  if (AsyncResult.isFailure(orgRead))
    return (
      <FailedRead
        slot="audit-log-org-failed"
        line="Couldn't load your organization"
        sub="Check your connection and try again"
        onRetry={refreshOrganizations}
      />
    );
  if (orgId === undefined)
    return (
      <AuditLog
        orgId={undefined}
        events={[]}
        state="loading"
        next={null}
        cursors={[""]}
        forbidden={false}
        onMore={() => undefined}
        onRetry={() => undefined}
        onClear={() => undefined}
        members={[]}
      />
    );
  return <AuditLogData orgId={orgId} />;
}

function AuditLogData({ orgId }: { orgId: string }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [cursors, setCursors] = useState<ReadonlyArray<string>>([""]);
  const [now] = useState(() => Date.now());
  const debounced = useDebounced(search);
  const key = auditQueryKey(filters, debounced, now);
  const results = useAtomValue(auditPagesAtom(orgId, key, cursors));
  const refresh = useAtomRefresh(
    auditPageAtom(orgId, { ...key, cursor: cursors.at(-1) }),
  );
  const membersResult = useAtomValue(auditMembersAtom(orgId));
  const members = AsyncResult.isSuccess(membersResult)
    ? parseAuditMembers(membersResult.value)
    : [];
  const state = mergeAuditPages(cursors, results.map(decodePageResult));
  const filterKey = JSON.stringify(key);
  const priorKey = useRef(filterKey);
  useEffect(() => {
    if (priorKey.current === filterKey) return;
    priorKey.current = filterKey;
    setCursors([""]);
  }, [filterKey]);
  const active = hasActiveFilters(filters, search);
  return (
    <AuditLog
      orgId={orgId}
      events={state.events}
      state={state.state}
      next={state.next}
      cursors={cursors}
      forbidden={state.forbidden}
      members={members}
      search={search}
      filters={filters}
      active={active}
      onSearch={setSearch}
      onFilters={setFilters}
      onClear={() => {
        setFilters(defaultAuditFilters);
        setSearch("");
      }}
      onMore={() => {
        if (state.next !== null) setCursors([...cursors, state.next]);
      }}
      onRetry={() => refresh()}
    />
  );
}

type AuditLogProps = {
  orgId: string | undefined;
  events: ReadonlyArray<AuditEvent>;
  state: "more" | "complete" | "loading" | "failed";
  next: string | null;
  cursors: ReadonlyArray<string>;
  forbidden: boolean;
  members: ReadonlyArray<{
    userId: string;
    name: string | null;
    email: string | null;
    imageUrl: string | null;
  }>;
  search?: string;
  filters?: AuditFilters;
  active?: boolean;
  onSearch?: (value: string) => void;
  onFilters?: (filters: AuditFilters) => void;
  onClear?: () => void;
  onMore: () => void;
  onRetry: () => void;
};

export function AuditLog({
  orgId,
  events,
  state,
  cursors,
  forbidden,
  members,
  search = "",
  filters = defaultAuditFilters,
  active = false,
  onSearch = () => undefined,
  onFilters = () => undefined,
  onClear = () => undefined,
  onMore,
  onRetry,
}: AuditLogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const narrow = useNarrow();
  const event = events.find((row) => row.id === selected);
  const loading = events.length === 0 && state === "loading";
  const notice = forbidden ? (
    <AuditNotice>
      Only organization admins and owners can view the audit log
    </AuditNotice>
  ) : events.length === 0 && state === "failed" ? (
    <AuditNotice
      action={
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      Could not load audit events
    </AuditNotice>
  ) : events.length === 0 && active ? (
    <AuditNotice
      action={
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      }
    >
      No events match these filters
    </AuditNotice>
  ) : events.length === 0 ? (
    <AuditNotice>No audit events yet</AuditNotice>
  ) : null;
  const toggleOrder = () =>
    onFilters({
      ...filters,
      order: filters.order === "newest" ? "oldest" : "newest",
    });
  const people = members.length > 0 ? members : [];
  const actorMenu = (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Actor filter"
            className="text-muted-foreground-1"
          />
        }
      >
        {filterIcon}
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="w-56">
        {actorChoices.map((choice) => {
          const member =
            choice.kind === "human"
              ? people.find((person) => person.userId === choice.userId)
              : undefined;
          const label =
            choice.kind === "human"
              ? member === undefined
                ? "People"
                : memberLabel(member)
              : choice.kind === "agent"
                ? "Capy"
                : choice.kind === "service"
                  ? "API keys"
                  : "System";
          return (
            <ResponsiveMenuCheckboxItem
              key={choice.kind}
              checked={isSameActor(filters.actor, choice)}
              onCheckedChange={(checked) =>
                onFilters({ ...filters, actor: checked ? choice : null })
              }
            >
              {label}
            </ResponsiveMenuCheckboxItem>
          );
        })}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
  const familyMenu = (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Action filter"
            className="text-muted-foreground-1"
          />
        }
      >
        {clockIcon}
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="w-64">
        {(Object.keys(auditFamilyLabels) as AuditFamily[]).map((family) => (
          <ResponsiveMenuCheckboxItem
            key={family}
            checked={filters.family === family}
            onCheckedChange={(checked) =>
              onFilters({ ...filters, family: checked ? family : null })
            }
          >
            {auditFamilyLabels[family]}
          </ResponsiveMenuCheckboxItem>
        ))}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex min-w-0 flex-1 items-center">
            {searchIcon}
            <input
              aria-label="Search audit events"
              placeholder="Search by person or subject"
              value={search}
              onChange={(input) => onSearch(input.target.value)}
              className="h-9 w-full rounded-md border-(--border-width-hairline) border-border-2 bg-input pr-3 pl-8 text-sm text-foreground outline-none placeholder:text-muted-foreground-3 focus-visible:outline-ring-inset"
            />
          </div>
          {actorMenu}
          {familyMenu}
        </div>
      </div>
      <div className="flex items-start gap-5">
        <div className="flex min-w-0 flex-1 flex-col">
          {narrow ? (
            <div className="flex flex-col">
              {loading ? (
                <ListSkeleton />
              ) : (
                events.map((row) => (
                  <TableRow
                    key={row.id}
                    interactive
                    aria-selected={row.id === selected}
                    onClick={() =>
                      setSelected(row.id === selected ? null : row.id)
                    }
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2">
                      <Avatar
                        src={
                          row.actor._tag === "human"
                            ? row.actor.person.imageUrl
                            : null
                        }
                        name={
                          row.actor._tag === "human"
                            ? (row.actor.person.name ?? "?")
                            : row.actor._tag === "service"
                              ? (row.actor.name ?? "?")
                              : "Capy"
                        }
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {actionLabel(row)}
                        </span>
                        <span className="truncate text-sm text-muted-foreground-1">
                          {subjectLabel(row) ?? actorParts(row)[0]}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground-2 tabular-nums">
                        {formatRelativeTime(row.createdAt, {
                          minified: true,
                          now: timestampBase,
                        })}
                      </span>
                    </span>
                  </TableRow>
                ))
              )}
            </div>
          ) : (
            <AuditTable
              aria-label="Audit events"
              className="px-0 [--table-row-h:calc(var(--spacing)*10)]"
            >
              <TableHeaderRow className="border-b-(--border-width-hairline) border-border-1">
                <SortableTableHead
                  className="pl-2.5"
                  direction={
                    filters.order === "newest" ? "descending" : "ascending"
                  }
                  onSort={toggleOrder}
                >
                  When
                </SortableTableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Subject</TableHead>
              </TableHeaderRow>
              {loading ? (
                <TableSkeleton />
              ) : (
                events.map((row, index) => (
                  <LedgerRow
                    key={row.id}
                    event={row}
                    selected={row.id === selected}
                    divided={
                      index < events.length - 1 &&
                      row.id !== selected &&
                      events[index + 1]?.id !== selected
                    }
                    onToggle={() =>
                      setSelected(row.id === selected ? null : row.id)
                    }
                  />
                ))
              )}
            </AuditTable>
          )}
          {notice}
          {events.length > 0 && state !== "complete" && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                disabled={state === "loading"}
                onClick={state === "failed" ? onRetry : onMore}
              >
                {state === "loading"
                  ? "Loading more"
                  : state === "failed"
                    ? "Retry loading"
                    : "Show more"}
              </Button>
            </div>
          )}
        </div>
        {!narrow && event !== undefined && (
          <AuditInspector event={event} onClose={() => setSelected(null)} />
        )}
      </div>
      <SideSheet
        open={narrow && event !== undefined}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SideSheetContent className="w-90 bg-card p-4">
          <SideSheetTitle className="sr-only">
            Audit event details
          </SideSheetTitle>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Close details"
              onClick={() => setSelected(null)}
            >
              {closeIcon}
            </Button>
          </div>
          {event !== undefined && <AuditSheetDetails event={event} />}
        </SideSheetContent>
      </SideSheet>
      <span className="sr-only" aria-live="polite">
        {cursors.length} pages loaded
      </span>
      <span className="sr-only">{orgId ?? ""}</span>
    </section>
  );
}
