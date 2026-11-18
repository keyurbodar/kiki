/**
 * The session-scoped pane params. Capy's tab ids carry the session — or the
 * machine and client — so they exist only in the document that opened the tab
 * and are never reopenable from a URL in Capy. We keep the same keys so a
 * session can be addressed inside the app, and `writesPaneParam` keeps them out
 * of a URL we build.
 */
export type SessionPane =
  | { kind: "browser"; sessionId: string }
  | { kind: "shell"; machineId: string; clientId: string };

const nonEmpty = (parts: ReadonlyArray<string>) =>
  parts.every((part) => part !== "");

export function parseSessionPane(
  value: string | undefined,
): SessionPane | undefined {
  if (value === undefined) return undefined;
  const [kind, a, b] = value.split(":");
  if (kind === "browser") {
    if (a === undefined || b !== undefined || !nonEmpty([a])) return undefined;
    return { kind: "browser", sessionId: a };
  }
  if (kind === "shell") {
    if (a === undefined || b === undefined || !nonEmpty([a, b]))
      return undefined;
    return { kind: "shell", machineId: a, clientId: b };
  }
  return undefined;
}
