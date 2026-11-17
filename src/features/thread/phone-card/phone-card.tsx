import { PhoneCardRow as PhoneCardRowSchema } from "@/data/events";
import type { Schema } from "effect";

import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

type PhoneCardRowData = Schema.Schema.Type<typeof PhoneCardRowSchema>;

export type PhoneCardProps = {
  row: PhoneCardRowData;
  onOpen?: (machineId: string) => void;
  className?: string;
};

/** The paired-phone summary row Capy shows after a phone joins a thread. */
export function PhoneCard({ row, onOpen, className }: PhoneCardProps) {
  return (
    <div
      className={`my-2 flex min-w-0 flex-row items-center gap-2.5 px-3 py-2.5 ${className ?? ""}`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-(--radius-inner) bg-panel text-icon-muted">
        <Icon name="phone-dynamic-island" className="size-(--icon-sm)" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-foreground">{row.summary}</span>
        <span className="truncate text-xs text-muted-foreground-2">
          Phone added to this thread · {row.machineId}
        </span>
      </span>
      {onOpen === undefined ? null : (
        <Button variant="outline" size="xs" onClick={() => onOpen(row.machineId)}>
          Open
        </Button>
      )}
    </div>
  );
}
