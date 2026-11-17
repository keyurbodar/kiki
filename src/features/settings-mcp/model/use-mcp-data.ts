import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { OrgId } from "@/data/api/schemas/ids.ts";
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
import type {
  InstalledPlugin,
  InstalledPluginDetail,
  MarketplacePlugin,
  McpServer,
  McpServerTools,
  PluginVersion,
} from "./types.ts";

const resultValue = <A>(result: AsyncResult.AsyncResult<unknown, unknown>) =>
  AsyncResult.isSuccess(result) ? (result.value as A) : undefined;

export const useActiveOrgId = (): OrgId | undefined =>
  resultValue<ReadonlyArray<{ readonly id: OrgId }>>(
    useAtomValue(organizationsAtom),
  )?.[0]?.id;

const disabledOrg = "" as OrgId;

export const useMcpServers = (orgId: OrgId | undefined) =>
  resultValue<ReadonlyArray<McpServer>>(
    useAtomValue(mcpServersAtom(orgId ?? disabledOrg)),
  );

export const usePluginInstallations = (orgId: OrgId | undefined) =>
  resultValue<ReadonlyArray<InstalledPlugin>>(
    useAtomValue(pluginInstallationsAtom(orgId ?? disabledOrg)),
  );

export const useMarketplace = (orgId: OrgId | undefined) =>
  resultValue<ReadonlyArray<MarketplacePlugin>>(
    useAtomValue(marketplaceAtom(orgId ?? disabledOrg)),
  );

export const usePluginInstallation = (orgId: OrgId, installationId: string) =>
  useAtomValue(
    pluginInstallationAtom(familyKey(orgId, installationId)),
  ) as AsyncResult.AsyncResult<InstalledPluginDetail | null, unknown>;

export const usePluginVersion = (orgId: OrgId, versionId: string) =>
  useAtomValue(
    pluginVersionAtom(familyKey(orgId, versionId)),
  ) as AsyncResult.AsyncResult<PluginVersion | null, unknown>;

export const useServerTools = (orgId: OrgId, serverId: string) =>
  resultValue<McpServerTools | null>(
    useAtomValue(mcpServerToolsAtom(familyKey(orgId, serverId))),
  );

export const useProjects = (orgId: OrgId | undefined) =>
  resultValue<ReadonlyArray<{ readonly id: string; readonly name: string }>>(
    useAtomValue(projectsAtom(orgId ?? disabledOrg)),
  );
