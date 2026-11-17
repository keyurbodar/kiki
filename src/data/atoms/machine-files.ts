import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

const separator = "\0";

export const machineFileReactivityKeys = {
  turnDiff: (jamId: string) => `turn_diff:${jamId}`,
  turnCapture: (jamId: string) => `turn_capture:${jamId}`,
  drive: (orgId: string) => `volume:${orgId}`,
} as const;

export const machineFileKey = (orgId: OrgId, jamId: string, path: string) =>
  [orgId, jamId, path].join(separator);

const machineFileQuery = Atom.family((key: string) => {
  const [orgId, jamId, path] = key.split(separator) as [OrgId, string, string];
  return ApiClient.query("files", "read", {
    params: { orgId, jamId },
    query: { path },
    reactivityKeys: [
      machineFileReactivityKeys.turnDiff(jamId),
      machineFileReactivityKeys.turnCapture(jamId),
    ],
    timeToLive: "1 minute",
  });
});

/** One file read from the thread's machine, as Capy's files.read query. */
export const machineFileAtom = (orgId: OrgId, jamId: string, path: string) =>
  machineFileQuery(machineFileKey(orgId, jamId, path));

export const writeMachineFileAtom = ApiClient.mutation("files", "writeMachine");

/** The org drive listing the Copy to Drive dialog checks paths against. */
export const driveListingAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("volumes", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [machineFileReactivityKeys.drive(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const driveWriteAtom = ApiClient.mutation("volumes", "write");
