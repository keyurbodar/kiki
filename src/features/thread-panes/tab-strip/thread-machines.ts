import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { idleAtom } from "@/data/atoms/idle";
import {
  idleMachinePreviewsAtom,
  idleMachineSessionsAtom,
  idleThreadMachinesAtom,
  machinePreviewsAtom,
  machineSessionsAtom,
  projectSetupAtom,
  threadMachinesAtom,
} from "@/data/atoms/setup";
import type { PaneTab } from "./tabs";
import type {
  CommandEntry,
  MachineEntry,
  ServiceEntry,
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

/** The shells open on this machine, each of which opens as a tab. */
const terminalsOf = (sessions: unknown): ReadonlyArray<TerminalEntry> =>
  rows(sessions, "sessions").flatMap((value) => {
    const session = record(value);
    const id = text(session.id);
    if (id === null || text(session.kind) !== "shell") return [];
    return [{ id, label: text(session.label) ?? "Shell" }];
  });

/** The previews running on this machine, each of which opens as a tab. */
const servicesOf = (
  previews: unknown,
  machineId: string,
  repository: string,
): ReadonlyArray<ServiceEntry> =>
  rows(previews, "previews").flatMap((value) => {
    const preview = record(value);
    const label = text(preview.label);
    if (label === null || text(preview.machineId) !== machineId) return [];
    const running = text(preview.status) === "running";
    const port = Number(text(preview.port));
    return [
      {
        name: label,
        repository,
        statusLabel: running ? "Running" : "Stopped",
        statusColor: running ? "success" : "neutral",
        // A row without its tab opened an empty panel: the menu listed the
        // service and the press did nothing. The port is what names it.
        ...(Number.isInteger(port) && port > 0
          ? {
              tab: {
                kind: "service_preview",
                machineId,
                port,
                title: label,
              } satisfies PaneTab,
            }
          : {}),
      },
    ];
  });

/**
 * The project's launchable commands, from the setup the project carries: one
 * row per repository command, named as the setup names it. `machines.list`
 * carries no setup, so the project's own setup read is the producer.
 */
const commandsOf = (setup: unknown): ReadonlyArray<CommandEntry> =>
  rows(setup, "repositories").flatMap((value) => {
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

const noSetupAtom = idleAtom<unknown>();

export type MachineBrowserSession = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
};

/**
 * The browser session open on the thread's machine. Capy's `Browser` row opens
 * a tab for the session the machine already has rather than creating one, and
 * `machines.sessions` is the read that carries it.
 */
export function useMachineBrowserSession(
  orgId: OrgId | undefined,
  threadId: JamId,
): MachineBrowserSession | undefined {
  const machines = useAtomValue(
    orgId === undefined
      ? idleThreadMachinesAtom
      : threadMachinesAtom(orgId, threadId),
  );
  const firstMachineId =
    AsyncResult.isSuccess(machines) &&
    rows(machines.value, "machines").length > 0
      ? (text(record(rows(machines.value, "machines")[0]).id) ?? "")
      : "";
  const sessions = useAtomValue(
    orgId === undefined
      ? idleMachineSessionsAtom
      : machineSessionsAtom(orgId, threadId, firstMachineId),
  );
  return useMemo(() => {
    if (orgId === undefined || !AsyncResult.isSuccess(sessions))
      return undefined;
    for (const value of rows(sessions.value, "sessions")) {
      const session = record(value);
      const id = text(session.id);
      const url = text(session.url);
      if (id === null || url === null || text(session.kind) !== "browser") {
        continue;
      }
      return {
        id,
        url,
        title: text(session.title) ?? text(session.label) ?? url,
      };
    }
    return undefined;
  }, [orgId, sessions]);
}

/**
 * The machine section of the tab menu, from `machines.list` and the thread's
 * sessions. One entry per machine the thread holds; a thread with no machine
 * gets an empty list, which renders no section.
 */
export function useThreadMachineEntries(
  orgId: OrgId | undefined,
  threadId: JamId,
  projectId?: string | undefined,
): ReadonlyArray<MachineEntry> {
  // The route resolves the org from the session read, so a missing one is the
  // pre-resolution frame: there is no machine list to read until it arrives.
  const machines = useAtomValue(
    orgId === undefined
      ? idleThreadMachinesAtom
      : threadMachinesAtom(orgId, threadId),
  );
  const previews = useAtomValue(
    orgId === undefined
      ? idleMachinePreviewsAtom
      : machinePreviewsAtom(orgId, threadId),
  );
  // A thread holds one machine in practice, and a hook cannot run per row, so
  // the first machine's shells are the ones the menu lists.
  const firstMachineId =
    AsyncResult.isSuccess(machines) &&
    rows(machines.value, "machines").length > 0
      ? (text(record(rows(machines.value, "machines")[0]).id) ?? "")
      : "";
  const sessions = useAtomValue(
    orgId === undefined
      ? idleMachineSessionsAtom
      : machineSessionsAtom(orgId, threadId, firstMachineId),
  );
  // A thread with no project has no setup to read, and a setup read keyed on an
  // empty project or org id would subscribe to a key nothing fills.
  const setup = useAtomValue(
    projectId === undefined || orgId === undefined
      ? noSetupAtom
      : projectSetupAtom(orgId, projectId),
  );
  return useMemo(() => {
    if (orgId === undefined) return [];
    const machineRows = AsyncResult.isSuccess(machines)
      ? rows(machines.value, "machines")
      : [];
    const previewValue = AsyncResult.isSuccess(previews)
      ? previews.value
      : undefined;
    const sessionValue = AsyncResult.isSuccess(sessions)
      ? sessions.value
      : undefined;
    const setupValue = AsyncResult.isSuccess(setup) ? setup.value : undefined;
    return machineRows.flatMap((value) => {
      const machine = record(value);
      const machineId = text(machine.id);
      if (machineId === null) return [];
      const state = stateOf(text(machine.status) ?? text(machine.state));
      const status = statusOf(state);
      const repository = text(machine.repoFullName) ?? "";
      const terminals =
        machineId === firstMachineId ? terminalsOf(sessionValue) : [];
      const services = servicesOf(previewValue, machineId, repository);
      const commands = commandsOf(setupValue);
      return [
        {
          machineId,
          state,
          statusLabel: status.label,
          statusColor: status.color,
          device: machine.kind === "device",
          ...(terminals.length === 0 ? {} : { terminals }),
          ...(services.length === 0 ? {} : { services }),
          ...(commands.length === 0 ? {} : { commands }),
        },
      ];
    });
  }, [orgId, machines, previews, sessions, setup, firstMachineId]);
}
