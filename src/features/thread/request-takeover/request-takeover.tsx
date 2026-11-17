import type { ReactNode } from "react";
import { TakeoverCard } from "@/features/thread/takeover-card";
import { Button } from "@/primitives/button";

export type RequestTakeoverViewProps = {
  label: ReactNode;
  icon?: ReactNode;
  heading: ReactNode;
  reason?: ReactNode;
  status?: ReactNode;
  actions: ReactNode;
  onLater: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
};

export function RequestTakeoverView({
  label,
  icon,
  heading,
  reason,
  status,
  actions,
  onLater,
  onDismiss,
  children,
}: RequestTakeoverViewProps) {
  return (
    <TakeoverCard
      slot="request-takeover"
      label={label}
      trailing={
        status === undefined ? undefined : (
          <span className="text-xs text-muted-foreground-2">{status}</span>
        )
      }
      footer={
        <>
          <span className="flex items-center gap-2">
            <Button variant="outline" size="xs" onClick={onLater}>
              Later
            </Button>
            {onDismiss === undefined ? null : (
              <Button variant="ghost" size="xs" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </span>
          <span className="flex flex-wrap items-center justify-end gap-2">
            {actions}
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <span className="text-sm font-medium text-balance break-words text-foreground">
            {heading}
          </span>
        </div>
        {reason === undefined ? null : (
          <span className="text-sm text-pretty break-words whitespace-pre-line text-muted-foreground-1">
            {reason}
          </span>
        )}
        {children}
      </div>
    </TakeoverCard>
  );
}

export const RequestTakeover = RequestTakeoverView;
export type RequestTakeoverProps = RequestTakeoverViewProps;

export function RequestViewport({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-(--request-viewport-h) flex-col overflow-hidden rounded-(--radius-control) border-hairline border-border-2 bg-panel max-md:h-(--request-viewport-h-touch)">
      {children}
    </div>
  );
}
