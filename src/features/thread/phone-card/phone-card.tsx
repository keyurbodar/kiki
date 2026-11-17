import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  type PhoneRow,
  phoneLabel,
  phoneStatus,
  phoneSubtitle,
} from "./phone-card-logic.ts";

export type PhoneCardProps = {
  readonly phone: PhoneRow;
  readonly summary?: string;
  readonly removed?: boolean;
  readonly onOpen?: (machineId: string) => void;
};

export function PhoneCard({
  phone,
  summary,
  removed = false,
  onOpen,
}: PhoneCardProps) {
  return (
    <div className="my-2 flex-row items-center gap-2.5 rounded-(--radius-card) border-hairline border-border-2 bg-panel px-3 py-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-(--radius-inner) bg-panel text-icon-muted">
        <Icon name="phone-dynamic-island" size="sm" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-foreground">
          {phoneLabel(phone)}
          <span className="font-normal text-muted-foreground-2">
            {" "}
            · {phoneStatus(phone)}
          </span>
        </span>
        {removed ? (
          <span className="shrink-0 text-xs text-muted-foreground-2">
            Removed
          </span>
        ) : (
          <span className="truncate text-xs text-muted-foreground-2">
            {summary ?? `Phone added to this thread · ${phoneSubtitle(phone)}`}
          </span>
        )}
      </span>
      {onOpen === undefined ? null : (
        <Button size="xs" onClick={() => onOpen(phone.machineId)}>
          Open
        </Button>
      )}
    </div>
  );
}
