export type FileContent = {
  content: string | undefined;
  contentBase64: string | undefined;
  binary: boolean;
  truncated: boolean;
  sizeBytes: number;
  mediaType: string;
};

export type MachineFile = {
  path: string;
  sha: string | null;
  content: FileContent | null;
};

export type DriveEntry = { path: string };

export type MachinePathViewProps = {
  tabId: string;
  jamId: string;
  path: string;
  machineHome?: string;
  workspaceRoot?: string;
  dormant?: boolean;
  onOpenFile?: (path: string) => void;
  onViewport?: (viewport: unknown) => void;
  onOpenDiffs?: () => void;
};

export type MachineFileMissProps = {
  path: string;
  device: boolean;
  onOpenDiffs?: () => void;
};

export type MachinePathUnavailableProps = {
  action?: React.ReactNode;
  onRetry: () => void;
  pending?: boolean;
};

export type CopyBody =
  | { kind: "text"; content: string }
  | { kind: "base64"; contentBase64: string };

export const cloudPathPattern = /^(?:[A-Za-z]:[\\/]|\\\\|\/Users\/)/;
export const devicePathPattern = /^\/(?:workspace|home\/user)\//;

/** Capy's heuristic: whether a missing path came from another machine. */
export const isForeignMachinePath = (path: string, device: boolean) =>
  device ? devicePathPattern.test(path) : cloudPathPattern.test(path);

export const machineMissCopy = (path: string, device: boolean) =>
  isForeignMachinePath(path, device)
    ? {
        line: "File is on another machine",
        sub: device
          ? "This path is from the cloud machine this thread used before"
          : "This path is from a device this thread used before",
      }
    : {
        line: "File isn't on this machine",
        sub: "It was deleted, moved, or written on another machine",
      };

export const fileName = (path: string) => path.split("/").at(-1) ?? path;

export const trimTrailingSlashes = (path: string) => path.replace(/\/+$/, "");

/** Rebases a machine path under the thread's workspace root for the breadcrumb. */
export const relativePath = (path: string, workspaceRoot?: string) => {
  const root =
    workspaceRoot === undefined
      ? undefined
      : trimTrailingSlashes(workspaceRoot);
  if (root !== undefined && (path === root || path.startsWith(`${root}/`)))
    return path.slice(root.length) || "/";
  return path.replace(/^\/+/, "");
};

export const canCopyFile = (file: MachineFile) => {
  const content = file.content;
  if (content === null || file.sha === null) return false;
  if (content.contentBase64 !== undefined) return true;
  return (
    content.binary !== true &&
    content.truncated !== true &&
    content.content !== undefined
  );
};

export const copyBody = (file: MachineFile): CopyBody | undefined => {
  const content = file.content;
  if (!canCopyFile(file) || content === null) return undefined;
  if (content.contentBase64 !== undefined)
    return { kind: "base64", contentBase64: content.contentBase64 };
  return { kind: "text", content: content.content ?? "" };
};

export const draftText = (file: MachineFile) => {
  const content = file.content;
  return content?.binary === true || content?.truncated === true
    ? undefined
    : content?.content;
};

/** Capy's Drive path rules: trimmed, non-empty, and no empty or dot segments. */
export const isValidDrivePath = (path: string) =>
  path.trim() === path &&
  path !== "" &&
  path.split("/").every((part) => part !== "" && part !== "." && part !== "..");

export const drivePathExists = (entries: DriveEntry[], path: string) =>
  entries.some((entry) => entry.path === path);

export const suggestedDrivePath = (name: string) => `copies/${name}`;

export const formattedBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

/** Content gate for the rendered preview; large or binary files stay in source mode. */
export const isPreviewable = (
  file: MachineFile,
  name: string,
  sizeBytes: number,
) =>
  file.content !== null &&
  !file.content.binary &&
  !file.content.truncated &&
  sizeBytes < 512 * 1024 &&
  /\.(?:md|txt|json|ya?ml|tsx?|jsx?|css|html?|svg)$/i.test(name);
