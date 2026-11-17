import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const threadDeviceKeys = {
  usage: (jamId: string) => `jam_usage:${jamId}`,
  jamEvents: (jamId: string) => `jam_event:${jamId}`,
  jam: (jamId: string) => `jam:${jamId}`,
  deviceAccess: (orgId: string) => `device_access:${orgId}`,
  agentAccess: (orgId: string) => `device_agent_access:${orgId}`,
  myCompactAt: (orgId: string) => `my_compact_at:${orgId}`,
} as const;

export const threadUsageAtom = Atom.family((key: string) => {
  const [orgId, jamId] = key.split("/") as [string, string];
  return ApiClient.query("jams", "usage", {
    params: { orgId, jamId },
    reactivityKeys: [
      threadDeviceKeys.usage(jamId),
      threadDeviceKeys.jamEvents(jamId),
    ],
    timeToLive: queryTimeToLive,
  });
});

export const deviceAccessListAtom = Atom.family((key: string) => {
  const [orgId, deviceId] = key.split("/") as [string, string];
  return ApiClient.query("devices", "listAccess", {
    params: { orgId, deviceId },
    reactivityKeys: [threadDeviceKeys.deviceAccess(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const threadAgentAccessAtom = Atom.family((key: string) => {
  const [orgId, threadId] = key.split("/") as [string, string];
  return ApiClient.query("devices", "listThreadAgentAccess", {
    params: { orgId, threadId },
    reactivityKeys: [
      threadDeviceKeys.agentAccess(orgId),
      threadDeviceKeys.jamEvents(threadId),
    ],
    timeToLive: queryTimeToLive,
  });
});

export const grantDeviceAccessAtom = ApiClient.mutation(
  "devices",
  "grantAccess",
);
export const denyDeviceAccessAtom = ApiClient.mutation("devices", "denyAccess");
export const revokeDeviceAccessAtom = ApiClient.mutation(
  "devices",
  "revokeAccess",
);
export const withdrawDeviceAccessAtom = ApiClient.mutation(
  "devices",
  "withdrawAccess",
);
export const grantAgentAccessAtom = ApiClient.mutation(
  "devices",
  "grantAgentAccess",
);
export const denyAgentAccessAtom = ApiClient.mutation(
  "devices",
  "denyAgentAccess",
);
export const revokeAgentAccessAtom = ApiClient.mutation(
  "devices",
  "revokeAgentAccess",
);
export const grantComputerUseAtom = ApiClient.mutation(
  "devices",
  "grantComputerUse",
);
export const denyComputerUseAtom = ApiClient.mutation(
  "devices",
  "denyComputerUse",
);
export const revokeComputerUseAtom = ApiClient.mutation(
  "devices",
  "revokeComputerUse",
);
export const setThreadCompactAtAtom = ApiClient.mutation(
  "jams",
  "setCompactAt",
);
export const upsertMyCompactAtAtom = ApiClient.mutation(
  "models",
  "upsertMyCompactAt",
);
export const openHandoffAtom = ApiClient.mutation("handoffs", "open");
export const wakeMachineAtom = ApiClient.mutation("machines", "wake");
