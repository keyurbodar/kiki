import type {
  GitHubInstallationConnection,
  GitHubUserConnection,
  LinearConnection,
  PaperStatus,
  SlackConnection,
  TailscaleConnection,
} from "@/data/api/schemas/integrations";

export type ConnectStatus =
  | "connected"
  | "disconnecting"
  | "reconnect"
  | "update";

export type Loading = undefined;

export function githubStatus(
  user: GitHubUserConnection | null | Loading,
  installation: GitHubInstallationConnection | null | Loading,
): ConnectStatus | null | Loading {
  if (user === undefined || installation === undefined) return undefined;
  if (user?.state === "auth_required") return "reconnect";
  if (installation?.state === "suspended") return "update";
  return user !== null || installation !== null ? "connected" : null;
}

export function slackStatus(
  slack: SlackConnection | null | Loading,
): ConnectStatus | null | Loading {
  if (slack == null) return slack;
  if (slack.state === "disconnecting") return "disconnecting";
  if (slack.state === "auth_required") return "reconnect";
  return slack.missingScopes.length > 0 ? "update" : "connected";
}

export function activeStatus(
  connection: LinearConnection | TailscaleConnection | null | Loading,
): ConnectStatus | null | Loading {
  if (connection == null) return connection;
  return connection.state === "active" ? "connected" : "reconnect";
}

export function paperStatus(
  paper: PaperStatus | Loading,
): ConnectStatus | null | Loading {
  if (paper === undefined) return undefined;
  if (paper.connection === null) return null;
  return paper.connection.state === "active" ? "connected" : "reconnect";
}

export type RevylStatus =
  | "not_configured"
  | "off_plan"
  | "off"
  | "not_connected"
  | (string & {});

export type RevylConnection = {
  readonly configured?: boolean;
  readonly available?: boolean;
  readonly disabledAt?: string | null;
  readonly state?: string | null;
  readonly approvalOutcome?: string | null;
};

export function revylStatus(connection: RevylConnection): RevylStatus {
  if (connection.configured !== true) return "not_configured";
  if (connection.available !== true) return "off_plan";
  if (connection.disabledAt != null) return "off";
  if (connection.state == null || connection.state === "unprovisioned") {
    return connection.approvalOutcome ?? "not_connected";
  }
  return connection.state;
}
