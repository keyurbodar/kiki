import { Input } from "@/primitives/input";
import { Label } from "./label";

export function LabelSpecimen() {
  return (
    <div className="flex w-80 flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="specimen-name">Name</Label>
        <Input id="specimen-name" placeholder="Capy" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="specimen-strong" tone="strong">
          Strong tone
        </Label>
        <Input id="specimen-strong" placeholder="Value" />
      </div>
    </div>
  );
}
