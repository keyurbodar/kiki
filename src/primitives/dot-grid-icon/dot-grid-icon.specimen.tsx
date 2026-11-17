import { DotGridIcon, type DotGridIconState } from "./dot-grid-icon";

const STATES: DotGridIconState[] = [
  "working",
  "waiting",
  "needs-you",
  "failed",
];
const SIZES = ["xs", "sm", "base"] as const;

export function DotGridIconSpecimen() {
  return (
    <div className="flex flex-col gap-4 p-6 text-muted-foreground-1">
      {STATES.map((state) => (
        <div key={state} className="flex items-center gap-4">
          {SIZES.map((size) => (
            <DotGridIcon key={size} state={state} size={size} label={state} />
          ))}
          <span className="size-6">
            <DotGridIcon state={state} size="inherit" className="size-full" />
          </span>
          <span className="text-xs">{state}</span>
        </div>
      ))}
    </div>
  );
}
