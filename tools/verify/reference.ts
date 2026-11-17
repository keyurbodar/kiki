import type { Target } from "./targets";

export const NO_REFERENCE_PNG = "no reference PNG";

export type ReferenceResult =
  | { status: "ok"; bytes: Uint8Array }
  | { status: "unverified"; reason: string }
  | { status: "error"; message: string };

export function classifyReference(
  status: number,
  bytes: Uint8Array,
): ReferenceResult {
  if (status === 404 || (status >= 200 && status < 300 && !bytes.length))
    return { status: "unverified", reason: NO_REFERENCE_PNG };
  if (status < 200 || status >= 300)
    return { status: "error", message: `HTTP ${status}` };
  return { status: "ok", bytes };
}

export function isUnverifiable(
  target: Target,
  frames: Map<string, string>,
): boolean {
  return Boolean(
    target.frame &&
      !frames.get(`${target.frame}@${target.viewport?.scale ?? 1}`),
  );
}
