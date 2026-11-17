import { type ReactNode, useState } from "react";
import { Markdown } from "@/components/markdown";
import type { ExplorePluginServer } from "@/data/api/schemas/explore";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { SettingsRow } from "@/primitives/settings-row";
import { plural } from "./format";

export type ListingItem = {
  key: string;
  icon: ReactNode;
  name: string;
  description?: string;
  trailing?: ReactNode;
  detail?: ReactNode;
};

function ItemRow({ item }: { item: ListingItem }) {
  const [open, setOpen] = useState(false);
  const description = item.description === "" ? undefined : item.description;
  return (
    <>
      <SettingsRow
        icon={item.icon}
        label={item.name}
        description={description}
        onClick={item.detail === undefined ? undefined : () => setOpen(true)}
      >
        {item.trailing !== undefined && (
          <span className="text-sm text-muted-foreground-2 tabular-nums">
            {item.trailing}
          </span>
        )}
      </SettingsRow>
      {item.detail !== undefined && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{item.name}</DialogTitle>
              {description !== undefined && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            <DialogBody>{item.detail}</DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export type CountedListProps = {
  noun: string;
  items: ReadonlyArray<ListingItem>;
  limit?: number;
};

export function CountedList({ noun, items, limit = 5 }: CountedListProps) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, limit);
  return (
    <section className="flex flex-col gap-2">
      <Card rows>
        <CardListHeader>{plural(items.length, noun)}</CardListHeader>
        {shown.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </Card>
      {items.length > limit && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? "Show less" : `View ${items.length - limit} more`}
        </Button>
      )}
    </section>
  );
}

const transportLabels: Record<ExplorePluginServer["transport"], string> = {
  http: "HTTP",
  sse: "Server-sent events",
  stdio: "Local command",
};

const authLabels: Record<ExplorePluginServer["auth"], string> = {
  oauth: "OAuth",
  headers: "API key",
  none: "No sign in",
};

export const signInLabel = (server: ExplorePluginServer) =>
  server.auth === "none"
    ? "None"
    : server.auth === "oauth"
      ? server.connection === "member"
        ? "Each member signs in"
        : "Signed in once for the organization"
      : server.connection === "member"
        ? "Each member adds an API key"
        : "The organization's API key";

export const serverFacts = (
  server: ExplorePluginServer,
  maker: string,
): ReadonlyArray<readonly [string, string]> => [
  ["Transport", transportLabels[server.transport]],
  ...(server.url === null ? [] : [["URL", server.url] as const]),
  ...(server.command === null ? [] : [["Command", server.command] as const]),
  [
    "Runs",
    server.placement === "backend"
      ? `On ${maker}'s servers`
      : "On each thread's machine",
  ],
  ["Sign in", signInLabel(server)],
  ["Scopes", server.scopes.length === 0 ? "None" : server.scopes.join(", ")],
  ["Secrets", server.secrets.length === 0 ? "None" : server.secrets.join(", ")],
];

function ServerDetail({
  server,
  maker,
}: {
  server: ExplorePluginServer;
  maker: string;
}) {
  return (
    <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
      {serverFacts(server, maker).map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground-2">{label}</dt>
          <dd className="break-words text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type ServerListProps = {
  icon: ReactNode;
  maker: string;
  servers: ReadonlyArray<ExplorePluginServer>;
};

export function ServerList({ icon, maker, servers }: ServerListProps) {
  return (
    <CountedList
      noun="MCP server"
      items={servers.map((server) => ({
        key: server.displayName,
        icon,
        name: server.displayName,
        description: server.url ?? server.command ?? undefined,
        trailing: authLabels[server.auth],
        detail: <ServerDetail server={server} maker={maker} />,
      }))}
    />
  );
}

export function FileDetail({ markdown }: { markdown: string }) {
  return (
    <Markdown className="text-sm whitespace-pre-wrap">{markdown}</Markdown>
  );
}
