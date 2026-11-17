import { intents } from "@/primitives/intent";
import { Badge } from "./badge";

export function BadgeSpecimen() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {(["default", "ghost", "filled"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {intents.map((color) => (
            <Badge key={color} variant={variant} color={color}>
              {color}
            </Badge>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="base">Base</Badge>
        <Badge size="sm">Small</Badge>
        <Badge size="xs">Extra small</Badge>
        <Badge size="count" variant="filled" color="accent">
          3
        </Badge>
        <Badge size="auto" variant="ghost">
          Auto
        </Badge>
        <Badge onClick={() => {}}>Interactive</Badge>
      </div>
    </div>
  );
}
