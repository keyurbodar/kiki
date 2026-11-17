import { Textarea } from "./textarea";

export function TextareaSpecimen() {
  return (
    <div className="flex w-96 flex-col gap-3 p-6">
      <Textarea rows={3} placeholder="Default" />
      <Textarea size="base" placeholder="Auto-growing base" />
      <Textarea variant="blank" placeholder="Blank" />
      <Textarea variant="editor" rows={4} defaultValue="export const a = 1;" />
      <Textarea font="mono" rows={2} defaultValue="KEY=value" />
      <Textarea aria-invalid rows={2} defaultValue="Invalid" />
      <Textarea disabled rows={2} placeholder="Disabled" />
    </div>
  );
}
