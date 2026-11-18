import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { threadSessionsAtom } from "@/data/atoms/sessions";
import { threadMachinesAtom } from "@/data/atoms/setup";
import type {
  CommandEntry,
  MachineEntry,
  TerminalEntry,
} from "./thread-options";

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const text = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const rows = (value: unknown, key: string): unknown[] => {
  if (Array.isArray(value)) return value;
  const inner = record(value)[key];
  return Array.isArray(inner) ? inner : [];
};

/** Capy's four machine states, from the status the list endpoint reports. */
const stateOf = (status: string | null): MachineEntry["state"] => {
  switch (status) {
    case "running":
      return "awake";
    case "sleeping":
      return "asleep";
    case "stopped":
      return "gone";
    default:
      return "creating";
  }
};

const statusOf = (
  state: MachineEntry["state"],
): { label: string; color: MachineEntry["statusColor"] } => {
  switch (state) {
    case "awake":
      return { label: "Awake", color: "success" };
    case "asleep":
      return { label: "Asleep", color: "neutral" };
    case "gone":
      return { label: "Stopped", color: "neutral" };
    default:
      return { label: "Waking", color: "info" };
  }
};

/** The shells the thread opened on this machine, each of which opens as a tab. */
const terminalsOf = (
  sessions: unknown,
  machineId: string,
): ReadonlyArray<TerminalEntry> =>
  rows(sessions, "sessions").flatMap((value) => {
    const session = record(value);
    const clientId = text(session.clientId);
    if (
      clientId === null ||
      text(session.kind) !== "terminal" ||
      text(session.machineId) !== machineId
    ) {
      return [];
    }
    return [{ id: clientId, label: text(session.label) ?? "Shell" }];
  });

/**
 * The project's launchable commands, which the machine carries with its setup:
 * one row per repository command, named as the setup names it.
 */
const commandsOf = (machine: JsonRecord): ReadonlyArray<CommandEntry> =>
  rows(machine.setup, "repositories").flatMap((value) => {
    const repo = record(value);
    const repository = text(repo.repository) ?? text(repo.repoFullName);
    if (repository === null) return [];
    return rows(repo.commands, "commands").flatMap((entry) => {
      const command = record(entry);
      const name = text(command.name);
      const line = text(command.command);
      if (name === null || line === null || line === "") return [];
      return [{ name, command: line, repository }];
    });
  });

/**
 * The machine section of the tab menu, from `machines.list` and the thread's
 * sessions. One entry per machine the thread holds; a thread with no machine
 * gets an empty list, which renders no section.
 */
export function useThreadMachineEntries(
  orgId: OrgId | undefined,
  threadId: JamId,
): ReadonlyArray<MachineEntry> {
  // The route resolves the org from the session read, so a missing one is the
  // pre-resolution frame; the same empty key the timeline and edit draft use.
  const org = (orgId ?? "") as OrgId;
  const machines = useAtomValue(threadMachinesAtom(org, threadId));
  const sessions = useAtomValue(threadSessionsAtom(org, threadId));
  return useMemo(() => {
    if (orgId === undefined) return [];
    const machineRows = AsyncResult.isSuccess(machines)
      ? rows(machines.value, "machines")
      : [];
    const sessionValue = AsyncResult.isSuccess(sessions)
      ? sessions.value
      : undefined;
    return machineRows.flatMap((value) => {
      const machine = record(value);
      const machineId = text(machine.id);
      if (machineId === null) return [];
      const state = stateOf(text(machine.status) ?? text(machine.state));
      const status = statusOf(state);
      const terminals = terminalsOf(sessionValue, machineId);
      const commands = commandsOf(machine);
      return [
        {
          machineId,
          state,
          statusLabel: status.label,
          statusColor: status.color,
          device: machine.kind === "device",
          ...(terminals.length === 0 ? {} : { terminals }),
          ...(commands.length === 0 ? {} : { commands }),
        },
      ];
    });
  }, [orgId, machines, sessions]);
}
