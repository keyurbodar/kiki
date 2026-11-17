import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import {
  ActorAvatar,
  type ActorOption,
  type ActorSources,
} from "@/components/actor-filter";
import {
  filtersForView,
  type IssueFilterSources,
  type IssueFilters,
  issueEmptyText,
  issueListQuery,
  localDate,
  viewOfFilters,
} from "@/components/issues-filters";
import { IssuesList } from "@/components/issues-list";
import {
  defaultIssueDisplay,
  type IssueDisplay,
  IssuesToolbar,
  PlusGlyph,
  SearchGlyph,
} from "@/components/issues-toolbar";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  type IssueActor,
  type IssueSummary,
  issuePriorities,
} from "@/data/api/schemas/issue";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";
import { issueStatesAtom } from "@/data/atoms/issues";
import { projectsAtom } from "@/data/atoms/projects";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssueStateIcon,
  issuePriorityLabels,
  useIssueOrgId,
} from "@/features/issues/issue-parts";
import {
  useIssueLabels,
  useIssueStates,
} from "@/features/issues/issue-pickers";
import { MobileIssueList } from "@/features/mobile/lists/issues";
import { useIsNarrow } from "@/features/mobile/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const splitKey = (key: string) => {
  const bar = key.indexOf("|");
  return [key.slice(0, bar) as OrgId, key.slice(bar + 1)] as const;
};

/** The issue list for one org and one filter query, keyed "orgId|queryJson". */
const issueListAtom = Atom.family((key: string) => {
  const [orgId, query] = splitKey(key);
  return ApiClient.query("issues", "list", {
    params: { orgId },
    query: JSON.parse(query) as never,
    reactivityKeys: [reactivityKeys.issues(orgId)],
    timeToLive: queryTimeToLive,
  });
});

const issueCountAtom = Atom.family((key: string) => {
  const [orgId, endpoint] = splitKey(key);
  return ApiClient.query(
    "issues",
    endpoint as "assignedCount" | "mentionCount",
    {
      params: { orgId },
      query: {},
      reactivityKeys: [reactivityKeys.issues(orgId)],
      timeToLive: queryTimeToLive,
    },
  );
});

const countOf = (value: unknown, field: "open" | "mentions") =>
  typeof value === "number"
    ? value
    : typeof value === "object" &&
        value !== null &&
        typeof (value as Record<string, unknown>)[field] === "number"
      ? ((value as Record<string, number>)[field] ?? 0)
      : undefined;

const actorOption = (actor: IssueActor): ActorOption => ({
  id: actor.id,
  label: actor.name,
  icon: <ActorAvatar name={actor.name} avatarUrl={actor.avatarUrl} />,
});

/** People, Captains and threads seen on the loaded issues, for the actor filters. */
export const actorSourcesOf = (
  issues: ReadonlyArray<IssueSummary>,
  meId: string | undefined,
): ActorSources => {
  const actors = new Map<string, IssueActor>();
  for (const issue of issues)
    for (const actor of [issue.assignee, ...(issue.assignees ?? [])])
      if (actor !== null && actor.hidden !== true) actors.set(actor.id, actor);
  const all = [...actors.values()].toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
  const me = all.find((actor) => actor.id === meId);
  return {
    me: me === undefined ? undefined : actorOption(me),
    people: all.filter((actor) => actor.kind === "user").map(actorOption),
    captains: all
      .filter((actor) => actor.kind === "jam" && actor.captain)
      .map(actorOption),
    threads: all
      .filter((actor) => actor.kind === "jam" && !actor.captain)
      .map(actorOption),
  };
};

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="inline-flex size-(--h-control-sm) shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground-1 outline-none transition-colors duration-100 hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset [&_svg]:size-(--icon-sm)"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Capy's IssuesPage: top bar with search, the view toolbar and the issue list. */
export function IssuesPage() {
  const orgId = useIssueOrgId();
  const [filters, setFilters] = useState<IssueFilters>(() =>
    filtersForView("for_you"),
  );
  const [display, setDisplay] = useState<IssueDisplay>(defaultIssueDisplay);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<ReadonlyMap<string, IssueSummary>>(
    new Map(),
  );
  const [now] = useState(() => Date.now());
  const narrow = useIsNarrow();
  const org = orgId ?? ("" as OrgId);
  const listKey = `${org}|${JSON.stringify(issueListQuery(filters, search, localDate(now)))}`;
  const listAtom = issueListAtom(listKey);
  const list = useAtomValue(listAtom);
  const refresh = useAtomRefresh(listAtom);
  const all = useAtomValue(issueListAtom(`${org}|{}`));
  const assigned = useAtomValue(issueCountAtom(`${org}|assignedCount`));
  const mentions = useAtomValue(issueCountAtom(`${org}|mentionCount`));
  const currentUser = useAtomValue(currentUserAtom);
  const projects = useAtomValue(projectsAtom(org));
  const statesAtomInstance = issueStatesAtom(org);
  const statesResult = useAtomValue(statesAtomInstance);
  const refreshStates = useAtomRefresh(statesAtomInstance);
  const statesFailed = AsyncResult.isFailure(statesResult);
  const statesPending =
    AsyncResult.isInitial(statesResult) || AsyncResult.isWaiting(statesResult);
  const states = useIssueStates(orgId);
  const labels = useIssueLabels(orgId);
  const issues = AsyncResult.isSuccess(list) ? list.value.issues : undefined;
  const allIssues = AsyncResult.isSuccess(all) ? all.value.issues : [];
  const projectList = AsyncResult.isSuccess(projects) ? projects.value : [];
  const meId = AsyncResult.isSuccess(currentUser)
    ? (currentUser.value as { readonly id?: string }).id
    : undefined;
  const sources: IssueFilterSources = {
    states: states.map((state) => ({
      key: state.id,
      label: state.name,
      leading: <IssueStateIcon icon={state.icon} color={state.color} />,
    })),
    priorities: issuePriorities.map((priority) => ({
      key: priority,
      label: issuePriorityLabels[priority],
      leading: <IssuePriorityIcon priority={priority} />,
    })),
    projects: projectList.map((project) => ({
      key: project.id,
      label: project.name,
    })),
    labels: labels.map((label) => ({
      key: label.id,
      label: label.name,
      leading: <IssueLabelDot color={label.color} />,
    })),
    actors: actorSourcesOf(allIssues, meId),
  };
  const changeFilters = (next: IssueFilters) => {
    setFilters(next);
    setChecked(new Map());
  };
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b-hairline border-border-1 px-3">
        {searchOpen ? (
          <input
            className="h-(--h-control-sm) min-w-0 flex-1 bg-transparent text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
            aria-label="Search issues"
            placeholder="Search issues"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              setSearch("");
              setSearchOpen(false);
            }}
          />
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Issues
          </h1>
        )}
        <HeaderButton
          label="Search issues"
          onClick={() => {
            if (searchOpen) setSearch("");
            setSearchOpen(!searchOpen);
          }}
        >
          <SearchGlyph />
        </HeaderButton>
        <HeaderButton label="New issue">
          <PlusGlyph />
        </HeaderButton>
      </header>
      <IssuesToolbar
        filters={filters}
        sources={sources}
        display={display}
        assignedCount={
          AsyncResult.isSuccess(assigned)
            ? countOf(assigned.value, "open")
            : undefined
        }
        mentionCount={
          AsyncResult.isSuccess(mentions)
            ? countOf(mentions.value, "mentions")
            : undefined
        }
        onFilters={changeFilters}
        onDisplay={setDisplay}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col pb-16">
          {orgId === undefined ? (
            <div className="flex items-center justify-center py-16 text-sm font-normal text-muted-foreground-2">
              No organization selected
            </div>
          ) : narrow ? (
            <MobileIssueList
              orgId={orgId}
              issues={issues}
              states={statesPending ? undefined : states}
              filters={filters}
              display={display}
              projectNames={Object.fromEntries(
                projectList.map((project) => [project.id, project.name]),
              )}
              now={now}
              emptyText={issueEmptyText(viewOfFilters(filters), search.trim())}
              failed={AsyncResult.isFailure(list) || statesFailed}
              onRetry={() => {
                refresh();
                refreshStates();
              }}
            />
          ) : (
            <IssuesList
              orgId={orgId}
              issues={issues}
              states={statesPending ? undefined : states}
              filters={filters}
              display={display}
              projectNames={Object.fromEntries(
                projectList.map((project) => [project.id, project.name]),
              )}
              now={now}
              emptyText={issueEmptyText(viewOfFilters(filters), search.trim())}
              failed={AsyncResult.isFailure(list) || statesFailed}
              onRetry={() => {
                refresh();
                refreshStates();
              }}
              checked={checked}
              onCheckedChange={setChecked}
            />
          )}
        </div>
      </div>
    </div>
  );
}
