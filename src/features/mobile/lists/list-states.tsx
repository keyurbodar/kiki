import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

const skeletonRows = [
  "w-2/5",
  "w-1/3",
  "w-1/2",
  "w-1/4",
  "w-2/5",
  "w-1/3",
] as const;

/** Row placeholders while a mobile list waits on its first page. */
export function MobileListLoading({ label }: { label: string }) {
  return (
    <div
      data-slot="skeleton-panel"
      role="status"
      aria-label={label}
      aria-busy="true"
      className="flex flex-col gap-1 px-2 pt-1"
    >
      {skeletonRows.map((width, index) => (
        <div
          key={width}
          className="flex h-11 items-center gap-2 rounded px-2"
          data-row={index}
        >
          <span className="size-(--icon-base) shrink-0 rounded-(--radius-sm) bg-secondary" />
          <span className={`h-3 rounded bg-secondary ${width}`} />
        </div>
      ))}
    </div>
  );
}

export type MobileListEmptyProps = {
  line: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
};

/** Capy's centred empty state, as plugin-browse and drive draw it. */
export function MobileListEmpty({
  line,
  sub,
  action,
  children,
}: MobileListEmptyProps) {
  return (
    <div
      data-slot="mobile-list-empty"
      className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center"
    >
      <span className="flex size-(--icon-lg) items-center justify-center rounded-full bg-section text-icon-muted">
        <Icon name="inbox-empty" />
      </span>
      <p className="text-sm font-medium text-foreground">{line}</p>
      {sub === undefined ? null : (
        <p className="text-sm font-normal text-muted-foreground-2">{sub}</p>
      )}
      {action === undefined ? null : (
        <Button variant="outline" size="auto-sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
