import { Markdown } from "@/components/markdown/markdown";
import { LoadingButton } from "@/lib/loading-button";
import { Kbd } from "@/primitives/kbd";
import { TakeoverPanel } from "./takeover-panel";

export type TakeoverBusy = "grant" | "always" | "deny";

export type AllowButtonProps = {
  label: string;
  busy?: TakeoverBusy;
  onGrant?: () => void;
  shortcut?: string | null;
};

export function AllowButton({
  label,
  busy,
  onGrant,
  shortcut = null,
}: AllowButtonProps) {
  const enabled = busy === undefined && onGrant !== undefined;
  return (
    <LoadingButton
      size="xs"
      intent="accent"
      loading={busy === "grant"}
      loadingLabel="Allowing"
      disabled={!enabled}
      aria-keyshortcuts={shortcut ?? undefined}
      onClick={onGrant}
    >
      {label}
      {shortcut !== null && <Kbd variant="onFill">{shortcut}</Kbd>}
    </LoadingButton>
  );
}

export type DeviceAccessOwnerTakeoverViewProps = {
  member: string;
  deviceName: string;
  text: string;
  fileCount: number;
  grantLabel?: string;
  busy?: TakeoverBusy;
  onGrant?: () => void;
  onDeny?: () => void;
  onDismiss?: () => void;
};

export const attachmentCount = (count: number) =>
  count === 1 ? "1 attachment" : `${count} attachments`;

export function DeviceAccessOwnerTakeoverView({
  member,
  deviceName,
  text,
  fileCount,
  grantLabel,
  busy,
  onGrant,
  onDeny,
  onDismiss,
}: DeviceAccessOwnerTakeoverViewProps) {
  return (
    <TakeoverPanel
      slot="device-access-takeover"
      label="Access request"
      footer={
        <>
          <span>
            {onDismiss !== undefined && (
              <LoadingButton
                variant="outline"
                size="xs"
                disabled={busy !== undefined}
                onClick={onDismiss}
              >
                Later
              </LoadingButton>
            )}
          </span>
          <span className="flex items-center gap-2">
            {onDeny !== undefined && (
              <LoadingButton
                variant="ghost"
                size="xs"
                loading={busy === "deny"}
                loadingLabel="Denying"
                disabled={busy !== undefined}
                onClick={onDeny}
              >
                Deny
              </LoadingButton>
            )}
            <AllowButton
              label={grantLabel ?? "Allow"}
              busy={busy}
              onGrant={onGrant}
            />
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-balance text-foreground">
          {member} wants to message this thread on {deviceName}
        </span>
        <Markdown text={text} variant="inline" size="sm" tone="muted" />
        {fileCount > 0 && (
          <span className="text-xs text-muted-foreground-2">
            {attachmentCount(fileCount)}
          </span>
        )}
      </div>
    </TakeoverPanel>
  );
}

export type PermissionCall = {
  label: string;
  toolName: string;
  detail: string;
};

export type PermissionRequestTakeoverViewProps = {
  heading: string;
  note?: string;
  call?: PermissionCall;
  lines?: ReadonlyArray<string>;
  busy?: TakeoverBusy;
  onGrant?: () => void;
  onAlways?: () => void;
  onDeny?: () => void;
  onDismiss?: () => void;
};

export function PermissionRequestTakeoverView({
  heading,
  note,
  call,
  lines,
  busy,
  onGrant,
  onAlways,
  onDeny,
  onDismiss,
}: PermissionRequestTakeoverViewProps) {
  return (
    <TakeoverPanel
      slot="device-access-takeover"
      label="Permission request"
      footer={
        <>
          <span>
            {onDismiss !== undefined && (
              <LoadingButton
                variant="outline"
                size="xs"
                disabled={busy !== undefined}
                onClick={onDismiss}
              >
                Later
              </LoadingButton>
            )}
          </span>
          <span className="flex items-center gap-2">
            {onDeny !== undefined && (
              <LoadingButton
                variant="ghost"
                size="xs"
                loading={busy === "deny"}
                loadingLabel="Denying"
                disabled={busy !== undefined}
                onClick={onDeny}
              >
                Deny
              </LoadingButton>
            )}
            {onAlways !== undefined && (
              <LoadingButton
                variant="outline"
                size="xs"
                loading={busy === "always"}
                loadingLabel="Allowing"
                disabled={busy !== undefined}
                onClick={onAlways}
              >
                Always allow
              </LoadingButton>
            )}
            <AllowButton label="Allow" busy={busy} onGrant={onGrant} />
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-balance text-foreground">
          {heading}
        </span>
        {call !== undefined && (
          <div className="flex flex-col gap-1 rounded-(--radius-control) bg-section px-3 py-2">
            <span className="truncate text-sm text-foreground">
              {call.label}
            </span>
            <span className="truncate text-xs text-muted-foreground-2">
              {call.toolName} · {call.detail}
            </span>
          </div>
        )}
        {lines?.map((line) => (
          <span
            key={line}
            className="text-sm text-pretty text-muted-foreground-1"
          >
            {line}
          </span>
        ))}
        {note !== undefined && (
          <span className="text-xs text-muted-foreground-2">{note}</span>
        )}
      </div>
    </TakeoverPanel>
  );
}

export type DevicePermissionTakeoverViewProps = Omit<
  PermissionRequestTakeoverViewProps,
  "heading" | "call"
> & {
  capability: "execution" | "computer_use";
  deviceName: string;
  toolName: string;
  callLabel: string;
  callDetail: string;
};

export const devicePermissionHeading = (
  capability: "execution" | "computer_use",
  deviceName: string,
) =>
  capability === "execution"
    ? `Capy wants to use ${deviceName}`
    : `Capy wants to control applications on ${deviceName}`;

export function DevicePermissionTakeoverView({
  capability,
  deviceName,
  toolName,
  callLabel,
  callDetail,
  ...rest
}: DevicePermissionTakeoverViewProps) {
  return (
    <PermissionRequestTakeoverView
      heading={devicePermissionHeading(capability, deviceName)}
      call={{ toolName, label: callLabel, detail: callDetail }}
      {...rest}
    />
  );
}

export const SLACK_READ_HEADING =
  "Let Capy read Slack on your behalf in this thread?";
export const SLACK_READ_LINES = [
  "Read-only, with your Slack access: any channel, DM, or group DM you can see",
];

export type DeviceAccessRequesterTakeoverViewProps = {
  owner: string;
  deviceName: string;
  text: string;
  busy?: boolean;
  onWithdraw?: () => void;
};

export function DeviceAccessRequesterTakeoverView({
  owner,
  deviceName,
  text,
  busy = false,
  onWithdraw,
}: DeviceAccessRequesterTakeoverViewProps) {
  return (
    <TakeoverPanel
      slot="device-access-takeover"
      label="Access request"
      footer={
        <>
          <span />
          <LoadingButton
            size="xs"
            loading={busy}
            loadingLabel="Withdrawing"
            disabled={busy || onWithdraw === undefined}
            onClick={onWithdraw}
          >
            Withdraw
          </LoadingButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-balance text-foreground">
          Waiting for {owner} to allow this on {deviceName}
        </span>
        <Markdown text={text} variant="inline" size="sm" tone="muted" />
      </div>
    </TakeoverPanel>
  );
}
