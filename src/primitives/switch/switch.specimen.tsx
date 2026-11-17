import { Switch } from "./switch";

export function SwitchSpecimen() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Switch aria-label="Off" />
      <Switch aria-label="On" defaultChecked />
      <Switch aria-label="Disabled" disabled />
      <Switch aria-label="Disabled on" disabled defaultChecked />
    </div>
  );
}
