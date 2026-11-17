import { Badge } from "@/primitives/badge";
import { Icon } from "@/primitives/icon";
import { statusParts } from "../model/status.ts";
import { cx } from "./cx.ts";
import { CheckCircleGlyph } from "./glyphs.tsx";

const iconSizes = { xs: "size-6", sm: "size-8", base: "size-10" } as const;

export function PluginIcon({
  name,
  iconUrl,
  size = "sm",
}: {
  readonly name: string;
  readonly iconUrl?: string | null;
  readonly size?: keyof typeof iconSizes;
}) {
  if (iconUrl === undefined || iconUrl === null)
    return (
      <span className="text-sm font-medium text-foreground">
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  return (
    <img
      src={iconUrl}
      alt=""
      className={cx("rounded-md object-cover", iconSizes[size])}
    />
  );
}

export function ServerIcon({
  iconUrl,
  size = "sm",
}: {
  readonly iconUrl: string | null;
  readonly size?: keyof typeof iconSizes;
}) {
  if (iconUrl === null) return <Icon name="server-2" />;
  return (
    <img
      src={iconUrl}
      alt=""
      className={cx("rounded-md object-cover", iconSizes[size])}
    />
  );
}

export function StatusBadge({
  status,
  className,
}: {
  readonly status: string;
  readonly className?: string;
}) {
  const parts = status === "Update needs you" ? undefined : statusParts(status);
  const color = parts?.color ?? "warning";
  return (
    <Badge color={color} className={className}>
      {color === "success" && <CheckCircleGlyph className="size-(--icon-xs)" />}
      {parts?.badge ?? status}
    </Badge>
  );
}

const numberWords = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

export const numberWord = (count: number) =>
  numberWords[count] ?? String(count);

export const toolsFromServers = (servers: number, tools: number) => {
  const serverPhrase = `${numberWord(servers)} MCP server${servers === 1 ? "" : "s"}`;
  return tools > 0
    ? `${tools} tool${tools === 1 ? "" : "s"} from ${serverPhrase}`
    : `${serverPhrase.slice(0, 1).toUpperCase()}${serverPhrase.slice(1)}`;
};

export const placementLabel = (placement: string) =>
  placement === "backend"
    ? "Runs in the cloud"
    : "Runs on each thread's machine";

export const pluginServerSummary = (
  server: {
    readonly placement: string;
    readonly auth: string;
    readonly connection: string;
    readonly displayName: string;
  },
  mode: "add" | "view",
  owner: "organization" | "me",
) => {
  const base =
    mode === "add" && server.placement !== "backend"
      ? "Runs on each thread's machine, with access to its files"
      : placementLabel(server.placement);
  if (server.auth === "none") return base;
  if (owner === "me")
    return server.auth === "oauth"
      ? mode === "add"
        ? `${base}, you sign in with ${server.displayName}`
        : `${base} and signs in as you`
      : `${base} with your own key`;
  if (server.connection === "member")
    return server.auth === "oauth"
      ? mode === "add"
        ? `${base}, each member signs in with ${server.displayName}`
        : `${base} and signs in as you`
      : mode === "add"
        ? `${base}, each member adds their own key`
        : `${base} with your own key`;
  return server.auth === "oauth"
    ? `${base}, signed in for the organization`
    : `${base} with the organization's API key`;
};

export const makerLine = (maker: { readonly name: string }) =>
  `by ${maker.name}, listed by Capy`;

export const shortVersion = (version: string) =>
  /^[0-9a-f]{7}$/.test(version) ? undefined : version;

export const fetchFailureMessage = (
  reason: string | undefined,
  message: string | undefined,
  fallback: string,
) =>
  reason === "not_found"
    ? "Capy couldn't find that repository or folder, and a private one needs the Capy GitHub App installed"
    : reason === "no_manifest"
      ? "That folder has no plugin.json"
      : reason === "unavailable"
        ? "Capy couldn't fetch it right now, try again"
        : (message ?? fallback);
