import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { idleAtom } from "@/data/atoms/idle.ts";
import { projectsAtom } from "@/data/atoms/projects.ts";
import { organizationsAtom } from "@/data/atoms/session.ts";
import {
  familyKey,
  marketplaceAtom,
  mcpServersAtom,
  mcpServerToolsAtom,
  pluginInstallationAtom,
  pluginInstallationsAtom,
  pluginVersionAtom,
} from "./atoms.ts";
import {
  toInstallation,
  toInstallationDetail,
  toMarketplacePlugin,
  toServer,
  toServerTools,
  toVersion,
} from "./normalize.ts";
import type {
  InstalledPlugin,
  InstalledPluginDetail,
  MarketplacePlugin,
  McpServer,
  McpServerTools,
  PluginVersion,
} from "./types.ts";

export type Loadable<A> =
  | { readonly status: "loading" }
  | { readonly status: "failed" }
  | { readonly status: "ready"; readonly value: A };

const loadable = <A>(
  result: AsyncResult.AsyncResult<unknown, unknown>,
  map: (value: unknown) => A,
): Loadable<A> =>
  AsyncResult.isSuccess(result)
    ? { status: "ready", value: map(result.value) }
    : AsyncResult.isFailure(result)
      ? { status: "failed" }
      : { status: "loading" };

const readyValue = <A>(state: Loadable<A>) =>
  state.status === "ready" ? state.value : undefined;

const list =
  <A>(map: (raw: unknown) => A) =>
  (value: unknown) =>
    Array.isArray(value) ? value.map(map) : [];

const nullable =
  <A>(map: (raw: unknown) => A) =>
  (value: unknown) =>
    value === null || value === undefined ? null : map(value);

/** The organizations read, so a page can tell a pending one from a failed one. */
export const useActiveOrgRead = () => useAtomValue(organizationsAtom);

export const useActiveOrgId = (): OrgId | undefined =>
  readyValue(
    loadable(
      useAtomValue(organizationsAtom),
      (value) => value as ReadonlyArray<{ readonly id: OrgId }>,
    ),
  )?.[0]?.id;

const idle = idleAtom();

export const useMcpServersState = (
  orgId: OrgId | undefined,
): Loadable<ReadonlyArray<McpServer>> =>
  loadable(
    useAtomValue(orgId === undefined ? idle : mcpServersAtom(orgId)),
    list(toServer),
  );

export const useMcpServers = (orgId: OrgId | undefined) =>
  readyValue(useMcpServersState(orgId));

export const usePluginInstallationsState = (
  orgId: OrgId | undefined,
): Loadable<ReadonlyArray<InstalledPlugin>> =>
  loadable(
    useAtomValue(orgId === undefined ? idle : pluginInstallationsAtom(orgId)),
    list(toInstallation),
  );

export const usePluginInstallations = (
  orgId: OrgId | undefined,
): ReadonlyArray<InstalledPlugin> | undefined =>
  readyValue(usePluginInstallationsState(orgId));

export const useMarketplace = (
  orgId: OrgId | undefined,
): ReadonlyArray<MarketplacePlugin> | undefined =>
  readyValue(
    loadable(
      useAtomValue(orgId === undefined ? idle : marketplaceAtom(orgId)),
      list(toMarketplacePlugin),
    ),
  );

export const usePluginInstallation = (
  orgId: OrgId,
  installationId: string,
): Loadable<InstalledPluginDetail | null> =>
  loadable(
    useAtomValue(pluginInstallationAtom(familyKey(orgId, installationId))),
    nullable(toInstallationDetail),
  );

export const usePluginVersion = (
  orgId: OrgId,
  versionId: string,
): Loadable<PluginVersion | null> =>
  loadable(
    useAtomValue(pluginVersionAtom(familyKey(orgId, versionId))),
    nullable(toVersion),
  );

export const useServerTools = (
  orgId: OrgId,
  serverId: string,
): McpServerTools | null | undefined =>
  readyValue(
    loadable(
      useAtomValue(mcpServerToolsAtom(familyKey(orgId, serverId))),
      toServerTools,
    ),
  );

export const useProjects = (orgId: OrgId | undefined) =>
  readyValue(
    loadable(
      useAtomValue(orgId === undefined ? idle : projectsAtom(orgId)),
      (value) =>
        value as ReadonlyArray<{ readonly id: string; readonly name: string }>,
    ),
  );
