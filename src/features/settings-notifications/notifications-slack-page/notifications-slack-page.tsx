import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { currentUserAtom } from "@/data/atoms/session";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import {
  CompletionRows,
  OriginRows,
} from "../notification-filter-rows/notification-filter-rows";
import {
  type CompletionKind,
  completionKinds,
  isOriginOnByDefault,
  type NotificationOrigin,
  notificationOrigins,
} from "../notification-filter-rows/notification-kinds";
import {
  activeSlackLinksAtom,
  currentUserKeys,
  updatePreferencesAtom,
} from "../notifications-page/atoms";
import { slackNotificationPreferences } from "../notifications-page/user-preferences";
import { SlackLogo } from "./slack-logo";

const kindRowIds: Record<CompletionKind, string> = {
  mention: "slack-notify-mention",
  error: "slack-notify-error",
  pr_merged: "slack-notify-pr-merged",
};

type SlackPayload = {
  enabled: boolean;
  kinds: Record<CompletionKind, boolean>;
  origins: Record<NotificationOrigin, boolean>;
};

export function SettingsNotificationsSlackPage() {
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const links = useAtomValue(activeSlackLinksAtom);
  const update = useAtomSet(updatePreferencesAtom, { mode: "promise" });
  const [saving, setSaving] = useState(false);
  const slack = slackNotificationPreferences(user?.preferences);
  const enabled = slack?.enabled === true;
  const linked = links.length > 0;

  const kindOn = (kind: CompletionKind) => slack?.kinds?.[kind] !== false;
  const originOn = (origin: NotificationOrigin) =>
    slack?.origins?.[origin] ?? isOriginOnByDefault(origin);
  const allKinds = () =>
    Object.fromEntries(
      completionKinds.map((kind) => [kind, kindOn(kind)]),
    ) as Record<CompletionKind, boolean>;
  const allOrigins = () =>
    Object.fromEntries(
      notificationOrigins.map((origin) => [origin, originOn(origin)]),
    ) as Record<NotificationOrigin, boolean>;

  const save = (next: SlackPayload) => {
    setSaving(true);
    update({
      payload: { notifications: { slack: next } },
      reactivityKeys: currentUserKeys,
    })
      .catch(() => toast.error("Could not update Slack notifications"))
      .finally(() => setSaving(false));
  };

  return (
    <SettingsPage
      title="Slack"
      description="A direct message from Capy when a thread comes back to you"
      icon={<SlackLogo className="size-6" />}
    >
      <SettingsSection>
        <Card rows>
          <SettingsRow
            id="slack-notify-enabled"
            label="Slack direct messages"
            description={
              linked ? (
                "The thread, its last message, and its files, with a button to sync it into a channel"
              ) : (
                <>
                  <Link
                    to="/settings/integrations/slack"
                    className="text-text-link hover:underline"
                  >
                    Link your Slack account
                  </Link>{" "}
                  in this organization first
                </>
              )
            }
          >
            <Switch
              checked={enabled}
              disabled={!linked || user === undefined || saving}
              onCheckedChange={(next) =>
                save({
                  enabled: next,
                  kinds: allKinds(),
                  origins: allOrigins(),
                })
              }
              aria-label="Slack direct messages"
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      <SettingsSection title="Kinds">
        <Card rows>
          <CompletionRows
            kinds={completionKinds}
            rowId={(kind) => kindRowIds[kind]}
            checked={(kind) => enabled && kindOn(kind)}
            disabled={!enabled || saving}
            onChange={(kind, next) =>
              save({
                enabled: true,
                kinds: { ...allKinds(), [kind]: next },
                origins: allOrigins(),
              })
            }
            ariaPrefix="Slack DM when"
          />
        </Card>
      </SettingsSection>
      <SettingsSection title="Origins">
        <Card rows>
          <OriginRows
            checked={(origin) => enabled && originOn(origin)}
            disabled={!enabled || saving}
            onChange={(origin, next) =>
              save({
                enabled: true,
                kinds: allKinds(),
                origins: { ...allOrigins(), [origin]: next },
              })
            }
            ariaPrefix="Slack DM for"
          />
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
