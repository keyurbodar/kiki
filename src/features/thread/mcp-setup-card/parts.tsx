import type { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  availabilityLabel,
  type McpAvailability,
  type McpSetupStatus,
  secretLabel,
  secretValueLabel,
} from "./helpers";
import type { McpSecrets } from "./proposal";

const STATUS_BADGE = {
  done: <Icon name="circle-check" className="size-(--icon-sm) text-success" />,
  skipped: (
    <Icon
      name="circle-x"
      className="size-(--icon-sm) text-muted-foreground-3"
    />
  ),
};

export function SetupStatusIcon({
  status,
  children,
}: {
  status: McpSetupStatus;
  children: ReactNode;
}) {
  return (
    <div className="relative grid size-8 shrink-0 place-items-center overflow-visible rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-4">
      {children}
      {status !== "pending" && (
        <span className="absolute -right-1 -bottom-1 grid size-(--icon-base) place-items-center rounded-full bg-card">
          {STATUS_BADGE[status]}
        </span>
      )}
    </div>
  );
}

export function SetupCard({
  status,
  icon,
  title,
  description,
  action,
  children,
  className,
}: {
  status: McpSetupStatus;
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card data-slot="attention-card" data-status={status} className={className}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex gap-3">
          <SetupStatusIcon status={status}>{icon}</SetupStatusIcon>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm leading-4 font-medium text-foreground">
              {title}
            </span>
            {description !== undefined && (
              <span className="text-sm font-normal text-muted-foreground-1">
                {description}
              </span>
            )}
          </div>
        </div>
        {children}
      </CardContent>
      {action !== undefined && (
        <CardFooter className="flex-wrap">{action}</CardFooter>
      )}
    </Card>
  );
}

export const DETAIL_LIST =
  "divide-y-hairline divide-border-1 border-t-hairline border-border-1 [&>:last-child]:pb-0";

export function DetailRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground-1">
        {children}
      </span>
    </div>
  );
}

export function AvailabilityValue({
  availability,
}: {
  availability: McpAvailability;
}) {
  return (
    <span className="min-w-0 truncate">{availabilityLabel(availability)}</span>
  );
}

export function FromTo({ from, to }: { from: string; to: string }) {
  return (
    <>
      <span className="truncate">{from}</span>
      <span className="truncate text-foreground">{to}</span>
    </>
  );
}

export function SecretRows({ secrets }: { secrets: McpSecrets }) {
  return Object.entries(secrets).map(([key, secret]) => (
    <DetailRow key={key} label={secretLabel(key)}>
      <span
        className="truncate text-xs"
        title={
          secret.kind === "visible"
            ? "The model wrote this value; it is shown in full"
            : undefined
        }
      >
        {secretValueLabel(secret)}
      </span>
    </DetailRow>
  ));
}

export function ServerTile({ iconDataUri }: { iconDataUri?: string }) {
  return (
    <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-foreground [&_svg]:size-(--icon-base)">
      {iconDataUri === undefined ? (
        <Icon name="plugin-1" />
      ) : (
        <img src={iconDataUri} alt="" className="size-full object-cover" />
      )}
    </div>
  );
}
