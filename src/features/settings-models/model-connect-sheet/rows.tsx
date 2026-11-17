import { Badge } from "@/primitives/badge";
import { Card, CardFooter } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import type { DaybreakAccess, MediaState } from "../model-routing/types.ts";
import {
  type NoticeFeature,
  relativeTime,
  shortDate,
  wireMessage,
} from "./helpers.ts";
import { LoadingButton } from "./ui.tsx";

export type WireNoticeProps = {
  rejections: ReadonlyArray<{ feature: NoticeFeature }>;
  checkedAt: Date;
  checking: boolean;
  onCheckAgain: () => void;
};

export function WireNotice({
  rejections,
  checkedAt,
  checking,
  onCheckAgain,
}: WireNoticeProps) {
  return (
    <CardFooter className="justify-between gap-3">
      <span className="min-w-0 text-xs font-normal text-muted-foreground-2">
        {`${wireMessage(rejections.map((r) => r.feature))} · ${shortDate(checkedAt)}`}
      </span>
      <LoadingButton
        variant="ghost"
        size="sm"
        loading={checking}
        onClick={onCheckAgain}
      >
        Check again
      </LoadingButton>
    </CardFooter>
  );
}

export type WebSocketRowProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function WebSocketRow({ checked, onCheckedChange }: WebSocketRowProps) {
  return (
    <Card className="mt-2 px-3 py-1">
      <div className="flex items-center gap-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm">WebSocket transport</span>
          <span className="text-xs font-normal text-muted-foreground-2">
            One connection per turn instead of a request per step; only for
            endpoints that accept the upgrade
          </span>
        </div>
        <Switch
          checked={checked}
          disabled={onCheckedChange === undefined}
          aria-label="WebSocket transport"
          onCheckedChange={(next) => onCheckedChange?.(next)}
        />
      </div>
    </Card>
  );
}

export type MediaDeliveryRowsProps = {
  media: MediaState;
  failure?: string;
  checking: boolean;
  disabled: boolean;
  onCheck: () => void;
};

export function MediaDeliveryRows({
  media,
  failure,
  checking,
  disabled,
  onCheck,
}: MediaDeliveryRowsProps) {
  const url = media.state === "yes";
  const detail = failure ?? (media.state === "no" ? media.outcome : undefined);
  return (
    <Card rows className="mt-2">
      <SettingsRow
        label="Image delivery"
        description={
          <>
            {media.checkedAt === undefined
              ? "Not checked yet"
              : `Checked ${relativeTime(media.checkedAt)}`}
            {detail === undefined ? null : (
              <span className="block pt-0.5 text-xs font-normal break-words text-muted-foreground-2">
                {detail}
              </span>
            )}
          </>
        }
      >
        <LoadingButton
          variant="ghost"
          size="sm"
          loading={checking}
          disabled={disabled}
          onClick={onCheck}
        >
          {media.checkedAt === undefined ? "Check" : "Check again"}
        </LoadingButton>
      </SettingsRow>
      <SettingsRow
        label="URL"
        description="Fetched from a signed link, smaller requests that cache across turns"
      >
        {url ? (
          <Badge color="success" size="sm">
            In use
          </Badge>
        ) : null}
      </SettingsRow>
      <SettingsRow
        label="Base64"
        description="Sent inside each request, larger but works through any gateway"
      >
        {url ? null : <Badge size="sm">In use</Badge>}
      </SettingsRow>
    </Card>
  );
}

export type DaybreakAccessRowProps = {
  access: DaybreakAccess;
  failure?: string;
  refreshing: boolean;
  disabled: boolean;
  onRefresh: () => void;
};

export function DaybreakAccessRow({
  access,
  failure,
  refreshing,
  disabled,
  onRefresh,
}: DaybreakAccessRowProps) {
  return (
    <Card rows className="mt-2">
      <SettingsRow
        label="Daybreak access"
        description={
          <>
            {access.granted.length === 0
              ? "No Daybreak access on this key"
              : `Granted for ${access.granted.join(", ")}`}
            <span className="block pt-0.5 text-xs font-normal break-words text-muted-foreground-2">
              {failure ??
                "Checked when the key is connected, changed or tested"}
            </span>
          </>
        }
      >
        <LoadingButton
          variant="ghost"
          size="sm"
          loading={refreshing}
          disabled={disabled}
          onClick={onRefresh}
        >
          Refresh access
        </LoadingButton>
      </SettingsRow>
    </Card>
  );
}
