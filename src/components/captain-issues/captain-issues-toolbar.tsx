import { useAtom, useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { emptyActorSources } from "@/components/actor-filter";
import type { IssueState } from "@/data/api/schemas/issue";
import { issueStatesAtom } from "@/data/atoms/issues";
import { useOrgId } from "@/features/captains/dialogs/session";
import { IssueStateIcon } from "@/features/issues/issue-parts";
import {
  emptyIssueFilters,
  type IssueFilterSources,
  IssuesFilterMenu,
} from "../issues-filters";
import { IssuesDisplayMenu } from "../issues-toolbar/issues-toolbar";
import { captainIssueDisplayAtom } from "./atoms";
import {
  CaptainIssuesToolbarFallback,
  type CaptainIssuesToolbarProps,
} from "./captain-issues";
import { fromIssueFilters, toIssueFilters } from "./filters";

/** The filter submenus whose values the pane's list reads. */
const paneFilterSections = ["status"] as const;

/** The properties a pane row can draw; relations and pulls are page columns. */
const paneProperties = [
  "id",
  "priority",
  "labels",
  "due",
  "assignee",
  "updated",
] as const;

type IssueStateValue = { readonly states: ReadonlyArray<IssueState> };

const idleStates: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
  Atom.make(AsyncResult.initial(false));

/**
 * The crew issues pane's toolbar: the view tabs, the search toggle, and the
 * filter and display menus, over the pane's own filter and display atoms.
 */
export function CaptainIssuesToolbar(props: CaptainIssuesToolbarProps) {
  const [display, setDisplay] = useAtom(captainIssueDisplayAtom(props.scope));
  const orgId = useOrgId();
  const states: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    orgId === undefined ? idleStates : issueStatesAtom(orgId);
  const result = useAtomValue(states);
  const sources: IssueFilterSources = {
    states: AsyncResult.isSuccess(result)
      ? (result.value as IssueStateValue).states.map((state) => ({
          key: state.id,
          label: state.name,
          leading: <IssueStateIcon icon={state.icon} color={state.color} />,
        }))
      : [],
    priorities: [],
    projects: [],
    labels: [],
    actors: emptyActorSources,
  };
  return (
    <CaptainIssuesToolbarFallback
      {...props}
      actions={
        <>
          {props.actions}
          <IssuesFilterMenu
            filters={toIssueFilters(props.filters)}
            sources={sources}
            only={paneFilterSections}
            onChange={(next) => props.onFilters(fromIssueFilters(next))}
            onClear={() => props.onFilters(fromIssueFilters(emptyIssueFilters))}
          />
          <IssuesDisplayMenu
            display={display}
            onChange={setDisplay}
            properties={paneProperties}
          />
        </>
      }
    />
  );
}
