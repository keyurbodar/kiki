import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  githubOriginLink,
  listLabel,
  type McpAvailability,
  type McpPluginOrigin,
  type McpPluginState,
  type McpSetupBusy,
  pluginStatus,
  pluginStatusLabel,
  serverCountLabel,
} from "./helpers";
import { AvailabilityValue, DETAIL_LIST, DetailRow, SetupCard } from "./parts";

export type McpPluginSetupProps = {
  name: string;
  reason: string;
  icon: ReactNode;
  origin: McpPluginOrigin;
  state: McpPluginState;
  availableTo: McpAvailability;
  servers?: readonly { displayName: string }[];
  skills?: readonly { name: string }[];
  status?: string;
  statusNeedsAttention?: boolean;
  needsConnection?: boolean;
  newerVersion?: string;
  reviewBlocked?: string;
  fetchesOnReview?: boolean;
  busy?: Exclude<McpSetupBusy, "retry">;
  error?: string;
  onReview?: () => void;
  onDecline?: () => void;
  onView?: () => void;
  onConnect?: () => void;
};

function Contents({
  servers,
  skills,
}: Pick<McpPluginSetupProps, "servers" | "skills">) {
  if (servers === undefined || skills === undefined)
    return (
      <div className="py-2.5 text-sm text-muted-foreground-1">
        Tools and skills are listed when you review
      </div>
    );
  return (
    <>
      <DetailRow label="Tools">
        <span className="truncate">
          {servers.length === 0
            ? "No MCP servers"
            : `${serverCountLabel(servers.length)}: ${listLabel(servers.map((server) => server.displayName))}`}
        </span>
      </DetailRow>
      <DetailRow label="Skills">
        <span className="truncate">
          {skills.length === 0
            ? "No skills"
            : `${skills.length} ${skills.length === 1 ? "skill" : "skills"}: ${listLabel(skills.map((skill) => skill.name))}`}
        </span>
      </DetailRow>
    </>
  );
}

function Footer(props: McpPluginSetupProps) {
  const { state, busy } = props;
  if (state === "pending")
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          aria-busy={busy === "decline" || undefined}
          aria-label={busy === "decline" ? "Declining" : undefined}
          disabled={busy !== undefined || props.onDecline === undefined}
          onClick={props.onDecline}
        >
          Decline
        </Button>
        <Button
          size="sm"
          intent="accent"
          aria-busy={busy === "review" || undefined}
          aria-label={
            busy !== "review"
              ? undefined
              : props.fetchesOnReview === true
                ? "Fetching"
                : "Opening"
          }
          disabled={
            busy !== undefined ||
            props.onReview === undefined ||
            props.reviewBlocked !== undefined
          }
          title={props.reviewBlocked}
          onClick={props.onReview}
        >
          Review and add
        </Button>
      </>
    );
  const view = (
    <Button
      size="sm"
      variant="ghost"
      disabled={props.onView === undefined}
      onClick={props.onView}
    >
      {state === "added" ? "View plugin" : "View MCP & plugins"}
    </Button>
  );
  if (state !== "added" || props.needsConnection !== true) return view;
  return (
    <>
      {view}
      <Button
        size="sm"
        intent="accent"
        disabled={props.onConnect === undefined}
        onClick={props.onConnect}
      >
        Connect
      </Button>
    </>
  );
}

export function OriginLine({
  origin,
  status,
}: {
  origin: McpPluginOrigin;
  status?: string;
}) {
  const suffix = status !== undefined && ` · ${status}`;
  if (origin.kind === "marketplace")
    return (
      <span>
        Plugin from the marketplace
        {origin.version === undefined ? "" : ` · ${origin.version}`}
        {origin.verified && (
          <>
            {" "}
            ·{" "}
            <span className="whitespace-nowrap">
              <Icon
                name="check-circle-2"
                className="inline size-(--icon-sm) align-[-0.125rem] text-muted-foreground-2"
              />{" "}
              Verified by Capy
            </span>
          </>
        )}
        {suffix}
      </span>
    );
  const link = githubOriginLink(origin);
  return (
    <span>
      From{" "}
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        title={link.title}
        className="text-foreground underline-offset-2 hover:underline"
      >
        {origin.repository}
      </a>
      {suffix}
    </span>
  );
}

export function McpPluginSetup(props: McpPluginSetupProps) {
  const { state } = props;
  const closed = state === "declined" || state === "expired";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-5 text-foreground">{props.reason}</p>
      <SetupCard
        status={pluginStatus(props)}
        icon={props.icon}
        title={props.name}
        description={
          <OriginLine origin={props.origin} status={pluginStatusLabel(props)} />
        }
        action={closed ? undefined : <Footer {...props} />}
      >
        {!closed && (
          <div className={DETAIL_LIST}>
            {state !== "private" && (
              <Contents servers={props.servers} skills={props.skills} />
            )}
            <DetailRow label="Available to">
              <AvailabilityValue availability={props.availableTo} />
            </DetailRow>
            {state === "pending" && props.newerVersion !== undefined && (
              <DetailRow label="Version">
                A newer version, {props.newerVersion}, was published; you review
                that one
              </DetailRow>
            )}
            {state === "pending" && props.reviewBlocked !== undefined && (
              <DetailRow label="Review">{props.reviewBlocked}</DetailRow>
            )}
          </div>
        )}
        {props.error !== undefined && (
          <div role="alert" className="text-sm text-destructive">
            {props.error}
          </div>
        )}
      </SetupCard>
    </div>
  );
}
