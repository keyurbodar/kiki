import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowCornerUpLeft,
  ArrowRotateClockwise,
  ArrowShareRight,
  Bell,
  BellOff,
  Bubble,
  CircleX,
  DotsHorizontal,
  Globe,
  Group,
  IssueActorAvatar,
  issueActorName,
  issueMenuIcon,
  Lock,
  SquareBehindSquare,
} from "@/components/issue-parts";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssueDetail,
  IssueState,
  IssueVisibility,
} from "@/data/api/schemas/issue";
import { setIssueSubscriptionAtom } from "@/data/atoms/issues";
import { useIssueStates } from "@/features/issues/issue-pickers";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { IssueStatusGlyph } from "./property-rows";
import {
  type IssueActions,
  issueKeys,
  useIssueActions,
  useIssueDetail,
} from "./use-issue";

/** The state a close or reopen moves an issue to: the default of that type. */
export const issueStateOfType = (
  states: ReadonlyArray<IssueState>,
  type: IssueState["type"],
) => {
  const ofType = states.filter((state) => state.type === type);
  return ofType.find((state) => state.isDefault) ?? ofType[0];
};

const copy = (text: string, success: string, failure: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast.success(success),
    () => toast.error(failure),
  );

/** "…": close or reopen, subscribe, copy link and code (Capy's IssueMenu). */
export function IssueMenu({
  orgId,
  detail,
  actions,
}: {
  orgId: OrgId | undefined;
  detail: IssueDetail;
  actions: IssueActions | undefined;
}) {
  const issue = detail.issue;
  const states = useIssueStates(orgId);
  const current = states.find((state) => state.id === issue.stateId);
  const closed = current?.type === "closed";
  const target = issueStateOfType(states, closed ? "open" : "closed");
  const subscribed = issue.viewer.subscribed;
  const subscribe = useAtomSet(setIssueSubscriptionAtom, { mode: "promise" });
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Issue actions" />
        }
      >
        <DotsHorizontal />
      </MenuTrigger>
      <MenuContent align="end" className="w-48">
        <MenuItem
          disabled={actions === undefined || target === undefined}
          onClick={() =>
            target !== undefined &&
            void actions?.update(
              { stateId: target.id },
              closed
                ? "Could not reopen the issue"
                : "Could not close the issue",
            )
          }
        >
          <span className={issueMenuIcon}>
            {closed ? <ArrowRotateClockwise /> : <CircleX />}
          </span>
          {closed ? "Reopen" : "Close issue"}
        </MenuItem>
        <MenuItem
          disabled={orgId === undefined}
          onClick={() =>
            orgId !== undefined &&
            void subscribe({
              params: { orgId, code: issue.code },
              payload: { subscribed: !subscribed },
              reactivityKeys: issueKeys(orgId, issue.code),
            }).catch(() =>
              toast.error(
                subscribed ? "Could not unsubscribe" : "Could not subscribe",
              ),
            )
          }
        >
          <span className={issueMenuIcon}>
            {subscribed ? <BellOff /> : <Bell />}
          </span>
          {subscribed ? "Unsubscribe" : "Subscribe"}
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={() =>
            void copy(
              `${window.location.origin}/issues/${issue.code}`,
              "Link copied",
              "Could not copy link",
            )
          }
        >
          <span className={issueMenuIcon}>
            <ArrowShareRight />
          </span>
          Copy link
        </MenuItem>
        <MenuItem
          onClick={() =>
            void copy(issue.code, "Code copied", "Could not copy code")
          }
        >
          <span className={issueMenuIcon}>
            <SquareBehindSquare />
          </span>
          Copy code
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/** Who can see the issue (Capy's AccessMenu). */
export function AccessMenu({
  detail,
  actions,
  projectName,
}: {
  detail: IssueDetail;
  actions: IssueActions | undefined;
  projectName?: string;
}) {
  const navigate = useNavigate();
  const issue = detail.issue;
  const access = detail.access;
  const everyone =
    projectName === undefined
      ? "Everyone in the project"
      : `Everyone in ${projectName}`;
  const label =
    issue.visibility === "private" ? "Only specific people" : everyone;
  const choice = (
    visibility: IssueVisibility,
    icon: ReactNode,
    text: string,
  ) => (
    <MenuItem
      disabled={!access.editable || actions === undefined}
      onClick={() =>
        visibility !== issue.visibility &&
        void actions?.update(
          { visibility },
          "Could not change who can see the issue",
        )
      }
    >
      <span className={issueMenuIcon}>{icon}</span>
      {text}
      {visibility === issue.visibility && (
        <span
          aria-hidden
          className={cx("ml-auto", "shrink-0 text-sm text-foreground")}
        >
          ✓
        </span>
      )}
    </MenuItem>
  );
  return (
    <Menu>
      <Tooltip>
        <TooltipTrigger
          render={
            <MenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={label} />
              }
            />
          }
        >
          {issue.visibility === "private" ? <Lock /> : <Group />}
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-64">
        {choice("org", <Globe />, everyone)}
        {choice("private", <Lock />, "Only specific people")}
        {access.people.length > 0 && (
          <>
            <MenuSeparator />
            <MenuLabel>People with access</MenuLabel>
            <ul className="flex flex-col">
              {access.people.map((person) => (
                <li
                  key={person.id}
                  className="flex h-(--h-menu-row) items-center gap-2 px-2 text-sm text-foreground"
                >
                  <IssueActorAvatar actor={person} />
                  <span className="min-w-0 flex-1 truncate">
                    {issueActorName(person)}
                  </span>
                  {person.id === detail.creator?.id && (
                    <span className="text-xs text-muted-foreground-2">
                      Owner
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        {detail.parent !== null ? (
          <>
            <MenuSeparator />
            <MenuItem
              onClick={() =>
                void navigate({
                  to: "/issues/$code",
                  params: { code: detail.parent?.code ?? issue.code },
                })
              }
            >
              <span className={issueMenuIcon}>
                <ArrowCornerUpLeft />
              </span>
              Follows its parent {detail.parent.code}
            </MenuItem>
          </>
        ) : access.source !== null ? (
          <>
            <MenuSeparator />
            <MenuItem
              onClick={() =>
                access.source !== null &&
                void navigate({
                  to: "/thread/$threadId",
                  params: { threadId: access.source.id },
                })
              }
            >
              <span className={issueMenuIcon}>
                <Bubble />
              </span>
              <span className="min-w-0 truncate">
                Follows who can read{" "}
                {access.source.captain
                  ? access.source.name
                  : (access.source.code ?? access.source.name)}
              </span>
            </MenuItem>
          </>
        ) : access.editable ? null : (
          <MenuLabel>Only the person who created it can change this</MenuLabel>
        )}
      </MenuContent>
    </Menu>
  );
}

function HeaderMenus({ orgId, detail }: { orgId: OrgId; detail: IssueDetail }) {
  const actions = useIssueActions(detail, orgId);
  return (
    <>
      <AccessMenu detail={detail} actions={actions} />
      <IssueMenu orgId={orgId} detail={detail} actions={actions} />
    </>
  );
}

/**
 * The bar above an issue: the identity (in panels) and the access and "…"
 * menus (Capy's IssueViewHeader).
 */
export function IssueViewHeader({
  code,
  identity = false,
  trailing,
}: {
  code: string;
  identity?: boolean;
  trailing?: ReactNode;
}) {
  const { orgId, detail } = useIssueDetail(code);
  return (
    <div
      data-slot="issue-view-header"
      className={cx(
        "flex min-h-11 shrink-0 items-center",
        identity
          ? "gap-1 border-b-hairline border-border-1 px-2"
          : "gap-1.5 px-3",
      )}
    >
      {identity && detail !== undefined ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 pl-1">
          <IssueStatusGlyph orgId={orgId} issue={detail.issue} />
          <span className="shrink-0 text-sm text-muted-foreground-2 tabular-nums">
            {detail.issue.code}
          </span>
          <span
            className="min-w-0 truncate text-sm font-medium text-foreground"
            title={detail.issue.title}
          >
            {detail.issue.title}
          </span>
        </span>
      ) : (
        <span className="min-w-0 flex-1" />
      )}
      {detail !== undefined && orgId !== undefined && (
        <HeaderMenus orgId={orgId} detail={detail} />
      )}
      {trailing}
    </div>
  );
}
