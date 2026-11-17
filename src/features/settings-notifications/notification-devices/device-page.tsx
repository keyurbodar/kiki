import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { currentUserAtom } from "@/data/atoms/session";
import { Card } from "@/primitives/card";
import {
  patchPushSubscriptionAtom,
  pushSubscriptionIdAtom,
  pushSubscriptionKeys,
} from "../notification-devices/atoms";
import { pushPatchPayload } from "../notification-devices/push-state";
import {
  CompletionRows,
  OriginRows,
} from "../notification-filter-rows/notification-filter-rows";
import {
  type DeviceCompletionKind,
  deviceCompletionKinds,
} from "../notification-filter-rows/notification-kinds";
import {
  isDesktopApp,
  isKindEnabled,
  isOriginEnabled,
  type NotificationPrefs,
  notificationPrefsAtom,
} from "../notifications-page/notification-prefs";

const kindRowIds: Record<DeviceCompletionKind, string> = {
  mention: "notify-mention",
  error: "notify-error",
};

export function SettingsNotificationsDevicePage() {
  const [prefs, setPrefs] = useAtom(notificationPrefsAtom);
  const subscriptionId = useAtomValue(pushSubscriptionIdAtom);
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const patch = useAtomSet(patchPushSubscriptionAtom, { mode: "promise" });

  const save = (next: NotificationPrefs) => {
    setPrefs(next);
    if (subscriptionId === null || user === undefined) return;
    patch({
      params: { id: subscriptionId },
      payload: pushPatchPayload(next),
      reactivityKeys: pushSubscriptionKeys(user.id),
    }).catch(() => {});
  };

  return (
    <SettingsPage
      title={isDesktopApp() ? "Desktop app" : "This browser"}
      description="Applies to this device only, other devices keep their own switches"
    >
      <SettingsSection title="Kinds">
        <Card rows>
          <CompletionRows
            kinds={deviceCompletionKinds}
            rowId={(kind) => kindRowIds[kind]}
            checked={(kind) => isKindEnabled(prefs, kind)}
            onChange={(kind, next) => save({ ...prefs, [kind]: next })}
            ariaPrefix="Notify when"
          />
        </Card>
      </SettingsSection>
      <SettingsSection title="Origins">
        <Card rows>
          <OriginRows
            checked={(origin) => isOriginEnabled(prefs, origin)}
            onChange={(origin, next) =>
              save({ ...prefs, origins: { ...prefs.origins, [origin]: next } })
            }
            ariaPrefix="Notify for"
          />
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
