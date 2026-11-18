import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { Device } from "@/data/api/schemas/devices";
import type { OrgId } from "@/data/api/schemas/ids";
import { reactivityKeys } from "@/data/atoms/conventions";
import { devicesAtom, updateUserPreferencesAtom } from "@/data/atoms/devices";
import { currentUserAtom } from "@/data/atoms/session";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Switch } from "@/primitives/switch";
import {
  CardListHeader,
  SettingsLoadFailedRow,
  SettingsLoadingCard,
  SettingsPage,
  SettingsRow,
  SettingsRowLink,
  SettingsSection,
  useActiveOrgId,
} from "../shared";
import { PlusMediumIcon } from "./icons";
import { PairDeviceDialog } from "./pair-device-dialog";
import { DeviceIcon, StatusDot } from "./parts";
import {
  agentMovesEnabled,
  checkpointsEnabled,
  compareDevices,
  countLabel,
  deviceStatus,
  errorMessage,
} from "./status";

const checkpointsDescription =
  "Keep a temporary cloud copy of uncommitted work on this device, respecting .gitignore, so a thread can move to the cloud while the device is offline.";
const agentMovesDescription =
  "Capy may move a thread to the cloud or back to this device when that unblocks the work, and says so in the thread. Off: only you can move a thread, from the thread header or by asking.";

const pairedDevicesId = "paired-devices";
const cloudCheckpoints = {
  id: "cloud-checkpoints",
  title: "Cloud checkpoints",
} as const;
const agentMoves = {
  id: "agent-moves",
  title: "Let Capy move threads between this device and the cloud",
} as const;

const yourDevicesTitle = "Your devices";
const yourDevicesDescription = "The machines you paired to this organization";

export type DevicesPageProps = { pair?: { code: string } };

export function DevicesPage({ pair }: DevicesPageProps) {
  const [open, setOpen] = useState(pair !== undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const openPair = () => {
    setDialogKey((key) => key + 1);
    setOpen(true);
  };
  const orgId = useActiveOrgId();
  const userResult = useAtomValue(currentUserAtom);
  const user = AsyncResult.isSuccess(userResult) ? userResult.value : undefined;
  const updatePreferences = useAtomSet(updateUserPreferencesAtom, {
    mode: "promise",
  });
  const [saving, setSaving] = useState(false);
  const savePreferences = (devices: Record<string, boolean>) => {
    setSaving(true);
    updatePreferences({
      payload: { devices },
      reactivityKeys: [reactivityKeys.currentUser],
    })
      .catch((cause) =>
        toast.error(
          errorMessage(cause, "Could not update the device settings"),
        ),
      )
      .finally(() => setSaving(false));
  };
  const pairButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Pair a device"
      title="Pair a device"
      onClick={openPair}
    >
      <PlusMediumIcon />
    </Button>
  );

  return (
    <>
      <SettingsPage title="Devices" description="Run Capy on your own machine">
        {orgId === undefined ? (
          <SettingsSection
            id={pairedDevicesId}
            title={yourDevicesTitle}
            description={yourDevicesDescription}
          >
            <SettingsLoadingCard />
          </SettingsSection>
        ) : (
          <DeviceSections orgId={orgId} pairButton={pairButton} />
        )}
        <SettingsSection
          id={cloudCheckpoints.id}
          title="Moving threads"
          description="How a device thread's workspace moves between this device and the cloud"
        >
          <Card rows>
            <SettingsRow
              label={cloudCheckpoints.title}
              description={checkpointsDescription}
            >
              <Switch
                checked={
                  user !== undefined && checkpointsEnabled(user.preferences)
                }
                disabled={user === undefined || saving}
                onCheckedChange={(checked) =>
                  savePreferences({ checkpoints: checked })
                }
                aria-label={cloudCheckpoints.title}
              />
            </SettingsRow>
            <SettingsRow
              id={agentMoves.id}
              label={agentMoves.title}
              description={agentMovesDescription}
            >
              <Switch
                checked={
                  user !== undefined && agentMovesEnabled(user.preferences)
                }
                disabled={user === undefined || saving}
                onCheckedChange={(checked) =>
                  savePreferences({ agentMoves: checked })
                }
                aria-label={agentMoves.title}
              />
            </SettingsRow>
          </Card>
        </SettingsSection>
      </SettingsPage>
      <PairDeviceDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        initialCode={pair?.code}
      />
    </>
  );
}

function DeviceSections({
  orgId,
  pairButton,
}: {
  orgId: OrgId;
  pairButton: ReactNode;
}) {
  const result = useAtomValue(devicesAtom(orgId));
  const refresh = useAtomRefresh(devicesAtom(orgId));
  const sorted = AsyncResult.isSuccess(result)
    ? result.value.toSorted(compareDevices)
    : AsyncResult.isFailure(result) && Option.isSome(result.previousSuccess)
      ? result.previousSuccess.value.value.toSorted(compareDevices)
      : [];

  if (AsyncResult.isInitial(result)) {
    return (
      <SettingsSection
        id={pairedDevicesId}
        title={yourDevicesTitle}
        description={yourDevicesDescription}
      >
        <SettingsLoadingCard />
      </SettingsSection>
    );
  }
  if (AsyncResult.isFailure(result) && Option.isNone(result.previousSuccess)) {
    return (
      <SettingsSection
        id={pairedDevicesId}
        title={yourDevicesTitle}
        description={yourDevicesDescription}
      >
        <Card>
          <SettingsLoadFailedRow
            label="Could not load devices"
            onRetry={refresh}
          />
        </Card>
      </SettingsSection>
    );
  }
  if (sorted.length === 0) {
    return (
      <SettingsSection
        id={pairedDevicesId}
        title={yourDevicesTitle}
        description={yourDevicesDescription}
      >
        <Card rows>
          <CardListHeader label="No devices" action={pairButton} />
        </Card>
      </SettingsSection>
    );
  }
  return (
    <SettingsSection
      id={pairedDevicesId}
      title={yourDevicesTitle}
      description={yourDevicesDescription}
    >
      <Card rows>
        <CardListHeader
          label={countLabel(sorted.length, "device")}
          action={pairButton}
        />
        {sorted.map((device) => (
          <DeviceRow key={device.id} device={device} />
        ))}
      </Card>
    </SettingsSection>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const status = deviceStatus(device);
  return (
    <SettingsRowLink
      to="/settings/devices/$deviceId"
      params={{ deviceId: device.id }}
      icon={<DeviceIcon os={device.os} />}
      label={device.name}
      descriptionTone="strong"
      description={
        <span className="flex items-center gap-1.5">
          <StatusDot color={status.color} />
          {status.label}
        </span>
      }
    >
      {device.revokedAt === null ? (
        device.access === "shared" ? (
          <Badge color="accent">Shared</Badge>
        ) : null
      ) : (
        <Badge color="neutral">Revoked</Badge>
      )}
    </SettingsRowLink>
  );
}
