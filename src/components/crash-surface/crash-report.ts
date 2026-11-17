import { createContext } from "react";

export type CrashThreadContext = {
  threadId?: string;
  orgId?: string;
  machine?: string;
  paneOpen: boolean;
  panes: unknown;
  activePane: unknown;
  mainPanes: unknown;
  activeMainPane: unknown;
};

export const CrashReportContext = createContext<CrashThreadContext | undefined>(
  undefined,
);

export type CapyDesktop = {
  appVersion: string;
  diagnostics?: { logTail?: () => Promise<string[]> };
};

export const capyDesktop = () =>
  (window as Window & { capyDesktop?: CapyDesktop }).capyDesktop;

const MAX_CAUSE_DEPTH = 4;

export const RELOAD_RETRY_WINDOW = 30_000;

export const redactRoute = (route: string) =>
  route.replace(
    /([?&#](?:access_token|refresh_token|id_token|token|code|api_key|key|secret|password|ticket)=)[^&#]*/gi,
    "$1[redacted]",
  );

export const formatErrorChain = (error: unknown, depth = 0): string => {
  if (!(error instanceof Error)) return String(error);
  const head = error.stack ?? `${error.name}: ${error.message}`;
  return depth >= MAX_CAUSE_DEPTH || error.cause === undefined
    ? head
    : `${head}\n\nCaused by:\n${formatErrorChain(error.cause, depth + 1)}`;
};

export type CrashReportInput = {
  error: unknown;
  componentStack?: string;
  route: string;
  time: string;
  id?: string;
  context?: CrashThreadContext;
  orgId?: string;
  deployment: string;
  commit: string;
  desktopVersion?: string;
  userAgent: string;
  viewport: { width: number; height: number };
  pathname: string;
};

export function formatCrashReport(input: CrashReportInput) {
  const { context } = input;
  const threadId =
    context?.threadId ?? /^\/thread\/([^/]+)\/?$/.exec(input.pathname)?.[1];
  const header = [
    input.desktopVersion === undefined
      ? `Capy web ${input.deployment}`
      : `Capy ${input.desktopVersion} (desktop)`,
    `Deployment: ${input.deployment}`,
    `Commit: ${input.commit}`,
    `Route: ${redactRoute(input.route)}`,
    `Time: ${input.time}`,
    input.id === undefined ? [] : `Id: ${input.id}`,
    `User agent: ${input.userAgent}`,
    `Viewport: ${input.viewport.width} x ${input.viewport.height}`,
    `Org: ${context?.orgId ?? input.orgId ?? "unknown"}`,
    threadId === undefined ? [] : `Thread: ${threadId}`,
    context === undefined
      ? []
      : [
          `Machine: ${context.machine ?? "unknown"}`,
          `Pane open: ${context.paneOpen}`,
          `Panes: ${JSON.stringify(context.panes)}`,
          `Active pane: ${context.activePane}`,
          `Main panes: ${JSON.stringify(context.mainPanes)}`,
          `Active main pane: ${context.activeMainPane}`,
        ],
  ]
    .flat()
    .join("\n");
  const stack =
    input.componentStack === undefined
      ? ""
      : `\n\nComponent stack:${input.componentStack}`;
  return `${header}\n\n${formatErrorChain(input.error)}${stack}`;
}

export const withLogTail = (report: string, lines: string[] | undefined) =>
  lines === undefined
    ? report
    : `${report}\n\n--- desktop.log, last ${lines.length} lines ---\n${lines.join("\n")}`;

export const isChunkLoadError = (error: unknown) =>
  error instanceof TypeError &&
  (error.message.startsWith("Failed to fetch dynamically imported module") ||
    error.message.startsWith("error loading dynamically imported module") ||
    error.message.startsWith("Importing a module script failed"));

export const shouldHardReload = (
  error: unknown,
  lastAttempt: number | undefined,
  now: number,
) =>
  isChunkLoadError(error) ||
  (lastAttempt !== undefined && now - lastAttempt < RELOAD_RETRY_WINDOW);
