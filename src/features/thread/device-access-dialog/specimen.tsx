import {
  ThreadCostBadgeControl,
  type ThreadUsage,
} from "@/features/thread/cost-badge";
import { DeviceAccessGate } from "@/features/thread/device-access-gate";
import {
  DeviceAccessOwnerTakeoverView,
  DeviceAccessRequesterTakeoverView,
  DevicePermissionTakeoverView,
} from "@/features/thread/device-access-takeover";
import {
  DeviceChip,
  type ThreadDevice,
  type ThreadMachine,
} from "@/features/thread/device-chip";
import { DeviceOfflineStateView } from "@/features/thread/device-offline-state";
import { GrantRepoAccessDialog } from "@/features/thread/handoff-dialog";
import { MachineWakeButton } from "@/features/thread/machine-controls";
import { ThreadCompactAtDialog } from "@/features/thread/thread-compact-at-dialog";
import { DeviceAccessDialogView } from "./device-access-dialog";
import { DeviceAccessList, DeviceAgentAccessList } from "./device-access-lists";

export const THREAD_DEVICE_SPECIMEN_STATES = [
  "cost",
  "device-chip",
  "device-access",
  "device-access-cloud",
  "takeovers",
  "gate",
  "offline",
  "compact-at",
  "handoff",
] as const;

export type ThreadDeviceSpecimenState =
  (typeof THREAD_DEVICE_SPECIMEN_STATES)[number];

const model = (label: string, credits: number) => ({
  entryId: label,
  label,
  unbilled: false,
  credentialName: null,
  credits,
  tokenFeeCredits: 0,
});

const keyed = (label: string, credits: number) => ({
  ...model(label, credits),
  unbilled: true,
  credentialName: "Personal key",
});

export const sampleThreadUsage: ThreadUsage = {
  members: [
    {
      jamId: "jam_sample_lead",
      familyId: "jam_sample_lead",
      usage: { totalCredits: 80, vmCredits: 60 },
      keyCredits: 4000,
      models: [model("Sample model", 20), keyed("Sample model", 4000)],
      images: [],
    },
    {
      jamId: "jam_sample_checkout",
      familyId: "jam_sample_checkout",
      usage: { totalCredits: 0, vmCredits: 0 },
      keyCredits: 3160,
      models: [keyed("Sample model", 3160)],
      images: [],
    },
    {
      jamId: "jam_sample_research",
      familyId: "jam_sample_research",
      usage: { totalCredits: 40, vmCredits: 40 },
      keyCredits: 1540,
      models: [keyed("Sample model", 1540)],
      images: [],
    },
  ],
  crew: [
    {
      jamId: "jam_sample_checkout",
      title: "Build checkout flow for the web store",
    },
    { jamId: "jam_sample_research", title: "Research pricing pages and plans" },
  ],
};

export const sampleDevice: ThreadDevice = {
  deviceId: "device_sample_laptop",
  name: "studio",
  rootJamId: "jam_sample_lead",
  workspaceRoot: "/home/alex/projects/acme-web",
  workspaceKind: "worktree",
  viewerAccess: "owner",
  ownerName: "Alex Morgan",
};

const connected: ThreadMachine = {
  state: "running",
  stateChangedAt: null,
  device: { connected: true },
  attachments: [{ jamId: "jam_sample_lead", checkpointStaged: true }],
};

const noop = () => {};

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-start justify-center bg-background p-(--spacing-page-padding) font-sans text-foreground">
      {children}
    </div>
  );
}

export function ThreadDeviceSpecimen({
  state,
}: {
  state: ThreadDeviceSpecimenState;
}) {
  switch (state) {
    case "cost":
      return (
        <Stage>
          <ThreadCostBadgeControl
            threadId="jam_sample_lead"
            usage={sampleThreadUsage}
            defaultOpen
          />
        </Stage>
      );
    case "device-chip":
      return (
        <Stage>
          <div className="flex items-center gap-3">
            <DeviceChip
              machine={connected}
              device={sampleDevice}
              popoverDefaultOpen
            />
            <MachineWakeButton
              lifetime={{
                jamId: "jam_sample_lead",
                machine: null,
                wake: noop,
                waking: false,
              }}
            />
          </div>
        </Stage>
      );
    case "device-access":
      return (
        <Stage>
          <DeviceAccessDialogView
            device={sampleDevice}
            open
            onOpenChange={noop}
            messageAccess={<DeviceAccessList rows={[]} />}
            agentAccess={<DeviceAgentAccessList rows={[]} />}
          />
        </Stage>
      );
    case "device-access-cloud":
      return (
        <Stage>
          <DeviceAccessDialogView
            open
            onOpenChange={noop}
            agentAccess={<DeviceAgentAccessList rows={[]} />}
          />
        </Stage>
      );
    case "takeovers":
      return (
        <Stage>
          <div className="flex w-full max-w-xl flex-col gap-6">
            <DeviceAccessOwnerTakeoverView
              member="Jordan Lee"
              deviceName="studio"
              text="Can you also add retries to the sync job, with a test for the third attempt?"
              fileCount={2}
              onGrant={noop}
              onDeny={noop}
              onDismiss={noop}
            />
            <DevicePermissionTakeoverView
              capability="execution"
              deviceName="studio"
              toolName="bash"
              callLabel="Run the test suite"
              callDetail="/home/alex/projects/acme-web"
              onGrant={noop}
              onAlways={noop}
              onDeny={noop}
              onDismiss={noop}
            />
            <DeviceAccessRequesterTakeoverView
              owner="Alex"
              deviceName="studio"
              text="Please rerun the build once the cache is cleared."
              onWithdraw={noop}
            />
          </div>
        </Stage>
      );
    case "gate":
      return (
        <Stage>
          <div className="flex w-full max-w-xl flex-col gap-6">
            <DeviceAccessGate device={sampleDevice} status="requested" />
            <DeviceAccessGate
              device={sampleDevice}
              status="revoked"
              stop={{ onStop: noop }}
            />
          </div>
        </Stage>
      );
    case "offline":
      return (
        <Stage>
          <DeviceOfflineStateView
            device={sampleDevice}
            canMove
            moving={false}
          />
        </Stage>
      );
    case "compact-at":
      return (
        <Stage>
          <ThreadCompactAtDialog
            orgId="org_sample_acme"
            jamId="jam_sample_lead"
            compactAt={160_000}
            defaultCompactAt={160_000}
            windowTokens={200_000}
            model="sample-model"
            onClose={noop}
          />
        </Stage>
      );
    case "handoff":
      return (
        <Stage>
          <GrantRepoAccessDialog
            jamId="jam_sample_lead"
            repos={["acme/web", "acme/api"]}
            onOpenChange={noop}
            isAdmin
            onGrant={noop}
          />
        </Stage>
      );
  }
}
