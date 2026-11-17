import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings-page";
import type { Organization, Visibility } from "@/data/api/schemas/organization";
import {
  setMyDefaultVisibilityAtom,
  setOrganizationSharingAtom,
} from "@/data/atoms/organizations";
import { Card } from "@/primitives/card";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  catalogRow,
  type MyDefaultVisibility,
  myDefaultLabels,
  myDefaultVisibility,
  sharingPayload,
  visibilityLabels,
} from "./org-general";

export type SharingSectionProps = {
  organization: Organization;
  isAdmin: boolean;
  adminReason: string | undefined;
  onSaved: () => void;
};

export function SharingSection({
  organization,
  isAdmin,
  adminReason,
  onSaved,
}: SharingSectionProps) {
  const setSharing = useAtomSet(setOrganizationSharingAtom, {
    mode: "promise",
  });
  const setMyDefault = useAtomSet(setMyDefaultVisibilityAtom, {
    mode: "promise",
  });
  const [pending, setPending] = useState<"mine" | "org" | null>(null);
  const everyone = `Everyone at ${organization.name}`;
  const params = { orgId: organization.id };

  const saveMine = (defaultVisibility: Visibility | null) => {
    setPending("mine");
    setMyDefault({ params, payload: { defaultVisibility } })
      .then(() => {
        onSaved();
        toast.success("Your default saved");
      })
      .catch(() => toast.error("Could not change your default"))
      .finally(() => setPending(null));
  };

  const saveSharing = (defaultVisibility: Visibility, privateWork: boolean) => {
    setPending("org");
    setSharing({
      params,
      payload: sharingPayload(defaultVisibility, privateWork),
    })
      .then(() => {
        onSaved();
        toast.success("Sharing saved");
      })
      .catch(() => toast.error("Could not change sharing"))
      .finally(() => setPending(null));
  };

  const mine = catalogRow("my-default-visibility");
  const orgDefault = catalogRow("org-default-visibility");
  const privateWork = catalogRow("org-private-work");
  const orgLocked = !isAdmin || pending !== null;

  return (
    <SettingsSection title="Sharing">
      <Card rows>
        <SettingsRow
          id={mine.id}
          label={mine.title}
          description="Preselected when you start a thread or Captain"
        >
          <MenuSelect<MyDefaultVisibility>
            items={myDefaultLabels(organization.name)}
            value={myDefaultVisibility(organization)}
            disabled={pending !== null}
            onValueChange={(value) => {
              if (value !== null) saveMine(value === "default" ? null : value);
            }}
          >
            <MenuSelectTrigger size="sm" className="w-56!">
              <MenuSelectValue />
            </MenuSelectTrigger>
            <MenuSelectContent>
              <MenuSelectItem value="default">
                Organization default
              </MenuSelectItem>
              <MenuSelectItem value="org">{everyone}</MenuSelectItem>
              {organization.personalThreadsEnabled ? (
                <MenuSelectItem value="private">
                  Only specific people
                </MenuSelectItem>
              ) : null}
            </MenuSelectContent>
          </MenuSelect>
        </SettingsRow>
        <SettingsRow
          id={orgDefault.id}
          label={orgDefault.title}
          description={
            isAdmin
              ? "Preselected for everyone who has not picked their own default"
              : adminReason
          }
        >
          <MenuSelect<Visibility>
            items={visibilityLabels(organization.name)}
            value={organization.defaultVisibility}
            disabled={orgLocked}
            onValueChange={(value) => {
              if (value !== null)
                saveSharing(value, organization.personalThreadsEnabled);
            }}
          >
            <MenuSelectTrigger size="sm" className="w-56!" title={adminReason}>
              <MenuSelectValue />
            </MenuSelectTrigger>
            <MenuSelectContent>
              <MenuSelectItem value="org">{everyone}</MenuSelectItem>
              <MenuSelectItem
                value="private"
                disabled={!organization.personalThreadsEnabled}
              >
                Only specific people
              </MenuSelectItem>
            </MenuSelectContent>
          </MenuSelect>
        </SettingsRow>
        <SettingsRow
          id={privateWork.id}
          label={privateWork.title}
          description={
            isAdmin
              ? "Threads, Captains, and projects only the people named can see"
              : adminReason
          }
        >
          <Switch
            checked={organization.personalThreadsEnabled}
            disabled={orgLocked}
            title={adminReason}
            aria-label="Allow private work"
            onCheckedChange={(checked) =>
              saveSharing(organization.defaultVisibility, checked)
            }
          />
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}
