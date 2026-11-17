import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, Navigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Fragment, type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  type Device,
  type DeviceAccess,
  type DeviceAgentAccessMode,
  type DeviceHardware,
  DeviceId,
  type DeviceOs,
  type DeviceWorkspace,
} from "@/data/api/schemas/devices";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  deviceReactivityKeys,
  devicesAtom,
  renameDeviceAtom,
  revokeDeviceAtom,
  setDeviceAccessAtom,
  setDeviceAgentAccessAtom,
  setDeviceComputerUseAccessAtom,
  setDeviceDescriptionAtom,
} from "@/data/atoms/devices";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CopyField } from "@/primitives/copy-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  SettingsPage,
  SettingsRow,
  SettingsSection,
  useActiveOrgId,
} from "../shared";
import { EditableDescription, EditableTitle } from "./editable-page-fields";
import { HardwareIcon, StatusDot } from "./parts";
import {
  accessDescription,
  accessLabels,
  agentAccessDescription,
  agentAccessLabels,
  computerUseDescription,
  deviceStatus,
  errorMessage,
  formatDateTime,
  formFactorLabels,
  hardwareRows,
  workspaceDiffCounts,
} from "./status";

/** /settings/devices/this: the web app never has a local device, so it goes back to the list. */
export function ThisDevicePage() {
  return <Navigate to="/settings/devices" replace />;
}

export function DeviceDetailPage({ deviceId }: { deviceId: string }) {
  const orgId = useActiveOrgId();
  if (orgId === undefined) return <DeviceLoading />;
  return <DeviceDetailLoader orgId={orgId} deviceId={deviceId} />;
}

function DeviceLoading() {
  return (
    <SettingsPage title="Device">
      <Card>
        <SettingsRow
          label="Loading device"
          description="Reading the paired machines"
          descriptionTone="strong"
        >
          <SkeletonPanel className="h-7 w-20" />
        </SettingsRow>
      </Card>
    </SettingsPage>
  );
}

function DeviceDetailLoader({
  orgId,
  deviceId,
}: {
  orgId: OrgId;
  deviceId: string;
}) {
  const result = useAtomValue(devicesAtom(orgId));
  const refresh = useAtomRefresh(devicesAtom(orgId));
  const devices = AsyncResult.isSuccess(result)
    ? result.value
    : AsyncResult.isFailure(result) && Option.isSome(result.previousSuccess)
      ? result.previousSuccess.value.value
      : [];
  const device = devices.find((row) => row.id === DeviceId.make(deviceId));
  if (device !== undefined) {
    return <DeviceDetail key={device.id} orgId={orgId} device={device} />;
  }
  if (AsyncResult.isInitial(result)) return <DeviceLoading />;
  const failed =
    AsyncResult.isFailure(result) && Option.isNone(result.previousSuccess);
  return (
    <SettingsPage title="Device">
      <Card>
        <SettingsRow
          label={failed ? "Could not load devices" : "Device not found"}
          description={
            failed
              ? "Check your connection and try again"
              : "No device with this id is paired to the selected organization"
          }
          descriptionTone="strong"
        >
          <Button variant="ghost" size="sm" onClick={refresh}>
            Retry
          </Button>
          {!failed && (
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/settings/devices">All devices</Link>}
            />
          )}
        </SettingsRow>
      </Card>
    </SettingsPage>
  );
}

function ValueText({ children }: { children: ReactNode }) {
  return <span className="text-sm text-muted-foreground-1">{children}</span>;
}

function DeviceDetail({ orgId, device }: { orgId: OrgId; device: Device }) {
  const userResult = useAtomValue(currentUserAtom);
  const user = AsyncResult.isSuccess(userResult) ? userResult.value : undefined;
  const organizationsResult = useAtomValue(organizationsAtom);
  const org = AsyncResult.isSuccess(organizationsResult)
    ? organizationsResult.value.find((row) => row.id === orgId)
    : undefined;
  const isAdmin = org?.accessLevel === "admin" || org?.accessLevel === "owner";
  const rename = useAtomSet(renameDeviceAtom, { mode: "promise" });
  const setDescription = useAtomSet(setDeviceDescriptionAtom, {
    mode: "promise",
  });
  const revoke = useAtomSet(revokeDeviceAtom, { mode: "promise" });
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const reactivityKeys = [deviceReactivityKeys.devices(orgId)];
  const params = { orgId, deviceId: device.id };
  const status = deviceStatus(device);
  const owner =
    device.userId === user?.id ? "You" : (device.ownerName ?? device.userId);

  const saveName = (name: string) => {
    setPending(true);
    rename({ params, payload: { name }, reactivityKeys })
      .then(
        () => toast.success("Device renamed"),
        (cause) => toast.error(errorMessage(cause, "Could not rename device")),
      )
      .finally(() => setPending(false));
  };
  const saveDescription = (description: string | null) => {
    setPending(true);
    setDescription({ params, payload: { description }, reactivityKeys })
      .then(
        () =>
          toast.success(
            description === null ? "Description cleared" : "Description saved",
          ),
        (cause) =>
          toast.error(errorMessage(cause, "Could not save description")),
      )
      .finally(() => setPending(false));
  };
  const confirmRevoke = () => {
    setPending(true);
    revoke({ params, reactivityKeys })
      .then(() => toast.success("Device revoked"))
      .catch((cause) =>
        toast.error(errorMessage(cause, "Could not revoke device")),
      )
      .finally(() => setPending(false));
  };

  return (
    <>
      <SettingsPage
        title={device.name}
        headerFields={
          <>
            <EditableTitle
              key={device.name}
              value={device.name}
              ariaLabel="Device name"
              maxLength={255}
              disabled={pending}
              onSave={saveName}
            />
            <EditableDescription
              key={device.description ?? ""}
              value={device.description}
              ariaLabel="Device description"
              placeholder="Add a description, like what this machine is for"
              maxLength={140}
              disabled={pending}
              onSave={saveDescription}
            />
            <p className="text-sm font-normal text-muted-foreground-1">
              {`${device.hostname} on ${device.os}/${device.arch}`}
            </p>
          </>
        }
      >
        <SettingsSection title="Status">
          <Card rows>
            <SettingsRow label="Presence">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground-1">
                <StatusDot color={status.color} />
                {status.label}
              </span>
            </SettingsRow>
            <SettingsRow label="Last connected">
              <ValueText>
                {device.lastConnectedAt === null
                  ? "Never"
                  : formatDateTime(device.lastConnectedAt)}
              </ValueText>
            </SettingsRow>
          </Card>
        </SettingsSection>
        {device.hardware !== null && (
          <HardwareSection hardware={device.hardware} />
        )}
        <AccessSection
          orgId={orgId}
          device={device}
          orgName={org?.name ?? "this organization"}
          canEdit={
            user !== undefined &&
            user.id === device.userId &&
            device.revokedAt === null
          }
        />
        <FoldersSection device={device} />
        <SettingsSection title="Identity">
          <Card rows>
            <SettingsRow label="Token hint">
              <CopyField className="w-56">
                <Input
                  size="sm"
                  readOnly
                  value={device.tokenHint}
                  aria-label="token hint"
                />
              </CopyField>
            </SettingsRow>
            <SettingsRow label="Paired">
              <ValueText>{formatDateTime(device.createdAt)}</ValueText>
            </SettingsRow>
            {isAdmin && (
              <SettingsRow label="Owner">
                <ValueText>{owner}</ValueText>
              </SettingsRow>
            )}
            <SettingsRow label="Organization">
              <ValueText>{org?.name ?? "This organization"}</ValueText>
            </SettingsRow>
          </Card>
        </SettingsSection>
        <SettingsSection title="Danger">
          <Card>
            <SettingsRow
              label="Revoke device"
              description="The machine loses access immediately"
              descriptionTone="strong"
            >
              {device.revokedAt === null ? (
                <Button
                  size="sm"
                  variant="ghost"
                  intent="danger"
                  disabled={pending}
                  onClick={() => setConfirming(true)}
                >
                  Revoke
                </Button>
              ) : (
                <ValueText>
                  Revoked {formatDateTime(device.revokedAt)}
                </ValueText>
              )}
            </SettingsRow>
          </Card>
        </SettingsSection>
      </SettingsPage>
      <Dialog
        open={confirming}
        onOpenChange={(open) => !pending && setConfirming(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{`Revoke ${device.name}?`}</DialogTitle>
            <DialogDescription>
              The machine loses access immediately and revoking cannot be
              undone, so pairing it again is the only way back
            </DialogDescription>
          </DialogHeader>
          <div className="pb-2" />
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              intent="danger"
              disabled={pending}
              aria-busy={pending}
              onClick={() => {
                confirmRevoke();
                setConfirming(false);
              }}
            >
              {pending ? "Revoking" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HardwareSection({ hardware }: { hardware: DeviceHardware }) {
  return (
    <SettingsSection
      title="Hardware"
      description="Reported by the device each time it connects"
    >
      <Card rows>
        {hardware.formFactor !== undefined && (
          <SettingsRow label="Type">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground-1">
              <HardwareIcon hardware={hardware} className="size-(--icon-sm)" />
              {formFactorLabels[hardware.formFactor]}
            </span>
          </SettingsRow>
        )}
        {hardwareRows(hardware).map((row) => (
          <SettingsRow key={row.label} label={row.label}>
            <span className="min-w-0 truncate text-sm text-muted-foreground-1">
              {row.value}
            </span>
          </SettingsRow>
        ))}
      </Card>
    </SettingsSection>
  );
}

function ModeSelect<T extends string>({
  items,
  value,
  className,
  disabled,
  onChange,
}: {
  items: Record<T, string>;
  value: T;
  className: string;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <MenuSelect
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next && next !== value) onChange(next as T);
      }}
    >
      <MenuSelectTrigger className={className} disabled={disabled}>
        <MenuSelectValue />
      </MenuSelectTrigger>
      <MenuSelectContent>
        {(Object.keys(items) as Array<T>).map((key) => (
          <MenuSelectItem key={key} value={key}>
            {items[key]}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}

function AccessSection({
  orgId,
  device,
  orgName,
  canEdit,
}: {
  orgId: OrgId;
  device: Device;
  orgName: string;
  canEdit: boolean;
}) {
  const setAccess = useAtomSet(setDeviceAccessAtom, { mode: "promise" });
  const setAgentAccess = useAtomSet(setDeviceAgentAccessAtom, {
    mode: "promise",
  });
  const setComputerUse = useAtomSet(setDeviceComputerUseAccessAtom, {
    mode: "promise",
  });
  const [pending, setPending] = useState(false);
  const request = {
    params: { orgId, deviceId: device.id },
    reactivityKeys: [deviceReactivityKeys.devices(orgId)],
  };
  const run = (call: Promise<unknown>, success: string, failure: string) => {
    setPending(true);
    call
      .then(() => toast.success(success))
      .catch((cause) => toast.error(errorMessage(cause, failure)))
      .finally(() => setPending(false));
  };
  return (
    <SettingsSection
      title="Access"
      description="Who can run on and message this device; per-thread requests live in each thread's options"
    >
      <Card rows>
        <SettingsRow
          label="Access"
          description={accessDescription(device.access, orgName)}
          descriptionTone="strong"
        >
          {canEdit ? (
            <ModeSelect<DeviceAccess>
              items={accessLabels}
              value={device.access}
              className="w-28"
              disabled={pending}
              onChange={(access) =>
                run(
                  setAccess({ ...request, payload: { access } }),
                  "Access updated",
                  "Could not change device access",
                )
              }
            />
          ) : (
            <ValueText>{accessLabels[device.access]}</ValueText>
          )}
        </SettingsRow>
        {device.access === "personal" && (
          <SettingsRow
            label="Agent access"
            description={agentAccessDescription(device.agentAccess)}
          >
            {canEdit ? (
              <ModeSelect<DeviceAgentAccessMode>
                items={agentAccessLabels}
                value={device.agentAccess}
                className="w-36"
                disabled={pending}
                onChange={(agentAccess) =>
                  run(
                    setAgentAccess({ ...request, payload: { agentAccess } }),
                    "Agent access updated",
                    "Could not change agent access",
                  )
                }
              />
            ) : (
              <ValueText>{agentAccessLabels[device.agentAccess]}</ValueText>
            )}
          </SettingsRow>
        )}
        {device.os === ("darwin" satisfies DeviceOs) && (
          <SettingsRow
            label="Computer use"
            description={computerUseDescription(device.computerUseAccess)}
          >
            {canEdit ? (
              <ModeSelect<DeviceAgentAccessMode>
                items={agentAccessLabels}
                value={device.computerUseAccess}
                className="w-36"
                disabled={pending}
                onChange={(computerUseAccess) =>
                  run(
                    setComputerUse({
                      ...request,
                      payload: { computerUseAccess },
                    }),
                    "Computer use updated",
                    "Could not change computer use",
                  )
                }
              />
            ) : (
              <ValueText>
                {agentAccessLabels[device.computerUseAccess]}
              </ValueText>
            )}
          </SettingsRow>
        )}
      </Card>
    </SettingsSection>
  );
}

function FoldersSection({ device }: { device: Device }) {
  const workspaces = device.workspaces ?? [];
  return (
    <SettingsSection title="Folders" description="What this device shares">
      <Card rows>
        {device.revokedAt !== null || workspaces.length === 0 ? (
          <SettingsRow
            label="No folders"
            description={
              device.revokedAt === null
                ? "Open Capy on that device to pick a project's folder"
                : "A revoked device no longer shares folders"
            }
            descriptionTone="strong"
          />
        ) : (
          workspaces.map((workspace) => (
            <WorkspaceRow key={workspace.root} workspace={workspace} />
          ))
        )}
      </Card>
    </SettingsSection>
  );
}

function WorkspaceRow({ workspace }: { workspace: DeviceWorkspace }) {
  const counts = workspaceDiffCounts(workspace);
  const parts: Array<ReactNode> = [
    ...workspace.repos,
    workspace.branch,
    counts === undefined ? undefined : (
      <span key="diff" className="shrink-0 tabular-nums">
        <span className="text-diff-add">+{counts.insertions}</span>{" "}
        <span className="text-diff-del">-{counts.deletions}</span>
      </span>
    ),
  ].filter((part) => part !== undefined);
  return (
    <SettingsRow
      label={<span className="block truncate">{workspace.root}</span>}
      descriptionTone="strong"
      description={
        workspace.missing === true
          ? "Folder moved, choose it again on the project page"
          : parts.map((part, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional
              <Fragment key={index}>
                {index > 0 ? ", " : null}
                {part}
              </Fragment>
            ))
      }
    />
  );
}
