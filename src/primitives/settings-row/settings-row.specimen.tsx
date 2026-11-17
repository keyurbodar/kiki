import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Switch } from "@/primitives/switch";
import { SettingsRow, SettingsRowLink } from "./settings-row";

export function SettingsRowSpecimen() {
  return (
    <div className="w-[36rem] p-4">
      <Card rows>
        <SettingsRow label="Name" description="Shown to your team">
          Ada Lovelace
        </SettingsRow>
        <SettingsRow
          label="Notifications"
          description="Email me about mentions"
          icon={<Icon name="email-1" />}
        >
          <Switch aria-label="Notifications" defaultChecked />
        </SettingsRow>
        <SettingsRow label="Highlighted" highlighted />
        <SettingsRowLink
          to="/"
          label="Appearance"
          description="Theme and wallpaper"
          icon={<Icon name="color-palette" />}
        />
      </Card>
    </div>
  );
}
