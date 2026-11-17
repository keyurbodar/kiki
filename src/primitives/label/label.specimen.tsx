import { Field } from "@base-ui/react/field";
import { Input } from "@/primitives/input";
import { Label } from "./label";

export function LabelSpecimen() {
  return (
    <div className="flex w-80 flex-col gap-4 p-6">
      <Field.Root className="flex flex-col gap-1.5">
        <Label>Name</Label>
        <Input placeholder="Capy" />
      </Field.Root>
      <Field.Root className="flex flex-col gap-1.5">
        <Label tone="strong">Strong tone</Label>
        <Input placeholder="Value" />
      </Field.Root>
    </div>
  );
}
