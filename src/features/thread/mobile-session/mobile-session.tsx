import { MobileSessionRow as MobileSessionRowSchema } from "@/data/events";
import type { Schema } from "effect";

import { Icon } from "@/primitives/icon";

type MobileSessionRowData = Schema.Schema.Type<typeof MobileSessionRowSchema>;

export type MobileSessionProps = {
  row: MobileSessionRowData;
  className?: string;
};

/** One mobile device session in the thread: app, device and current state. */
export function MobileSession({ row, className }: MobileSessionProps) {
  const detail = [row.appName, row.deviceModel].filter(Boolean).join(" · ");
  return (
    <div className={`flex min-h-7 w-full items-center gap-2 py-1 ${className ?? ""}`}>
      <Icon name="phone-dynamic-island" className="size-(--icon-sm) text-muted-foreground-2" />
      <span className="min-w-0 truncate text-xs text-muted-foreground-1">{detail}</span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground-2">{row.status}</span>
    </div>
  );
}
