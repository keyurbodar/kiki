import type {
  CloudAccessCheck,
  CloudAccessTarget,
  CloudProvider,
} from "@/data/api/schemas/cloud-access";
import { providers } from "./providers";

export type ProviderStatus = "not_connected" | "check_failed" | "connected";

export const providerStatus = (
  targets: ReadonlyArray<Pick<CloudAccessTarget, "lastCheck">>,
): ProviderStatus => {
  if (targets.length === 0) return "not_connected";
  return targets.some((target) => target.lastCheck?.outcome === "failed")
    ? "check_failed"
    : "connected";
};

export type CheckStatus = "machine" | "not_checked" | "passed" | "failed";

export const checkStatus = (
  provider: CloudProvider,
  check: Pick<CloudAccessCheck, "outcome"> | null,
): CheckStatus => {
  if (!providers[provider].checkedByApi) return "machine";
  if (check === null) return "not_checked";
  return check.outcome === "ok" ? "passed" : "failed";
};

export const projectCountLabel = (count: number) =>
  count === 1 ? "1 project" : `${count} projects`;

export const projectsCardLabel = (provider: CloudProvider, count: number) => {
  const noun = provider === "oidc" ? "target" : "project";
  if (count === 0) return provider === "oidc" ? "Targets" : "Projects";
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
};
