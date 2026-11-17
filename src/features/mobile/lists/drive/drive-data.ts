import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { useMobileQuery } from "../mobile-query";
import { formatBytes } from "./format-bytes";

export type MobileDriveRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly files: number;
  readonly bytes: number;
  readonly size: string;
};

const scopesAtom = Atom.family((orgId: string) =>
  ApiClient.query("volumes", "scopeDirectory", {
    params: { orgId },
    query: {},
    reactivityKeys: [`mobile-drive:${orgId}`],
    timeToLive: "5 minutes",
  }),
);

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;
const number = (value: unknown) => (typeof value === "number" ? value : 0);

export function useMobileDrive() {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(organizationsAtom)),
  );
  const orgId = organizations?.[0]?.id;
  const { result, waiting } = useMobileQuery(
    scopesAtom(orgId ?? ""),
    orgId === undefined,
  );
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  const userName = [user?.firstName, user?.lastName]
    .filter((part) => typeof part === "string" && part !== "")
    .join(" ");
  const value = AsyncResult.value(result);
  const scopes = record(value).scopes;
  const rows = (Array.isArray(scopes) ? scopes : []).flatMap((item) => {
    const scope = record(item);
    const id = text(scope.id);
    const name = text(scope.name);
    if (id === undefined || name === undefined) return [];
    const files = number(scope.fileCount);
    const bytes = number(scope.totalBytes);
    return [
      {
        id,
        name,
        description:
          scope.path === "personal"
            ? "Only your threads"
            : "Every thread in this scope",
        files,
        bytes,
        size: formatBytes(bytes),
      },
    ];
  });
  const personal = {
    id: "personal",
    name: "Your drive",
    description: "Only your threads",
    files: 0,
    bytes: 0,
    size: "0 B",
  };
  const inOrganization =
    userName === ""
      ? []
      : [
          {
            id: "personal-org",
            name: "Your drive in Home",
            description: "Your threads in Home",
            files: 0,
            bytes: 0,
            size: "0 B",
          },
        ];
  return {
    rows: [personal, ...rows, ...inOrganization],
    waiting,
    usedBytes: rows.reduce((total, row) => total + row.bytes, 0),
    capacityBytes: 10 * 1024 * 1024 * 1024,
  };
}
