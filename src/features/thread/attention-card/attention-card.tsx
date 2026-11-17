import type { ComponentProps, ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/primitives/card";
import { Icon } from "@/primitives/icon";

export type AttentionCardStatus = "pending" | "done" | "skipped";

const STATUS_BADGE: Record<
  Exclude<AttentionCardStatus, "pending">,
  ReactNode
> = {
  done: (
    <Icon name="check-circle-2" className="size-(--icon-sm) text-success" />
  ),
  skipped: (
    <Icon
      name="circle-x"
      className="size-(--icon-sm) text-muted-foreground-3"
    />
  ),
};

export type AttentionCardIconProps = {
  status: AttentionCardStatus;
  children?: ReactNode;
};

export function AttentionCardIcon({
  status,
  children,
}: AttentionCardIconProps) {
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

export type AttentionCardProps = Omit<ComponentProps<"div">, "title"> & {
  status?: AttentionCardStatus;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function AttentionCard({
  status = "pending",
  icon,
  title,
  description,
  action,
  children,
  ...props
}: AttentionCardProps) {
  return (
    <Card data-slot="attention-card" data-status={status} {...props}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex gap-3">
          <AttentionCardIcon status={status}>{icon}</AttentionCardIcon>
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
