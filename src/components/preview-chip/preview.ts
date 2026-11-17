import type { PullCheck } from "@/components/checks-rows";
import { checkVerdict } from "@/components/checks-rows";

export type PreviewState = "ready" | "building" | "failed";

/** A deployment link found on the pull: a named preview or a bare URL. */
export type PreviewLink = { url: string; name: string | null };

export const isDeploymentCheck = (check: PullCheck) => {
  const name = check.name.toLowerCase();
  const url = check.detailsUrl?.toLowerCase() ?? "";
  return (
    name.includes("vercel") ||
    url.includes("vercel.com") ||
    url.includes("vercel.app") ||
    name.startsWith("workers builds:") ||
    name.startsWith("cloudflare pages") ||
    url.includes("dash.cloudflare.com")
  );
};

/** The rolled-up state of the deployment checks, or null without any. */
export const previewState = (
  checks: ReadonlyArray<PullCheck>,
): PreviewState | null => {
  const deployments = checks.filter(isDeploymentCheck);
  if (deployments.length === 0) return null;
  const verdicts = deployments.map(checkVerdict);
  if (verdicts.includes("failure")) return "failed";
  return verdicts.includes("pending") ? "building" : "ready";
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The state of the deployment checks whose name ends in this project name. */
export const namedPreviewState = (
  checks: ReadonlyArray<PullCheck>,
  name: string,
) => {
  const suffix = new RegExp(
    `[:\u2013\u2014-]\\s+${escapeRegExp(name.toLowerCase())}$`,
  );
  return previewState(
    checks.filter((check) => suffix.test(check.name.toLowerCase())),
  );
};

const dashboardHosts = [
  "vercel.com",
  "www.vercel.com",
  "dash.cloudflare.com",
  "app.pulumi.com",
];

const isDashboardUrl = (url: string) => {
  try {
    return dashboardHosts.includes(new URL(url).hostname.toLowerCase());
  } catch {
    return true;
  }
};

/** The first deployment check that links to the deployment itself. */
export const previewHrefFromChecks = (checks: ReadonlyArray<PullCheck>) =>
  checks.find(
    (check) =>
      isDeploymentCheck(check) &&
      check.detailsUrl !== null &&
      !isDashboardUrl(check.detailsUrl),
  )?.detailsUrl ?? null;

export const previewLabel = (state: PreviewState | null) =>
  state === "building"
    ? "Preview building"
    : state === "failed"
      ? "Preview failed"
      : "Preview";

export const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export type PreviewSummary = {
  checks: ReadonlyArray<PullCheck>;
  state: PreviewState | null;
  links: ReadonlyArray<PreviewLink>;
  href: string | null;
};

export const previewSummary = (
  checks: ReadonlyArray<PullCheck>,
  links: ReadonlyArray<PreviewLink>,
): PreviewSummary => ({
  checks,
  state: previewState(checks),
  links,
  href: links[0]?.url ?? previewHrefFromChecks(checks),
});

export const openPreview = (url: string) =>
  window.open(url, "_blank", "noopener,noreferrer");
