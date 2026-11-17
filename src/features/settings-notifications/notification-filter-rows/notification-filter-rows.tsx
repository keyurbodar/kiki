import type { ReactNode } from "react";
import { CapyMark } from "@/components/capy-logo";
import { Icon } from "@/primitives/icon";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  CodeIcon,
  GlobeIcon,
  LinearIcon,
  MergedIcon,
  RepeatIcon,
  SlackIcon,
} from "./icons";
import {
  type CompletionKind,
  completionKindLabels,
  type NotificationOrigin,
  notificationOriginLabels,
  notificationOrigins,
} from "./notification-kinds";

const kindIcons: Record<CompletionKind, ReactNode> = {
  mention: <Icon name="at" />,
  error: <Icon name="circle-x" className="text-destructive" />,
  pr_merged: <MergedIcon className="text-complete" />,
};

const originIcons: Record<NotificationOrigin, ReactNode> = {
  web: <GlobeIcon />,
  api: <CodeIcon />,
  slack: <SlackIcon />,
  linear: <LinearIcon />,
  github: <Icon name="github" />,
  capy: <CapyMark className="h-full" />,
  automation: <RepeatIcon />,
};

export type CompletionRowsProps<K extends CompletionKind> = {
  kinds: readonly K[];
  rowId: (kind: K) => string;
  checked: (kind: K) => boolean;
  disabled?: boolean;
  onChange: (kind: K, checked: boolean) => void;
  ariaPrefix: string;
};

export function CompletionRows<K extends CompletionKind>({
  kinds,
  rowId,
  checked,
  disabled,
  onChange,
  ariaPrefix,
}: CompletionRowsProps<K>) {
  return kinds.map((kind) => (
    <SettingsRow
      key={kind}
      id={rowId(kind)}
      icon={kindIcons[kind]}
      label={completionKindLabels[kind]}
    >
      <Switch
        checked={checked(kind)}
        disabled={disabled}
        onCheckedChange={(next) => onChange(kind, next)}
        aria-label={`${ariaPrefix} ${completionKindLabels[kind].toLowerCase()}`}
      />
    </SettingsRow>
  ));
}

export type OriginRowsProps = {
  checked: (origin: NotificationOrigin) => boolean;
  disabled?: boolean;
  onChange: (origin: NotificationOrigin, checked: boolean) => void;
  ariaPrefix: string;
};

export function OriginRows({
  checked,
  disabled,
  onChange,
  ariaPrefix,
}: OriginRowsProps) {
  return notificationOrigins.map((origin) => (
    <SettingsRow
      key={origin}
      icon={
        <span className="flex size-4 items-center justify-center">
          {originIcons[origin]}
        </span>
      }
      label={notificationOriginLabels[origin]}
    >
      <Switch
        checked={checked(origin)}
        disabled={disabled}
        onCheckedChange={(next) => onChange(origin, next)}
        aria-label={`${ariaPrefix} threads from ${notificationOriginLabels[origin]}`}
      />
    </SettingsRow>
  ));
}
