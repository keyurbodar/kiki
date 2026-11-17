import { DateTime } from "effect";
import type {
  ExploreCard,
  ExploreListing,
  ExplorePluginContent,
  ListingKind,
} from "@/data/api/schemas/explore";

export const listingKinds: ReadonlyArray<ListingKind> = [
  "plugin",
  "skill",
  "theme",
];

export const kindPaths: Record<ListingKind, string> = {
  plugin: "plugins",
  skill: "skills",
  theme: "themes",
};

export const kindLabels: Record<ListingKind, string> = {
  plugin: "Plugins",
  skill: "Skills",
  theme: "Themes",
};

export const parseKindParam = (param: string) =>
  listingKinds.find((kind) => kindPaths[kind] === param);

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const compactNumber = (value: number) =>
  compactFormat.format(value).toLowerCase();

const shortDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const shortDate = (value: DateTime.Utc) =>
  shortDateFormat.format(DateTime.toDate(value));

export const starsTitle = (checkedAt: DateTime.Utc | null) =>
  checkedAt === null
    ? "GitHub stars"
    : `GitHub stars, checked ${shortDate(checkedAt)}`;

export const shortVersion = (version: string) =>
  /^[0-9a-f]{40}$/.test(version) ? version.slice(0, 7) : version;

export const trimPeriod = (text: string) => text.replace(/\.$/, "");

export const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export const lowerFirst = (text: string) =>
  /^[A-Z][a-z]/.test(text)
    ? `${text.charAt(0).toLowerCase()}${text.slice(1)}`
    : text;

export const hasSetup = (card: ExploreCard) =>
  card.builtIn === null && (card.kind === "plugin" || card.kind === "skill");

export const madeBy = (card: ExploreCard) => {
  if (card.builtIn !== null) return "Capy, built in";
  if (card.source !== "catalog" && card.maker !== null) return card.maker.name;
  if (card.maker === null)
    return card.kind === "theme" ? "Capy" : "Listed by Capy";
  return `${card.maker.name}, listed by Capy`;
};

const pluginPermissions = (card: ExploreCard, plugin: ExplorePluginContent) => {
  const maker = card.maker?.name ?? card.displayName;
  const remote = plugin.servers.filter(
    (server) => server.placement === "backend",
  ).length;
  const local = plugin.servers.length - remote;
  const scopes = [
    ...new Set(plugin.servers.flatMap((server) => server.scopes)),
  ];
  const secrets = [
    ...new Set(
      plugin.servers.flatMap((server) =>
        server.auth === "headers" ? [] : server.secrets,
      ),
    ),
  ];
  return [
    ...new Set(
      plugin.servers.map((server) =>
        server.auth === "oauth"
          ? server.connection === "member"
            ? `Signs in with your ${maker} account`
            : `Signed in to ${maker} once for the organization`
          : server.auth === "headers"
            ? server.connection === "member"
              ? `Each member adds their own ${maker} API key`
              : `Uses the organization's ${maker} API key`
            : server.placement === "machine" && plugin.prerequisites !== null
              ? `Needs ${plugin.prerequisites}`
              : "Needs no sign in",
      ),
    ),
    ...(remote === 0
      ? []
      : [`${plural(remote, "remote MCP server")}, run by ${maker}`]),
    ...(local === 0
      ? []
      : [`${plural(local, "MCP server")} on each thread's machine`]),
    ...(scopes.length === 0 ? [] : [`Asks for ${scopes.join(", ")}`]),
    ...(secrets.length === 0 ? [] : [`Needs ${secrets.join(", ")}`]),
    ...(plugin.skills.length === 0
      ? []
      : [`Carries ${plural(plugin.skills.length, "skill")}`]),
  ];
};

export const permissions = (listing: ExploreListing): ReadonlyArray<string> => {
  const content = listing.content;
  switch (content.kind) {
    case "plugin":
      return pluginPermissions(listing.card, content.plugin);
    case "builtIn":
      return ["Connects from its own Settings page"];
    case "skill":
      return [
        "Instructions the agent follows with the thread owner's rights",
        content.skill.files.some((file) => file.path.startsWith("scripts/"))
          ? "Carries scripts that run on the machine"
          : "No scripts, nothing runs on your machines",
      ];
    case "theme":
      return ["Changes only how Capy looks for you"];
  }
};

export type RepositoryLink = { repository: string; href: string };

export const repositoryLink = (
  listing: ExploreListing,
): RepositoryLink | undefined => {
  const content = listing.content;
  const card = listing.card;
  if (
    content.kind === "plugin" &&
    card.source === "sync" &&
    card.repository === null
  )
    return undefined;
  if (content.kind === "plugin" && content.plugin.repository !== null) {
    const { repository, commit, path } = content.plugin;
    return {
      repository,
      href: `https://github.com/${repository}/tree/${commit}/${path === "." ? "" : path}`,
    };
  }
  if (content.kind === "skill") {
    const { repository, commit, path } = content.skill.source;
    return {
      repository,
      href: `https://github.com/${repository}/tree/${commit}/${path}`,
    };
  }
  return card.repository === null
    ? undefined
    : {
        repository: card.repository,
        href: `https://github.com/${card.repository}`,
      };
};

export const stripFrontMatter = (text: string) =>
  text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").trim();

export const fileExtension = (path: string) =>
  /\.([a-z0-9]+)$/i.exec(path)?.[1] ?? "";

export const fileMarkdown = (path: string, content: string) => {
  const extension = fileExtension(path);
  return extension === "md"
    ? stripFrontMatter(content)
    : `\`\`\`\`${extension}\n${content.trimEnd()}\n\`\`\`\``;
};

export const lineCount = (content: string) =>
  plural(content.split("\n").length, "line");

export const installDescription = (listing: ExploreListing) => {
  const { card, content } = listing;
  const maker = card.maker?.name ?? card.displayName;
  const servers = content.kind === "plugin" ? content.plugin.servers : [];
  if (card.kind === "skill")
    return "Adds the skill to the project's shared files";
  if (servers.some((server) => server.auth === "oauth"))
    return `Signs in to ${maker} after Install`;
  if (servers.some((server) => server.auth === "headers"))
    return "No sign in, the key goes with every request";
  if (servers.every((server) => server.placement === "machine"))
    return "No sign in, runs on each thread's machine";
  return "No sign in";
};

export const installFailure = (
  message: string,
  inputLabel: string | undefined,
) =>
  inputLabel === undefined
    ? `${message}, nothing was installed`
    : `Nothing was installed, fix the ${lowerFirst(inputLabel)} and try again`;
