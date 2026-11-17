import { Button } from "@/primitives/button";
import { Kbd } from "./kbd";

export function KbdSpecimen() {
  return (
    <div className="flex items-center gap-4 p-6">
      <Kbd>⌘K</Kbd>
      <Kbd variant="chip">⌘</Kbd>
      <Kbd variant="chip">Enter</Kbd>
      <Button intent="accent">
        Send <Kbd variant="onFill">⏎</Kbd>
      </Button>
    </div>
  );
}
