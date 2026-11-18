import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ActorAvatar, type ActorSources } from "@/components/actor-filter";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssueSummary,
  UpdateIssueRequest,
} from "@/data/api/schemas/issue";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  markIssueSeenAtom,
  markIssueUnreadAtom,
  setIssueSubscriptionAtom,
  updateIssueAtom,
} from "@/data/atoms/issues";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@/primitives/menu";
import { CheckmarkGlyph } from "@/primitives/responsive-menu/glyphs";
import {
  IssueLabelDot,
  IssuePriorityIcon,
  IssueStateIcon,
  issuePriorityLabels,
  useIssueOrgId,
} from "../issue-parts";
import {
  IssueLabelOptions,
  IssuePriorityOptions,
  IssueStatusOptions,
  useIssueStates,
} from "../issue-pickers";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";
const menuValue =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export const issueMenuKeys = (orgId: OrgId, code: string) => [
  reactivityKeys.issue(orgId, code),
  reactivityKeys.issues(orgId),
];

/** Whether the read/unread item marks the issue read (true) or unread. */
export const issueMenuMarksRead = (issue: IssueSummary) =>
  (issue.viewer.subscribed && issue.viewer.unread) || issue.viewer.mentions > 0;

const copy = (text: string, success: string, failure: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success(success),
    () => toast.error(failure),
  );

function Submenu({
  icon,
  label,
  value,
  contentClassName,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  contentClassName: string;
  children: React.ReactNode;
}) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <span className={menuIconSlot}>{icon}</span>
        {label}
        <span className={menuValue}>
          {value}
          <Icon name="chevron-right" className="size-(--icon-xs)" />
        </span>
      </MenuSubTrigger>
      <MenuContent className={contentClassName}>{children}</MenuContent>
    </MenuSub>
  );
}

/**
 * The actions shared by the issue page's "…" menu and the list row's context
 * menu (Capy's IssueMenuItems). Render it inside any Menu or ContextMenu popup.
 */
export function IssueMenuItems({
  issue,
  onOpenIssue,
  actors,
}: {
  issue: IssueSummary;
  onOpenIssue?: (code: string) => void;
  /** The people, Captains and threads the Assignee row offers. */
  actors?: ActorSources;
}) {
  const navigate = useNavigate();
  const orgId = useIssueOrgId();
  const states = useIssueStates(orgId);
  const state = states.find((candidate) => candidate.id === issue.stateId);
  const update = useAtomSet(updateIssueAtom, { mode: "promise" });
  const markSeen = useAtomSet(markIssueSeenAtom, { mode: "promise" });
  const markUnread = useAtomSet(markIssueUnreadAtom, { mode: "promise" });
  const subscribe = useAtomSet(setIssueSubscriptionAtom, { mode: "promise" });
  const subscribed = issue.viewer.subscribed;
  const marksRead = issueMenuMarksRead(issue);
  const labels = issue.labels ?? [];

  const patch = (payload: UpdateIssueRequest, failure: string) => {
    if (orgId === undefined) return;
    update({
      params: { orgId, code: issue.code },
      payload,
      reactivityKeys: issueMenuKeys(orgId, issue.code),
    }).catch(() => toast.error(failure));
  };

  return (
    <>
      <MenuItem
        onClick={() =>
          onOpenIssue === undefined
            ? void navigate({
                to: "/issues/$code",
                params: { code: issue.code },
              })
            : onOpenIssue(issue.code)
        }
      >
        <span className={menuIconSlot}>
          <Icon name="arrow-corner-up-right" />
        </span>
        Open
      </MenuItem>
      <MenuItem
        onClick={() => void window.open(`/issues/${issue.code}`, "_blank")}
      >
        <span className={menuIconSlot}>
          <Icon name="browser-tabs" />
        </span>
        Open in new tab
      </MenuItem>
      <MenuSeparator />
      <Submenu
        icon={state && <IssueStateIcon icon={state.icon} color={state.color} />}
        label="Status"
        value={state?.name}
        contentClassName="w-56"
      >
        <IssueStatusOptions
          orgId={orgId}
          current={issue.stateId}
          onPick={(stateId) =>
            patch({ stateId }, "Could not change the status")
          }
        />
      </Submenu>
      <Submenu
        icon={<IssuePriorityIcon priority={issue.priority} />}
        label="Priority"
        value={issuePriorityLabels[issue.priority]}
        contentClassName="w-48"
      >
        <IssuePriorityOptions
          current={issue.priority}
          onPick={(priority) =>
            patch({ priority }, "Could not change the priority")
          }
        />
      </Submenu>
      {actors === undefined ? null : (
        <Submenu
          icon={
            issue.assignee === null ? (
              <Icon name="user" />
            ) : (
              <ActorAvatar
                name={issue.assignee.name}
                avatarUrl={issue.assignee.avatarUrl}
              />
            )
          }
          label="Assignee"
          value={issue.assignee?.name}
          contentClassName="w-56"
        >
          <MenuItem
            onClick={() =>
              patch({ assignee: null }, "Could not change the assignee")
            }
          >
            <span className={menuIconSlot}>
              <Icon name="user" />
            </span>
            No assignee
          </MenuItem>
          {[
            ...actors.people.map((actor) => ({ actor, kind: "user" as const })),
            ...actors.captains.map((actor) => ({
              actor,
              kind: "jam" as const,
            })),
          ].map(({ actor, kind }) => (
            <MenuItem
              key={actor.id}
              onClick={() =>
                patch(
                  { assignee: { kind, id: actor.id } },
                  "Could not change the assignee",
                )
              }
            >
              <span className={menuIconSlot}>{actor.icon}</span>
              <span className="min-w-0 truncate">{actor.label}</span>
              {issue.assignee?.id === actor.id ? (
                <span className={menuValue}>
                  <CheckmarkGlyph className="size-(--icon-sm) shrink-0" />
                </span>
              ) : null}
            </MenuItem>
          ))}
        </Submenu>
      )}
      <Submenu
        icon={<Icon name="ticket" />}
        label="Labels"
        value={
          labels.length === 0 ? undefined : (
            <span className="flex items-center gap-1">
              {labels.slice(0, 3).map((label) => (
                <IssueLabelDot key={label.id} color={label.color} />
              ))}
              {labels.length}
            </span>
          )
        }
        contentClassName="w-60"
      >
        <IssueLabelOptions
          orgId={orgId}
          selected={labels.map((label) => label.id)}
          onChange={(labelIds) =>
            patch(
              { labelIds: labelIds as UpdateIssueRequest["labelIds"] },
              "Could not change the labels",
            )
          }
        />
      </Submenu>
      <MenuSeparator />
      <MenuItem
        disabled={orgId === undefined}
        onClick={() => {
          if (orgId === undefined) return;
          const request = {
            params: { orgId, code: issue.code },
            reactivityKeys: issueMenuKeys(orgId, issue.code),
          };
          (marksRead ? markSeen(request) : markUnread(request)).catch(() =>
            toast.error(
              marksRead ? "Could not mark as read" : "Could not mark as unread",
            ),
          );
        }}
      >
        <span className={menuIconSlot}>
          <Icon name={marksRead ? "email-2" : "email-1"} />
        </span>
        {marksRead ? "Mark as read" : "Mark as unread"}
      </MenuItem>
      <MenuItem
        disabled={orgId === undefined}
        onClick={() => {
          if (orgId === undefined) return;
          subscribe({
            params: { orgId, code: issue.code },
            payload: { subscribed: !subscribed },
            reactivityKeys: issueMenuKeys(orgId, issue.code),
          }).catch(() =>
            toast.error(
              subscribed ? "Could not unsubscribe" : "Could not subscribe",
            ),
          );
        }}
      >
        <span className={menuIconSlot}>
          <Icon name={subscribed ? "user-remove" : "people-add"} />
        </span>
        {subscribed ? "Unsubscribe" : "Subscribe"}
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        onClick={() =>
          copy(
            `${window.location.origin}/issues/${issue.code}`,
            "Link copied",
            "Could not copy link",
          )
        }
      >
        <span className={menuIconSlot}>
          <Icon name="chain-link-2" />
        </span>
        Copy link
      </MenuItem>
      <MenuItem
        onClick={() => copy(issue.code, "Code copied", "Could not copy code")}
      >
        <span className={menuIconSlot}>
          <Icon name="note-text" />
        </span>
        Copy code
      </MenuItem>
    </>
  );
}
