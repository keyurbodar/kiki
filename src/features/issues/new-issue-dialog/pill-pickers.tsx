import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { DueDatePicker, relativeDueLabel } from "@/components/issue-due";
import {
  CalendarGlyph,
  IssuePickerCheck,
  IssuePickerMenu,
  IssuePickerValue,
  issuePickerGlyphClass,
  issuePickerTrigger,
  TagGlyph,
} from "@/components/issue-pickers";
import type { IssueLabelId, IssueStateId, OrgId } from "@/data/api/schemas/ids";
import type {
  IssueAssigneeInput,
  IssueDueDate,
  IssuePriority,
} from "@/data/api/schemas/issue";
import { currentUserAtom } from "@/data/atoms/session";
import { MenuItem } from "@/primitives/menu";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssueStateIcon,
  issuePriorityLabels,
} from "../issue-parts";
import {
  IssueLabelOptions,
  IssuePriorityOptions,
  IssueStatusOptions,
  useIssueLabels,
  useIssueStates,
} from "../issue-pickers";
import { menuPopup } from "./classes";
import { UserGlyph } from "./icons";

const xsGlyph = "size-(--icon-xs)";

export function StatusPill({
  orgId,
  stateId,
  onPick,
}: {
  orgId: OrgId | undefined;
  stateId: IssueStateId | undefined;
  onPick: (stateId: IssueStateId) => void;
}) {
  const state = useIssueStates(orgId).find((each) => each.id === stateId);
  return (
    <IssuePickerMenu
      label="Change status"
      className={cx(menuPopup, "w-56")}
      trigger={issuePickerTrigger({
        look: "pill",
        label: "Status",
        children: (
          <IssuePickerValue
            glyph={
              state && (
                <IssueStateIcon
                  icon={state.icon}
                  color={state.color}
                  className={xsGlyph}
                />
              )
            }
            placeholder={state === undefined}
          >
            {state?.name ?? "Status"}
          </IssuePickerValue>
        ),
      })}
    >
      <IssueStatusOptions
        orgId={orgId}
        current={stateId ?? ""}
        onPick={onPick}
      />
    </IssuePickerMenu>
  );
}

export function PriorityPill({
  priority,
  onPick,
}: {
  priority: IssuePriority;
  onPick: (priority: IssuePriority) => void;
}) {
  return (
    <IssuePickerMenu
      label="Change priority"
      className={cx(menuPopup, "w-48")}
      trigger={issuePickerTrigger({
        look: "pill",
        label: "Priority",
        children: (
          <IssuePickerValue
            glyph={
              <IssuePriorityIcon priority={priority} className={xsGlyph} />
            }
          >
            {issuePriorityLabels[priority]}
          </IssuePickerValue>
        ),
      })}
    >
      <IssuePriorityOptions current={priority} onPick={onPick} />
    </IssuePickerMenu>
  );
}

const fullName = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ") || "Member";

export function AssigneePill({
  assignee,
  onChange,
}: {
  assignee: IssueAssigneeInput | null;
  onChange: (assignee: IssueAssigneeInput | null) => void;
}) {
  const user = useAtomValue(currentUserAtom);
  const me = AsyncResult.isSuccess(user) ? user.value : undefined;
  const myName = me && fullName(me.firstName, me.lastName);
  const picked =
    assignee === null ? undefined : assignee.id === me?.id ? myName : "Member";
  return (
    <IssuePickerMenu
      label="Change assignees"
      className={cx(menuPopup, "w-60")}
      trigger={issuePickerTrigger({
        look: "pill",
        label: "Assignees",
        children: (
          <IssuePickerValue
            glyph={<UserGlyph className={xsGlyph} />}
            placeholder={picked === undefined}
          >
            {picked ?? "Assignee"}
          </IssuePickerValue>
        ),
      })}
    >
      <MenuItem onClick={() => onChange(null)}>
        <span className={issuePickerGlyphClass}>
          <UserGlyph />
        </span>
        <span className="min-w-0 truncate">No assignee</span>
        <IssuePickerCheck checked={assignee === null} />
      </MenuItem>
      {me !== undefined && (
        <MenuItem onClick={() => onChange({ kind: "user", id: me.id })}>
          <span className={issuePickerGlyphClass}>
            <UserGlyph />
          </span>
          <span className="min-w-0 truncate">{myName}</span>
          <IssuePickerCheck checked={assignee?.id === me.id} />
        </MenuItem>
      )}
    </IssuePickerMenu>
  );
}

export function LabelsPill({
  orgId,
  labelIds,
  onChange,
}: {
  orgId: OrgId | undefined;
  labelIds: ReadonlyArray<IssueLabelId>;
  onChange: (labelIds: ReadonlyArray<IssueLabelId>) => void;
}) {
  const labels = useIssueLabels(orgId).filter((label) =>
    labelIds.includes(label.id as IssueLabelId),
  );
  return (
    <IssuePickerMenu
      label="Change labels"
      className={cx(menuPopup, "w-60")}
      trigger={issuePickerTrigger({
        look: "pill",
        label: "Labels",
        children:
          labels.length === 0 ? (
            <IssuePickerValue
              glyph={<TagGlyph className={xsGlyph} />}
              placeholder
            >
              Labels
            </IssuePickerValue>
          ) : (
            <>
              <span className="flex shrink-0 items-center -space-x-0.5">
                {labels.map((label) => (
                  <IssueLabelDot
                    key={label.id}
                    color={label.color}
                    className="ring-2 ring-background"
                  />
                ))}
              </span>
              <span className="min-w-0 truncate text-foreground">
                {labels.map((label) => label.name).join(", ")}
              </span>
            </>
          ),
      })}
    >
      <IssueLabelOptions
        orgId={orgId}
        selected={labelIds}
        onChange={(next) => onChange(next as ReadonlyArray<IssueLabelId>)}
      />
    </IssuePickerMenu>
  );
}

export function DueDatePill({
  value,
  today,
  onChange,
}: {
  value: IssueDueDate | undefined;
  today: IssueDueDate;
  onChange: (value: IssueDueDate | undefined) => void;
}) {
  return (
    <DueDatePicker
      value={value}
      today={today}
      onChange={(due) =>
        onChange((due ?? undefined) as IssueDueDate | undefined)
      }
      trigger={issuePickerTrigger({
        look: "pill",
        label: "Due date",
        children: (
          <IssuePickerValue
            glyph={<CalendarGlyph className={xsGlyph} />}
            placeholder={value === undefined}
          >
            {value === undefined ? "Due date" : relativeDueLabel(value, today)}
          </IssuePickerValue>
        ),
      })}
    />
  );
}
