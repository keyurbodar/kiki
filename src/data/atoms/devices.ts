import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const deviceReactivityKeys = {
  devices: (orgId: string) => `device:${orgId}`,
} as const;

export const devicesAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("devices", "list", {
    params: { orgId },
    reactivityKeys: [deviceReactivityKeys.devices(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const renameDeviceAtom = ApiClient.mutation("devices", "rename");
export const setDeviceDescriptionAtom = ApiClient.mutation(
  "devices",
  "setDescription",
);
export const revokeDeviceAtom = ApiClient.mutation("devices", "revoke");
export const setDeviceAccessAtom = ApiClient.mutation("devices", "setAccess");
export const setDeviceAgentAccessAtom = ApiClient.mutation(
  "devices",
  "setAgentAccess",
);
export const setDeviceComputerUseAccessAtom = ApiClient.mutation(
  "devices",
  "setComputerUseAccess",
);
export const lookupDeviceCodeAtom = ApiClient.mutation("devices", "codeLookup");
export const approveDeviceCodeAtom = ApiClient.mutation(
  "devices",
  "codeApprove",
);
export const denyDeviceCodeAtom = ApiClient.mutation("devices", "codeDeny");

export const updateUserPreferencesAtom = ApiClient.mutation(
  "users",
  "updatePreferences",
);
