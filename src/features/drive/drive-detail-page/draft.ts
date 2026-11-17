/** The file a draft was opened from. */
export interface LoadedFile {
  readonly path: string;
  readonly volumeId: string;
  readonly versionId: string;
  readonly sizeBytes: number;
  readonly sha256: string;
}

/** One drive page's editor state, as Capy keeps it per org and scope. */
export type FileDraft =
  | { readonly session: number; readonly state: "clean" }
  | {
      readonly session: number;
      readonly state: "dirty";
      readonly path: string;
      readonly loaded: LoadedFile;
      readonly supersedes: string | undefined;
    }
  | {
      readonly session: number;
      readonly state: "saved";
      readonly path: string;
      readonly sha256: string;
      readonly supersedes: string | undefined;
    };

export const cleanDraft: FileDraft = { session: 0, state: "clean" };

/** The first edit to a file starts a dirty draft; later edits keep it. */
export function markDirty(draft: FileDraft, loaded: LoadedFile): FileDraft {
  if (draft.state === "dirty" && draft.path === loaded.path) return draft;
  return {
    session: draft.session,
    state: "dirty",
    path: loaded.path,
    loaded,
    supersedes:
      draft.state === "saved" && draft.path === loaded.path
        ? draft.sha256
        : undefined,
  };
}

/** Discarding drops the draft and starts a new editor session. */
export const discardDraft = (draft: FileDraft): FileDraft => ({
  session: draft.session + 1,
  state: "clean",
});

/** Settles a save: saved, or still dirty when the text changed while saving. */
export function settleSave(
  draft: FileDraft,
  saved: {
    readonly session: number;
    readonly path: string;
    readonly loaded: LoadedFile;
    readonly supersedes: string | undefined;
    readonly sha256: string;
    readonly editedSince: boolean;
  },
): FileDraft {
  if (draft.session !== saved.session || draft.state !== "dirty") return draft;
  const supersedes = saved.supersedes ?? saved.loaded.sha256;
  return saved.editedSince
    ? {
        session: saved.session,
        state: "dirty",
        path: saved.path,
        loaded: { ...saved.loaded, sha256: saved.sha256 },
        supersedes,
      }
    : {
        session: saved.session,
        state: "saved",
        path: saved.path,
        sha256: saved.sha256,
        supersedes,
      };
}

/** The file on the drive moved on since this draft was opened. */
export const changedUnderDraft = (
  entry: { readonly path: string; readonly sha256: string },
  draft: FileDraft,
) =>
  draft.state === "dirty" &&
  draft.path === entry.path &&
  entry.sha256 !== draft.loaded.sha256 &&
  entry.sha256 !== draft.supersedes;

/** The key Capy stores an editor's text under. */
export const editorStateKey = (
  orgId: string | undefined,
  scope:
    | {
        readonly projectId?: string;
        readonly userId?: string;
        readonly automationId?: string;
        readonly captainJamId?: string;
      }
    | undefined,
  path: string | undefined,
  session: number,
) =>
  JSON.stringify([
    "volume-editor",
    orgId,
    scope?.projectId,
    scope?.userId,
    scope?.automationId,
    scope?.captainJamId,
    path,
    session,
  ]);

/** The parent folder of a path, "" at the root. */
export const parentDirectory = (path: string) =>
  path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

/** SHA-256 of text, hex encoded, as the drive stores file digests. */
export const sha256Hex = (text: string) =>
  crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(text))
    .then((digest) =>
      Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    );
