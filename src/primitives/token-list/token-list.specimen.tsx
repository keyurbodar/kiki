import { SettingsRow } from "@/primitives/settings-row";
import { TokenList } from "./token-list";

export function TokenListSpecimen() {
  return (
    <div className="w-96 p-4">
      <TokenList>
        <SettingsRow label="Deploy token" description="Created today" />
        <SettingsRow label="CI token" description="Created last week" />
      </TokenList>
    </div>
  );
}
