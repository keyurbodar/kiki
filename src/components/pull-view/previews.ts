import type { PullComment } from "@/components/activity/activity-model";
import { type CheckRow, checkVerdict } from "./pull-model";

export type PreviewState = "ready" | "building" | "failed";

export type PreviewLink = {
  readonly url: string;
};

export type PreviewDeployment = {
  readonly name: string;
  readonly state: PreviewState;
};

const consoleHosts = [
  "vercel.com",
  "www.vercel.com",
  "dash.cloudflare.com",
  "app.pulumi.com",
];

const previewHostSuffixes = [
  ".preview.capy.ai",
  ".vercel.app",
  ".netlify.app",
  ".pages.dev",
  ".workers.dev",
  ".up.railway.app",
  ".onrender.com",
  ".fly.dev",
  ".amplifyapp.com",
  ".web.app",
  ".firebaseapp.com",
  ".azurestaticapps.net",
  ".herokuapp.com",
];

export const previewHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const isConsoleHost = (host: string) => consoleHosts.includes(host);

const isPreviewHost = (host: string) =>
  previewHostSuffixes.some((suffix) => host.endsWith(suffix));

const isGithubHost = (host: string) =>
  host === "github.com" || host.endsWith(".github.com");

const isDeploymentCheck = (check: CheckRow): boolean => {
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

const deploymentChecks = (checks: ReadonlyArray<CheckRow>) =>
  checks.filter(isDeploymentCheck);

/**
 * The deployment state a pull's checks report: a failing deployment check wins
 * over one still building, and neither leaves the chip grey. A pull with no
 * deployment check answers null, which renders no chip before its first deploy.
 */
export const previewState = (
  checks: ReadonlyArray<CheckRow>,
): PreviewState | null => {
  const deployments = deploymentChecks(checks);
  if (deployments.length === 0) return null;
  const verdicts = deployments.map(checkVerdict);
  if (verdicts.includes("failure")) return "failed";
  if (verdicts.includes("pending")) return "building";
  return "ready";
};

/**
 * The deployment a single-preview chip opens: the first deployment check's run
 * URL, skipping the provider consoles, which report a build rather than serve
 * the preview.
 */
export const previewHref = (checks: ReadonlyArray<CheckRow>): string | null => {
  for (const check of deploymentsWithUrl(checks)) {
    const host = previewHostname(check.detailsUrl);
    if (host === null || isConsoleHost(host)) continue;
    return check.detailsUrl;
  }
  return null;
};

const deploymentsWithUrl = (checks: ReadonlyArray<CheckRow>) =>
  deploymentChecks(checks).filter(
    (check): check is CheckRow & { detailsUrl: string } =>
      check.detailsUrl !== null,
  );

/** "Vercel – web" names the deployment "web". */
const serviceName = (checkName: string): string | null => {
  const match = /^[^:\u2013\u2014-]+[:\u2013\u2014-]\s*(.+)$/.exec(checkName);
  const name = match?.[1]?.trim() ?? "";
  return name === "" ? null : name;
};

/**
 * One preview's own deployment, matched by the host it serves: the row's name
 * comes from the check that built it, and so does its state.
 */
export const previewDeployment = (
  checks: ReadonlyArray<CheckRow>,
  url: string,
): PreviewDeployment | undefined => {
  const host = previewHostname(url);
  if (host === null) return undefined;
  for (const check of deploymentsWithUrl(checks)) {
    if (previewHostname(check.detailsUrl) !== host) continue;
    const state = previewState([check]);
    return {
      name: serviceName(check.name) ?? host,
      state: state ?? "ready",
    };
  }
  return undefined;
};

const markdownLink =
  /(?<!!)\[([^[\]]{1,200})\]\((https?:\/\/[^\s<>()\]}]{1,2000})\)/gi;
const anchorLink =
  /<a\s[^<>]{0,500}?href=["'](https?:\/\/[^"'\s<>]{1,2000})["'][^<>]{0,500}>([^<]{0,200})<\/a>/gi;
const bareUrl = /https?:\/\/[^\s<>()\]}"']+/gi;
const labelledUrl =
  /^(?:[ \t>#*_|-]|<[^\n]*>)*(?:branch preview url|preview url|link to your preview)(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(https?:\/\/[^\s<>()\]}"',]+)/gim;
const trailingPunctuation = "),.;!?*";

const trimUrl = (url: string): string => {
  let end = url.length;
  while (end > 0 && trailingPunctuation.includes(url.charAt(end - 1))) end--;
  return url.slice(0, end);
};

const labelPriority = (label: string): number => {
  const text = label.trim().toLowerCase();
  if (text.includes("branch preview")) return 0;
  if (text.includes("preview")) return 1;
  return -1;
};

type Found = { readonly url: string; readonly priority: number };

const collect = (
  comments: ReadonlyArray<PullComment>,
): ReadonlyArray<PreviewLink> => {
  const found = new Map<string, Found>();
  const add = (raw: string, priority: number, labelled = false) => {
    const url = trimUrl(raw);
    const host = previewHostname(url);
    if (host === null || isConsoleHost(host) || isGithubHost(host)) return;
    if (!labelled && !isPreviewHost(host)) return;
    const existing = found.get(host);
    if (existing !== undefined && existing.priority <= priority) return;
    found.set(host, { url, priority });
  };
  const bots = comments.filter((comment) => comment.authorIsBot);
  for (const comment of [...bots, ...comments.filter((c) => !c.authorIsBot)]) {
    if (comment.kind !== "issue") continue;
    const body = comment.bodyMd;
    for (const match of body.matchAll(labelledUrl)) add(match[1] ?? "", 0);
    for (const match of body.matchAll(markdownLink)) {
      const label = labelPriority(match[1] ?? "");
      add(
        match[2] ?? "",
        label >= 0 ? label : comment.authorIsBot ? 2 : 3,
        label >= 0 && comment.authorIsBot,
      );
    }
    for (const match of body.matchAll(anchorLink)) {
      const label = labelPriority(match[2] ?? "");
      add(
        match[1] ?? "",
        label >= 0 ? label : comment.authorIsBot ? 2 : 3,
        label >= 0 && comment.authorIsBot,
      );
    }
    for (const match of body.matchAll(bareUrl)) {
      add(match[0], comment.authorIsBot ? 2 : 3);
    }
  }
  return [...found.values()]
    .sort((left, right) => left.priority - right.priority)
    .map((entry) => ({ url: entry.url }));
};

/**
 * The previews a pull's conversation links to. Deployment bots paste their URLs
 * into comments and nowhere else, so the links come from comment bodies, and a
 * hostname only counts when it is one of the providers' own preview domains.
 */
export const previewLinks = (
  comments: ReadonlyArray<PullComment>,
): ReadonlyArray<PreviewLink> => collect(comments);
