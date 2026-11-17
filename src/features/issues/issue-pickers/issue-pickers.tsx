import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type KeyboardEvent, useState } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  type IssueColor,
  type IssuePriority,
  type IssueState,
  issuePriorities,
} from "@/data/api/schemas/issue";
import { issueLabelsAtom, issueStatesAtom } from "@/data/atoms/issues";
import { Icon } from "@/primitives/icon";
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
} from "@/primitives/menu";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssueStateIcon,
  issuePriorityLabels,
} from "../issue-parts";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";
const menuCheckSlot =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
const menuSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
const menuEmpty =
  "px-2 py-3 text-center text-sm font-normal text-muted-foreground-2";

/** Case-insensitive match of a query against any of an item's words. */
export const matchIssueOptions = <T,>(
  items: ReadonlyArray<T>,
  words: (item: T) => ReadonlyArray<string>,
  query: string,
) => {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...items];
  return items.filter((item) =>
    words(item).some((word) => word.toLowerCase().includes(needle)),
  );
};

function OptionCheck({ checked, index }: { checked: boolean; index?: number }) {
  return (
    <span className={menuCheckSlot}>
      {checked && (
        <Icon
          name="circle-check"
          className="size-(--icon-sm) text-foreground"
        />
      )}
      {index !== undefined && index < 10 && (
        <kbd className="text-xs text-muted-foreground-3">
          {String((index + 1) % 10)}
        </kbd>
      )}
    </span>
  );
}

function PickerSearch({
  label,
  query,
  onQuery,
}: {
  label: string;
  query: string;
  onQuery: (query: string) => void;
}) {
  return (
    <input
      className={menuSearchInput}
      placeholder={label}
      aria-label={label}
      value={query}
      onChange={(event) => onQuery(event.target.value)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Escape") event.stopPropagation();
      }}
    />
  );
}

export function useIssueStates(orgId: OrgId | undefined) {
  const result = useAtomValue(issueStatesAtom(orgId ?? ("" as OrgId)));
  return orgId !== undefined && AsyncResult.isSuccess(result)
    ? result.value.states
    : [];
}

export interface IssueLabelOption {
  readonly id: string;
  readonly name: string;
  readonly color: IssueColor;
}

export function useIssueLabels(
  orgId: OrgId | undefined,
): ReadonlyArray<IssueLabelOption> {
  const result = useAtomValue(issueLabelsAtom(orgId ?? ("" as OrgId)));
  if (orgId === undefined || !AsyncResult.isSuccess(result)) return [];
  const value = result.value as
    | ReadonlyArray<IssueLabelOption>
    | { labels: ReadonlyArray<IssueLabelOption> };
  return Array.isArray(value)
    ? value
    : (value as { labels: ReadonlyArray<IssueLabelOption> }).labels;
}

export function IssueStatusOptions({
  orgId,
  current,
  onPick,
}: {
  orgId: OrgId | undefined;
  current: string;
  onPick: (stateId: IssueState["id"]) => void;
}) {
  const [query, setQuery] = useState("");
  const states = matchIssueOptions(
    useIssueStates(orgId),
    (state) => [state.name],
    query,
  );
  const ordered = (["open", "closed"] as const).flatMap((type) =>
    states.filter((state) => state.type === type),
  );
  return (
    <>
      <PickerSearch label="Change status" query={query} onQuery={setQuery} />
      {(["open", "closed"] as const).map((type) => {
        const group = ordered.filter((state) => state.type === type);
        if (group.length === 0) return null;
        return (
          <MenuGroup key={type}>
            <MenuLabel>{type === "open" ? "Open" : "Closed"}</MenuLabel>
            {group.map((state) => (
              <MenuItem
                key={state.id}
                onClick={() => state.id !== current && onPick(state.id)}
              >
                <span className={menuIconSlot}>
                  <IssueStateIcon icon={state.icon} color={state.color} />
                </span>
                <span className="min-w-0 truncate">{state.name}</span>
                <OptionCheck
                  checked={state.id === current}
                  index={query === "" ? ordered.indexOf(state) : undefined}
                />
              </MenuItem>
            ))}
          </MenuGroup>
        );
      })}
      {states.length === 0 && (
        <div className={menuEmpty}>No matching states</div>
      )}
    </>
  );
}

export function IssuePriorityOptions({
  current,
  onPick,
}: {
  current: IssuePriority | undefined;
  onPick: (priority: IssuePriority) => void;
}) {
  const [query, setQuery] = useState("");
  const priorities = matchIssueOptions(
    issuePriorities,
    (priority) => [issuePriorityLabels[priority]],
    query,
  );
  return (
    <>
      <PickerSearch label="Change priority" query={query} onQuery={setQuery} />
      {priorities.map((priority, index) => (
        <MenuItem
          key={priority}
          onClick={() => priority !== current && onPick(priority)}
        >
          <span className={menuIconSlot}>
            <IssuePriorityIcon priority={priority} />
          </span>
          {issuePriorityLabels[priority]}
          <OptionCheck
            checked={priority === current}
            index={query === "" ? index : undefined}
          />
        </MenuItem>
      ))}
      {priorities.length === 0 && (
        <div className={menuEmpty}>No matching priorities</div>
      )}
    </>
  );
}

export function IssueLabelOptions({
  orgId,
  selected,
  onChange,
}: {
  orgId: OrgId | undefined;
  selected: ReadonlyArray<string>;
  onChange: (labelIds: ReadonlyArray<string>) => void;
}) {
  const [query, setQuery] = useState("");
  const labels = matchIssueOptions(
    useIssueLabels(orgId),
    (label) => [label.name],
    query,
  );
  return (
    <>
      <PickerSearch label="Change labels" query={query} onQuery={setQuery} />
      {labels.map((label) => {
        const checked = selected.includes(label.id);
        return (
          <MenuCheckboxItem
            key={label.id}
            checked={checked}
            closeOnClick={false}
            onCheckedChange={(next) =>
              onChange(
                next
                  ? [...selected, label.id]
                  : selected.filter((id) => id !== label.id),
              )
            }
          >
            <span className={menuIconSlot}>
              <IssueLabelDot color={label.color} />
            </span>
            <span className="min-w-0 truncate">{label.name}</span>
            <OptionCheck checked={checked} />
          </MenuCheckboxItem>
        );
      })}
      {labels.length === 0 && (
        <div className={menuEmpty}>No matching labels</div>
      )}
    </>
  );
}
