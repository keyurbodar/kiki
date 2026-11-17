import { CopyField } from "./copy-field";

export function CopyFieldSpecimen() {
  return (
    <div className="flex w-96 flex-col gap-3 p-4">
      <CopyField value="org_01J8Z3Q4R5S6T7U8V9W0" label="organization id" />
      <CopyField value="sk_live_example" label="API key" secret />
      <CopyField value="org_01J8Z3Q4R5S6T7U8V9W0" label="id" size="sm" />
    </div>
  );
}
