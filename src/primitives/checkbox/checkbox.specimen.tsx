import { Checkbox } from "./checkbox";

export function CheckboxSpecimen() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Checkbox aria-label="Unchecked" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" indeterminate />
      <Checkbox aria-label="Disabled" disabled />
      <Checkbox aria-label="Disabled checked" disabled defaultChecked />
    </div>
  );
}
