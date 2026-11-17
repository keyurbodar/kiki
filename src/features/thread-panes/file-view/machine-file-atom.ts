import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export type MachineFileKey = {
  orgId: string;
  jamId: string;
  path: string;
  machineId?: string;
};

export const machineFileKey = ({
  orgId,
  jamId,
  path,
  machineId,
}: MachineFileKey) => [orgId, jamId, path, machineId ?? ""].join("\u0000");

const machineFileQuery = Atom.family((key: string) => {
  const [orgId = "", jamId = "", path = "", machineId = ""] =
    key.split("\u0000");
  return ApiClient.query("files", "read", {
    params: { orgId, jamId },
    query: machineId === "" ? { path } : { path, machineId },
    timeToLive: queryTimeToLive,
  });
});

export const machineFileAtom = (key: MachineFileKey) =>
  machineFileQuery(machineFileKey(key));
