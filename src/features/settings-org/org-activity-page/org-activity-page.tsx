import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import {
  orgActivityAtom,
  orgActivityKey,
  orgHourlyActivityAtom,
  orgMembersAtom,
} from "@/data/atoms/activity";
import { organizationsAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  ActivityFilterMenu,
  type ActivityFilterOption,
} from "../activity-filter-menu";
import {
  ActivityNotice,
  SplitControl,
  type SplitOption,
} from "./activity-chart";
import {
  type ActivityMachineFilter,
  type ActivityPreset,
  type ActivitySearch,
  formatAgentHours,
  formatCount,
  isoDate,
  resolveRange,
  validateActivitySearch,
  viewerTimeZone,
} from "./activity-range";
import type { FleetHourlyActivity, OrgActivity } from "./activity-schema";
import {
  decodeHourlyActivity,
  decodeOrgActivity,
  isActivityPayload,
} from "./activity-schema";
import {
  AgentHoursChart,
  FeedbackLoopsChart,
  HourlyActivity,
  hourlyTitle,
  MergedChart,
  type People,
} from "./activity-sections";
import { ActivityStats } from "./activity-stats";
import { ContributionGrid } from "./contribution-grid";
import { MemberAvatar, type MemberDisplay } from "./member-avatar";

const presets: ReadonlyArray<Exclude<ActivityPreset, "custom">> = [
  "24h",
  "7d",
  "30d",
  "90d",
];

const totalSplit: ReadonlyArray<SplitOption<"total" | "member">> = [
  ["total", "Total"],
  ["member", "By member"],
];

const machineSplit: ReadonlyArray<SplitOption<"all" | ActivityMachineFilter>> =
  [
    ["all", "All"],
    ["cloud", "Cloud"],
    ["device", "Local"],
  ];

const loopSplit: ReadonlyArray<SplitOption<"trigger" | "member">> = [
  ["trigger", "By trigger"],
  ["member", "By member"],
];

const plural = (count: number, one: string, many: string) =>
  `${formatCount(count)} ${count === 1 ? one : many}`;

export const serviceUsersNote = (users: OrgActivity["serviceUsers"]) =>
  `Member splits leave out ${
    users.count === 1
      ? "the API-key service user"
      : `${users.count} API-key service users`
  }: ${[
    plural(users.merged, "PR merged", "PRs merged"),
    ...(users.loops === null
      ? []
      : [plural(users.loops, "feedback loop", "feedback loops")]),
    ...(users.agentMs === null
      ? []
      : [`${formatAgentHours(users.agentMs)} agent time`]),
  ].join(", ")}`;

type MemberRow = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
};

const text = (value: unknown) => (typeof value === "string" ? value : null);

export const memberRowsFrom = (value: unknown): MemberRow[] => {
  const items = Array.isArray(value)
    ? value
    : typeof value === "object" &&
        value !== null &&
        Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const row = item as Record<string, unknown>;
    const userId = text(row.userId) ?? text(row.id);
    return userId === null
      ? []
      : [
          {
            userId,
            firstName: text(row.firstName),
            lastName: text(row.lastName),
            email: text(row.email),
            imageUrl: text(row.imageUrl),
          },
        ];
  });
};

export const memberDisplay = (member: MemberRow): MemberDisplay => ({
  name:
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    (member.email ?? member.userId),
  imageUrl: member.imageUrl ?? null,
  kind: "member",
});

const ownerAvatar = (owner: string) =>
  `https://avatars.githubusercontent.com/${encodeURIComponent(owner)}`;

function ProjectIcon({ repos }: { repos: ReadonlyArray<string> }) {
  const owners = [
    ...new Set(repos.map((repo) => repo.split("/")[0] ?? "")),
  ].slice(0, 3);
  return (
    <span className="flex shrink-0 items-center">
      {owners.map((owner, index) => (
        <MemberAvatar
          key={owner}
          display={{ name: owner, imageUrl: ownerAvatar(owner) }}
          className={index > 0 ? "-ml-1" : undefined}
        />
      ))}
    </span>
  );
}

function CustomRange({
  selected,
  from,
  to,
  onApply,
}: {
  selected: boolean;
  from: string | undefined;
  to: string | undefined;
  onApply: (from: string, to: string) => void;
}) {
  const today = isoDate(Date.now(), viewerTimeZone());
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(from ?? today);
  const [end, setEnd] = useState(to ?? today);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="xs"
            variant="ghost"
            data-selected={selected ? "" : undefined}
            aria-pressed={selected}
          />
        }
      >
        Custom
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-64 flex-col gap-3 p-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground-2">
          From
          <input
            type="date"
            className="h-(--h-control-sm) rounded-md border-(--border-width-hairline) border-border-2 bg-input px-2 text-sm text-foreground"
            value={start}
            max={end}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground-2">
          To
          <input
            type="date"
            className="h-(--h-control-sm) rounded-md border-(--border-width-hairline) border-border-2 bg-input px-2 text-sm text-foreground"
            value={end}
            min={start}
            max={today}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
        <Button
          size="sm"
          disabled={start === "" || end === ""}
          onClick={() => {
            onApply(start, end);
            setOpen(false);
          }}
        >
          Apply
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const resultValueOf = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

const failedOf = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isFailure(result) && result.previousSuccess._tag === "None";

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

export function OrgActivityPage() {
  return (
    <SettingsPage
      title="Activity"
      description="What Capy got done for this organization"
      width="wide"
    >
      <OrgActivityLoader />
    </SettingsPage>
  );
}

function OrgActivityLoader() {
  const orgId = useOrgId();
  const orgRead = useOrgRead();
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  if (AsyncResult.isFailure(orgRead))
    return (
      <FailedRead
        slot="activity-org-failed"
        line="Couldn't load your organization"
        sub="Check your connection and try again"
        onRetry={refreshOrganizations}
      />
    );
  if (orgId === undefined)
    return (
      <OrgActivityBody
        search={{}}
        activity={undefined}
        activityFailed={false}
        hourly={undefined}
        hourlyFailed={false}
        members={undefined}
        onSearch={() => undefined}
        onRetry={() => undefined}
        onRetryHourly={() => undefined}
      />
    );
  return <OrgActivityData orgId={orgId} />;
}

function OrgActivityData({ orgId }: { orgId: string }) {
  const search = validateActivitySearch(useSearch({ strict: false }));
  const navigate = useNavigate();
  const [now] = useState(() => new Date());
  const timeZone = viewerTimeZone();
  const range = resolveRange(search, now, timeZone);
  const key = orgActivityKey({
    orgId,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    timeZone,
    project: search.project,
    member: search.member,
    machine: search.machine,
  });
  const activityResult = useAtomValue(orgActivityAtom(key));
  const hourlyResult = useAtomValue(orgHourlyActivityAtom(key));
  const membersResult = useAtomValue(orgMembersAtom(orgId));
  const retry = useAtomRefresh(orgActivityAtom(key));
  const retryHourly = useAtomRefresh(orgHourlyActivityAtom(key));
  const members = AsyncResult.isSuccess(membersResult)
    ? memberRowsFrom(membersResult.value)
    : AsyncResult.isFailure(membersResult)
      ? []
      : undefined;
  const activityPayload = resultValueOf(activityResult);
  const activity =
    activityPayload !== undefined && isActivityPayload(activityPayload)
      ? decodeOrgActivity(activityPayload)
      : undefined;
  const hourlyPayload = resultValueOf(hourlyResult);
  const hourly =
    hourlyPayload === undefined || Array.isArray(hourlyPayload)
      ? undefined
      : decodeHourlyActivity(hourlyPayload);
  return (
    <OrgActivityBody
      search={search}
      now={now}
      activity={activity}
      activityFailed={
        activityPayload === undefined
          ? failedOf(activityResult)
          : !isActivityPayload(activityPayload)
      }
      hourly={hourly}
      hourlyFailed={
        hourlyPayload === undefined
          ? failedOf(hourlyResult)
          : Array.isArray(hourlyPayload)
      }
      members={members}
      onSearch={(patch) =>
        void navigate({
          to: ".",
          search: (current: Record<string, unknown>) => ({
            ...current,
            ...patch,
          }),
          replace: true,
        } as never)
      }
      onRetry={retry}
      onRetryHourly={retryHourly}
    />
  );
}

export type OrgActivityBodyProps = {
  search: ActivitySearch;
  now?: Date;
  activity: OrgActivity | undefined;
  activityFailed: boolean;
  hourly: FleetHourlyActivity | null | undefined;
  hourlyFailed: boolean;
  members: ReadonlyArray<MemberRow> | undefined;
  onSearch: (patch: Partial<Record<keyof ActivitySearch, unknown>>) => void;
  onRetry: () => void;
  onRetryHourly: () => void;
};

export function OrgActivityBody({
  search,
  now,
  activity,
  activityFailed,
  hourly,
  hourlyFailed,
  members,
  onSearch,
  onRetry,
  onRetryHourly,
}: OrgActivityBodyProps) {
  const [mergedSplit, setMergedSplit] = useState<"total" | "member">("total");
  const [loopsSplit, setLoopsSplit] = useState<"trigger" | "member">("trigger");
  const [hoursSplit, setHoursSplit] = useState<"total" | "member">("total");
  const [fallbackNow] = useState(() => new Date());
  const timeZone = viewerTimeZone();
  const range = resolveRange(search, now ?? fallbackNow, timeZone);
  const people: People = useMemo(
    () =>
      new Map(
        (members ?? []).map((member) => [member.userId, memberDisplay(member)]),
      ),
    [members],
  );
  const projectOptions: ActivityFilterOption[] = (
    activity?.projectOptions ?? []
  ).map((project) => ({
    value: project.id,
    label: project.name,
    icon: <ProjectIcon repos={project.repos} />,
  }));
  const memberOptions: ActivityFilterOption[] = [...people].map(
    ([userId, display]) => ({
      value: userId,
      label: display.name,
      icon: <MemberAvatar display={display} />,
    }),
  );
  const selectedProjects = search.project ?? [];
  const selectedMembers = search.member ?? [];
  const knownProjects =
    activity === undefined
      ? undefined
      : selectedProjects.filter((id) =>
          projectOptions.some((option) => option.value === id),
        );
  const knownMembers =
    members === undefined
      ? undefined
      : selectedMembers.filter((id) =>
          memberOptions.some((option) => option.value === id),
        );
  const staleProjects =
    knownProjects !== undefined &&
    knownProjects.length !== selectedProjects.length;
  const staleMembers =
    knownMembers !== undefined &&
    knownMembers.length !== selectedMembers.length;
  useEffect(() => {
    if (!staleProjects && !staleMembers) return;
    onSearch({
      ...(staleProjects
        ? { project: knownProjects?.length === 0 ? undefined : knownProjects }
        : {}),
      ...(staleMembers
        ? { member: knownMembers?.length === 0 ? undefined : knownMembers }
        : {}),
    });
  });
  const onMember = (userId: string) => onSearch({ member: [userId] });
  const note =
    activity === undefined ||
    activity.serviceUsers.count === 0 ||
    (mergedSplit === "total" &&
      loopsSplit === "trigger" &&
      hoursSplit === "total")
      ? undefined
      : serviceUsersNote(activity.serviceUsers);
  return (
    <>
      <SettingsSection>
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset}
              size="xs"
              variant="ghost"
              data-selected={range.preset === preset ? "" : undefined}
              aria-pressed={range.preset === preset}
              onClick={() =>
                onSearch({ preset, from: undefined, to: undefined })
              }
            >
              {preset}
            </Button>
          ))}
          <CustomRange
            selected={range.preset === "custom"}
            from={search.from}
            to={search.to}
            onApply={(from, to) => onSearch({ preset: "custom", from, to })}
          />
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1.5">
            <SplitControl
              label="Machine"
              value={search.machine ?? "all"}
              options={machineSplit}
              onChange={(machine) =>
                onSearch({ machine: machine === "all" ? undefined : machine })
              }
            />
            <ActivityFilterMenu
              label="Project"
              allLabel="All projects"
              noun="projects"
              heading="Projects"
              searchPlaceholder="Filter projects"
              options={projectOptions}
              selected={selectedProjects}
              onChange={(project) =>
                onSearch({
                  project: project.length === 0 ? undefined : project,
                })
              }
            />
            <ActivityFilterMenu
              label="Member"
              allLabel="Everyone"
              noun="members"
              heading="Members"
              searchPlaceholder="Filter members"
              options={memberOptions}
              selected={selectedMembers}
              onChange={(member) =>
                onSearch({ member: member.length === 0 ? undefined : member })
              }
            />
          </div>
        </div>
      </SettingsSection>
      {activityFailed ? (
        <SettingsSection>
          <ActivityNotice
            action={
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          >
            Could not load activity
          </ActivityNotice>
        </SettingsSection>
      ) : (
        <>
          <SettingsSection>
            <ActivityStats activity={activity} range={range} />
          </SettingsSection>
          <SettingsSection title="Contribution">
            <ContributionGrid activity={activity} timeZone={timeZone} />
          </SettingsSection>
          <SettingsSection
            title="Pull requests merged with Capy vs without"
            action={
              <SplitControl
                value={mergedSplit}
                options={totalSplit}
                onChange={setMergedSplit}
              />
            }
          >
            <MergedChart
              activity={activity}
              range={range}
              split={mergedSplit}
              people={people}
              onMember={onMember}
            />
          </SettingsSection>
          <SettingsSection
            id="feedback-loops"
            title="Feedback loops"
            action={
              <SplitControl
                value={loopsSplit}
                options={loopSplit}
                onChange={setLoopsSplit}
              />
            }
          >
            <FeedbackLoopsChart
              activity={activity}
              range={range}
              split={loopsSplit}
              people={people}
              onMember={onMember}
            />
          </SettingsSection>
          <SettingsSection
            id="agent-hours"
            title="Agent hours"
            action={
              <SplitControl
                value={hoursSplit}
                options={totalSplit}
                onChange={setHoursSplit}
              />
            }
          >
            <AgentHoursChart
              activity={activity}
              range={range}
              split={hoursSplit}
              people={people}
              onMember={onMember}
            />
          </SettingsSection>
          <SettingsSection title={hourlyTitle(hourly)}>
            <HourlyActivity
              hourly={hourly}
              failed={hourlyFailed}
              retry={
                <Button variant="ghost" size="sm" onClick={onRetryHourly}>
                  Retry
                </Button>
              }
            />
          </SettingsSection>
          {note !== undefined && (
            <p className="text-xs font-normal text-muted-foreground-2">
              {note}
            </p>
          )}
        </>
      )}
    </>
  );
}
