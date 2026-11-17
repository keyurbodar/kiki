import { useAtom, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings-page";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { GlobeIcon, ShareIcon } from "../notification-filter-rows/icons";
import { SettingsSkeletonCard } from "../notification-filter-rows/settings-skeleton";
import {
  pushEnableAtom,
  pushInstallDialogOpenAtom,
  pushRetryAtom,
  pushStateAtom,
  pushSubscriptionIdAtom,
  pushSubscriptionKeys,
  unsubscribePushAtom,
} from "./atoms";
import {
  readPushState,
  subscriptionActivity,
  subscriptionKindsSummary,
} from "./push-state";
import {
  currentPushDeviceLabel,
  pushSupport,
  unsubscribeBrowserPush,
} from "./web-push";

const deviceIcon = (label: string) =>
  label.startsWith("Safari") ? (
    <Icon name="safari" />
  ) : label.startsWith("Chrome") || label.startsWith("Edge") ? (
    <Icon name="chrome" />
  ) : (
    <GlobeIcon />
  );

const withThisDevice = (label: ReactNode) => (
  <span className="flex items-center gap-2">
    {label}
    <Badge color="accent">This device</Badge>
  </span>
);

export function AddToHomeScreenDialog() {
  const [open, setOpen] = useAtom(pushInstallDialogOpenAtom);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Capy to your Home Screen</DialogTitle>
          <DialogDescription>
            iPhone and iPad deliver push only to apps on the Home Screen
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-foreground">
            <li>
              Tap <span className="font-medium">Share</span> in Safari
            </li>
            <li>
              Tap <span className="font-medium">Add to Home Screen</span>, then{" "}
              <span className="font-medium">Add</span>
            </li>
            <li>Open Capy from the Home Screen and turn on push here</li>
          </ol>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type NotificationDevicesSectionProps = { userId: string };

export function NotificationDevicesSection({
  userId,
}: NotificationDevicesSectionProps) {
  const result = useAtomValue(pushStateAtom(userId));
  const [currentId, setCurrentId] = useAtom(pushSubscriptionIdAtom);
  const enable = useAtomValue(pushEnableAtom);
  const unsubscribe = useAtomSet(unsubscribePushAtom, { mode: "promise" });
  const openInstall = useAtomSet(pushInstallDialogOpenAtom);
  const [retry, setRetry] = useAtom(pushRetryAtom);
  const [busy, setBusy] = useState(false);
  const [support] = useState(pushSupport);
  const now = Date.now();

  if (support === "unsupported" && currentId === null) return null;

  const failed = AsyncResult.isFailure(result);
  const state = failed
    ? undefined
    : Option.getOrUndefined(
        Option.map(AsyncResult.value(result), readPushState),
      );
  const current = state?.subscriptions.find((row) => row.id === currentId);
  const others =
    state?.subscriptions.filter((row) => row.id !== currentId) ?? [];

  const enableHere = () => {
    if (enable === null) return;
    setBusy(true);
    enable()
      .then((outcome) => {
        if (outcome === "denied")
          toast.info("Allow notifications for this site to turn on push");
        if (outcome === "unavailable")
          toast.error("Could not turn on push on this device");
      })
      .catch(() => toast.error("Could not turn on push on this device"))
      .finally(() => setBusy(false));
  };

  const disableHere = () => {
    setBusy(true);
    unsubscribeBrowserPush()
      .then(() =>
        currentId === null
          ? undefined
          : unsubscribe({
              params: { id: currentId },
              reactivityKeys: pushSubscriptionKeys(userId),
            }),
      )
      .then(() => setCurrentId(null))
      .catch(() => toast.error("Could not turn off push on this device"))
      .finally(() => setBusy(false));
  };

  const remove = (id: string) => {
    unsubscribe({
      params: { id },
      reactivityKeys: pushSubscriptionKeys(userId),
    }).catch(() => toast.error("Could not remove the device"));
  };

  return (
    <SettingsSection
      title="Devices"
      description="Push reaches these browsers and installed apps even when Capy is closed"
    >
      {failed ? (
        <Card>
          <SettingsRow
            label="Devices are unavailable"
            description="Check your connection and try again"
            descriptionTone="strong"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRetry(retry + 1)}
            >
              Retry
            </Button>
          </SettingsRow>
        </Card>
      ) : state === undefined ? (
        <SettingsSkeletonCard label="Loading devices" />
      ) : state.vapidPublicKey === null ? (
        <Card>
          <SettingsRow label="Push is not configured on this deployment" />
        </Card>
      ) : (
        <Card rows>
          {current === undefined ? (
            support === "install" ? (
              <SettingsRow
                icon={<Icon name="phone-dynamic-island" />}
                label={withThisDevice(currentPushDeviceLabel())}
                description="Add Capy to your Home Screen first, then turn on push here"
                descriptionTone="strong"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInstall(true)}
                >
                  <ShareIcon />
                  How to add
                </Button>
              </SettingsRow>
            ) : support === "supported" ? (
              <SettingsRow
                icon={deviceIcon(currentPushDeviceLabel())}
                label={withThisDevice(currentPushDeviceLabel())}
                description="Not receiving push"
              >
                <Button
                  size="sm"
                  aria-busy={busy}
                  disabled={busy || enable === null}
                  onClick={enableHere}
                >
                  Enable on this device
                </Button>
              </SettingsRow>
            ) : null
          ) : (
            <SettingsRow
              icon={deviceIcon(current.label)}
              label={withThisDevice(current.label)}
              description={`${subscriptionKindsSummary(current)} · ${subscriptionActivity(current, now)}`}
            >
              <Switch
                checked
                disabled={busy}
                onCheckedChange={disableHere}
                aria-label="Push on this device"
              />
            </SettingsRow>
          )}
          {others.map((row) => (
            <SettingsRow
              key={row.id}
              icon={deviceIcon(row.label)}
              label={row.label}
              description={`${subscriptionKindsSummary(row)} · ${subscriptionActivity(row, now)}`}
            >
              <Button variant="ghost" size="sm" onClick={() => remove(row.id)}>
                Remove
              </Button>
            </SettingsRow>
          ))}
        </Card>
      )}
      <AddToHomeScreenDialog />
    </SettingsSection>
  );
}
