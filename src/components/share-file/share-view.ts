import { type ShareVisibility, toVisibility } from "@/components/share-popover";

export type ShareFileContent =
  | { readonly type: "text"; readonly content: string }
  | {
      readonly type: "url";
      readonly url: string;
      readonly expiresAt: Date | undefined;
    };

export interface ShareMember {
  readonly orgId: string;
  readonly manageable: boolean;
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}

export interface ShareView {
  readonly type: "file";
  readonly id: string;
  readonly path: string;
  readonly url: string;
  readonly visibility: ShareVisibility;
  readonly orgName: string;
  readonly authorName: string | null;
  readonly versionId: string;
  readonly versionCreatedAt: string;
  readonly sizeBytes: number;
  readonly file: ShareFileContent;
  readonly member: ShareMember | null;
}

type Fields = Record<string, unknown>;

const record = (value: unknown): Fields | undefined =>
  typeof value === "object" && value !== null ? (value as Fields) : undefined;

const text = (value: unknown) => (typeof value === "string" ? value : null);

const decodeFile = (value: unknown): ShareFileContent => {
  const file = record(value) ?? {};
  if (file.type === "url") {
    const expires = text(file.expiresAt);
    return {
      type: "url",
      url: text(file.url) ?? "",
      expiresAt: expires === null ? undefined : new Date(expires),
    };
  }
  return { type: "text", content: text(file.content) ?? "" };
};

const decodeMember = (value: unknown): ShareMember | null => {
  const member = record(value);
  if (member === undefined) return null;
  return {
    orgId: text(member.orgId) ?? "",
    manageable: member.manageable === true,
    projectId: text(member.projectId),
    userId: text(member.userId),
    automationId: text(member.automationId),
    captainJamId: text(member.captainJamId),
  };
};

export const decodeShareView = (value: unknown): ShareView | undefined => {
  const view = record(value);
  if (view === undefined || view.type !== "file") return undefined;
  return {
    type: "file",
    id: text(view.id) ?? "",
    path: text(view.path) ?? "",
    url: text(view.url) ?? "",
    visibility: toVisibility(view.visibility),
    orgName: text(view.orgName) ?? "",
    authorName: text(view.authorName),
    versionId: text(view.versionId) ?? "",
    versionCreatedAt: text(view.versionCreatedAt) ?? "",
    sizeBytes: typeof view.sizeBytes === "number" ? view.sizeBytes : 0,
    file: decodeFile(view.file),
    member: decodeMember(view.member),
  };
};

const documentTitleLimit = 262144;

export const markdownTitle = (source: string) => {
  const end = source.startsWith("---\n") ? source.indexOf("\n---", 4) : -1;
  return (end === -1 ? source : source.slice(end + 4))
    .split(/^[ \t]{0,3}(?:`{3,}|~{3,}).*$/m)
    .filter((_, index) => index % 2 === 0)
    .flatMap((part) => part.split("\n"))
    .find((line) => /^[ \t]{0,3}#{1,6}[ \t]+\S/.test(line))
    ?.replace(/^[ \t]{0,3}#{1,6}[ \t]+/, "")
    .replace(/[ \t#]+$/, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
};

export const htmlTitle = (source: string) => {
  const parsed = new DOMParser().parseFromString(source, "text/html");
  const title =
    parsed.title.trim() || parsed.querySelector("h1")?.textContent?.trim();
  return title === undefined || title === ""
    ? undefined
    : title.replace(/\s+/g, " ");
};

const isHtml = (name: string) => /\.html?$/i.test(name);
const isMarkdown = (name: string) => /\.(md|markdown|mdx)$/i.test(name);

export const documentTitleOf = (name: string, content: string | undefined) => {
  if (content === undefined) return undefined;
  const head = content.slice(0, documentTitleLimit);
  if (isHtml(name)) return htmlTitle(head);
  if (isMarkdown(name)) return markdownTitle(head);
  return undefined;
};

export const isRenderable = (name: string) =>
  isMarkdown(name) || isHtml(name) || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

export const isImage = (name: string) =>
  /\.(png|jpe?g|gif|webp|svg)$/i.test(name);

export const isBinaryText = (content: string) => content.includes("\u0000");

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

export const formatUpdated = (iso: string) =>
  new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const shareByline = (view: ShareView) =>
  `Shared by ${view.authorName ?? view.orgName} from ${view.orgName}, updated ${formatUpdated(view.versionCreatedAt)}`;
