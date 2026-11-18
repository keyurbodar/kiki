import { useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids";
import { captainsAtom } from "@/data/atoms/captains";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { projectsAtom } from "@/data/atoms/projects";
import { ApiClient } from "@/data/client/ApiClient";
import type { DriveScopeNames } from "../lib/scopes";
import { resultValue } from "./session";

interface Named {
  readonly id: string;
  readonly name: string;
}

/** Reads `{ id, name }` rows out of a still-undecoded list response. */
const namedRows = (value: unknown): ReadonlyArray<Named> => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "items" in value
      ? (value as { items: unknown }).items
      : [];
  return (Array.isArray(rows) ? rows : []).flatMap((row: unknown) => {
    if (typeof row !== "object" || row === null) return [];
    const { id, name } = row as { id?: unknown; name?: unknown };
    return typeof id === "string" && typeof name === "string"
      ? [{ id, name }]
      : [];
  });
};

const automationsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("automations", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [`automations:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

/** Names the drive root labels scopes with; a list that fails reads as empty. */
export function useDriveNames(
  orgId: OrgId,
  organizationName: string | undefined,
  userId: string | undefined,
): DriveScopeNames {
  const projects = resultValue(useAtomValue(projectsAtom(orgId)));
  const captains = resultValue(useAtomValue(captainsAtom(orgId)));
  const automations = resultValue(useAtomValue(automationsAtom(orgId)));
  return {
    organizationName,
    userId,
    projects: (projects ?? []).map((project) => ({
      id: project.id as string,
      name: project.name,
    })),
    captains: (captains ?? []).map((captain) => ({
      id: captain.id,
      name: captain.face.name,
      avatar: captain.face.avatar,
    })),
    automations: namedRows(automations),
  };
}
