import { useState } from "react";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";

export type CustomRangeProps = {
  selected: boolean;
  from?: string;
  to?: string;
  onApply: (from: string, to: string) => void;
};

const shortDate = (value?: string) =>
  value === undefined
    ? "Custom"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(`${value}T00:00:00`));

export function CustomRange({ selected, from, to, onApply }: CustomRangeProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");
  const invalid = draftFrom === "" || draftTo === "" || draftFrom > draftTo;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraftFrom(from ?? "");
          setDraftTo(to ?? "");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        data-track-owner="features/settings/custom-range.tsx#CustomRange:PopoverTrigger.1"
        render={
          <Button
            data-track-owner="features/settings/custom-range.tsx#CustomRange:Button.1"
            size="xs"
            variant="ghost"
            data-selected={selected ? "" : undefined}
          >
            {selected && from !== undefined && to !== undefined
              ? `${shortDate(from)} – ${shortDate(to)}`
              : "Custom"}
          </Button>
        }
      />
      <PopoverContent className="w-64 gap-3" side="bottom" align="start">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-normal text-muted-foreground-1">
            From
          </span>
          <Input
            type="date"
            size="sm"
            value={draftFrom}
            onChange={(event) => setDraftFrom(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-normal text-muted-foreground-1">
            To
          </span>
          <Input
            type="date"
            size="sm"
            value={draftTo}
            onChange={(event) => setDraftTo(event.target.value)}
          />
        </div>
        <Button
          data-track-owner="features/settings/custom-range.tsx#CustomRange:Button[Apply]"
          size="sm"
          intent="accent"
          disabled={invalid}
          onClick={() => {
            onApply(draftFrom, draftTo);
            setOpen(false);
          }}
        >
          Apply
        </Button>
      </PopoverContent>
    </Popover>
  );
}
