import { Effect, Exit, Schema } from "effect";
import { Atom } from "effect/reactivity";
import { VolumeId, VolumeVersionId } from "../api/schemas/drive.ts";
import { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/**
 * Drive scopes, scope files and the agent context preview, as Capy's
 * Instructions and Skills settings read them. The `volumes` endpoints answer
 * Capy's shapes as plain JSON, so these atoms decode them.
 */

export const DriveScope = Schema.Struct({
  projectId: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
  automationId: Schema.optional(Schema.String),
  captainJamId: Schema.optional(Schema.String),
});
export type DriveScope = typeof DriveScope.Type;

export const Volume = Schema.Struct({
  id: Schema.String,
  namespace: Schema.String,
  name: Schema.String,
  projectId: Schema.NullOr(Schema.String),
  userId: Schema.NullOr(Schema.String),
  captainJamId: Schema.NullOr(Schema.String),
  archived: Schema.Boolean,
  headVersionId: Schema.NullOr(Schema.String),
  headDigest: Schema.NullOr(Schema.String),
  fileCount: Schema.Number,
  totalBytes: Schema.Number,
});
export type Volume = typeof Volume.Type;

export const VolumeManifestEntry = Schema.Struct({
  path: Schema.String,
  mode: Schema.Number,
  sizeBytes: Schema.Number,
  sha256: Schema.String,
});

export const VolumeManifest = Schema.Struct({
  versionId: Schema.String,
  volumeId: Schema.String,
  digest: Schema.String,
  entries: Schema.Array(VolumeManifestEntry),
});
export type VolumeManifest = typeof VolumeManifest.Type;

export const VolumeFile = Schema.Union([
  Schema.Struct({ type: Schema.Literal("content"), content: Schema.String }),
  Schema.Struct({ type: Schema.Literal("url"), url: Schema.String }),
]);
export type VolumeFile = typeof VolumeFile.Type;

export const AgentContextPartKind = Schema.Literals([
  "org",
  "project",
  "user",
  "project-user",
  "captain",
  "repo",
  "skills",
]);
export type AgentContextPartKind = typeof AgentContextPartKind.Type;

export const AgentContextPart = Schema.Struct({
  kind: AgentContextPartKind,
  label: Schema.String,
  file: Schema.String,
  chars: Schema.Number,
  loaded: Schema.Number,
  skillCount: Schema.optional(Schema.Number),
  deferred: Schema.optional(Schema.Boolean),
});
export type AgentContextPart = typeof AgentContextPart.Type;

/** One line of "Loaded before the first message". */
export type ContextPart = AgentContextPart;

/** Capy's preview payload. The mock still answers a provisional shape, so every field is optional and a payload without `parts` decodes to undefined. */
export const AgentContextPreview = Schema.Struct({
  modelId: Schema.optional(Schema.String),
  contextWindow: Schema.optional(Schema.Number),
  used: Schema.optional(Schema.Number),
  parts: Schema.optional(Schema.Array(AgentContextPart)),
});

export type CapyAgentContextPreview = {
  modelId: string | undefined;
  contextWindow: number;
  used: number;
  parts: ReadonlyArray<ContextPart>;
};

export const AgentModel = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  label: Schema.optional(Schema.String),
  provider: Schema.String,
  contextWindow: Schema.optional(Schema.Number),
  defaultFavorite: Schema.optional(Schema.Boolean),
});
export type AgentModel = typeof AgentModel.Type;

export type ModelOption = {
  id: string;
  name: string;
  provider: string;
  contextWindow: number | undefined;
  defaultFavorite: boolean;
};

export const Captain = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  projectId: Schema.NullOr(Schema.String),
  ownerId: Schema.String,
  imageUrl: Schema.optional(Schema.NullOr(Schema.String)),
});
export type Captain = typeof Captain.Type;

/** One drive file merged across a scope's volumes, as Capy lists it. */
export type DriveEntry = {
  path: string;
  sourcePath: string;
  volume: Volume;
  versionId: string;
  mode: number;
  sizeBytes: number;
  sha256: string;
};

export type DriveScopeFiles = {
  volumes: ReadonlyArray<Volume>;
  entries: ReadonlyArray<DriveEntry>;
};

export const driveReactivityKey = (orgId: string) => `volume:${orgId}`;

/** Capy's filters key: the `list` query for one exact scope, as JSON. */
export const driveFiltersKey = (scope: DriveScope) =>
  JSON.stringify({ ...scope, exactScope: "true", archived: "false" });

const conflictCopy =
  /(?:^|\/)[^/]*\.conflict-\d{8}T\d{6}Z(?:-\d+)?(?:\.[^./]*)?$|^conflict-\d{8}T\d{6}Z(?:-\d+)?\/|^\.capy-conflicts(?:-\d+)?\/\d{8}T\d{6}Z(?:-\d+)?\//;

/** Merges a scope's volume manifests into one sorted file list; artifacts win. */
export const mergeScopeFiles = (
  volumes: ReadonlyArray<Volume>,
  manifests: ReadonlyArray<{ volume: Volume; manifest: VolumeManifest }>,
): DriveScopeFiles => {
  const all = manifests.flatMap(({ volume, manifest }) =>
    manifest.entries
      .filter((entry) => !conflictCopy.test(entry.path))
      .map((entry) => ({
        path:
          volume.namespace === "skills"
            ? `skills/${volume.name}/${entry.path}`
            : entry.path,
        sourcePath: entry.path,
        volume,
        versionId: manifest.versionId,
        mode: entry.mode,
        sizeBytes: entry.sizeBytes,
        sha256: entry.sha256,
      })),
  );
  const artifacts = new Set(
    all.flatMap((entry) =>
      entry.volume.namespace === "artifacts" ? [entry.path] : [],
    ),
  );
  return {
    volumes,
    entries: all
      .filter(
        (entry) =>
          entry.volume.namespace === "artifacts" || !artifacts.has(entry.path),
      )
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
};

const decode = <S extends Schema.Top>(schema: S) =>
  Schema.decodeUnknownEffect(schema);

const orgOf = (key: string) => key.slice(0, key.indexOf("|"));
const restOf = (key: string) => key.slice(key.indexOf("|") + 1);

const volumesQuery = Atom.family((key: string) =>
  ApiClient.query("volumes", "list", {
    params: { orgId: OrgId.make(orgOf(key)) },
    query: JSON.parse(restOf(key)) as Record<string, string>,
    reactivityKeys: [driveReactivityKey(orgOf(key))],
    timeToLive: queryTimeToLive,
  }),
);

const manifestQuery = Atom.family((key: string) => {
  const [orgId = "", volumeId = "", versionId = ""] = key.split("|");
  return ApiClient.query("volumes", "manifest", {
    params: {
      orgId: OrgId.make(orgId),
      volumeId: VolumeId.make(volumeId),
      versionId: VolumeVersionId.make(versionId),
    },
    query: {},
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveScopeFilesKey = (orgId: string, scope: DriveScope) =>
  `${orgId}|${driveFiltersKey(scope)}`;

/** Every file in one exact drive scope, keyed by `driveScopeFilesKey`. */
export const driveScopeFilesAtom = Atom.family((key: string) =>
  Atom.make((get) =>
    Effect.gen(function* () {
      const volumes = yield* decode(Schema.Array(Volume))(
        yield* get.result(volumesQuery(key)),
      );
      const manifests = yield* Effect.forEach(
        volumes.filter((volume) => volume.headVersionId !== null),
        (volume) =>
          get
            .result(
              manifestQuery(
                `${orgOf(key)}|${volume.id}|${volume.headVersionId}`,
              ),
            )
            .pipe(
              Effect.flatMap(decode(VolumeManifest)),
              Effect.map((manifest) => ({ volume, manifest })),
            ),
        { concurrency: "unbounded" },
      );
      return mergeScopeFiles(volumes, manifests);
    }),
  ),
);

/** Several scopes' files, in the order the keys were given. */
export type DriveScopesFiles = {
  /** One entry per key; undefined where that scope's read failed. */
  readonly files: ReadonlyArray<DriveScopeFiles | undefined>;
  /** How many scopes failed, so a reader can say so instead of showing fewer. */
  readonly failed: number;
};

/**
 * Several scopes' files at once, keyed by their keys joined with newlines.
 *
 * A scope that fails is counted rather than swallowed: a reader that showed the
 * scopes it did get would report an empty or short list as if that were the
 * whole truth, which is the same collapse as an empty state standing in for a
 * failed read.
 */
export const driveScopesFilesAtom = Atom.family((keys: string) =>
  Atom.make((get) =>
    Effect.forEach(
      keys === "" ? [] : keys.split("\n"),
      (key) => get.result(driveScopeFilesAtom(key)).pipe(Effect.exit),
      { concurrency: "unbounded" },
    ).pipe(
      Effect.map(
        (exits): DriveScopesFiles => ({
          files: exits.map((exit) =>
            Exit.isSuccess(exit) ? exit.value : undefined,
          ),
          failed: exits.filter(Exit.isFailure).length,
        }),
      ),
    ),
  ),
);

const fileQuery = Atom.family((key: string) => {
  const [orgId = "", volumeId = "", versionId = "", sha256 = ""] =
    key.split("|");
  return ApiClient.query("volumes", "file", {
    params: {
      orgId: OrgId.make(orgId),
      volumeId: VolumeId.make(volumeId),
      versionId: VolumeVersionId.make(versionId),
      sha256,
    },
    timeToLive: queryTimeToLive,
  });
});

export const driveFileKey = (orgId: string, entry: DriveEntry) =>
  `${orgId}|${entry.volume.id}|${entry.versionId}|${entry.sha256}`;

/** One file's body, keyed by `driveFileKey`. */
export const driveFileAtom = Atom.family((key: string) =>
  Atom.make((get) =>
    get.result(fileQuery(key)).pipe(Effect.flatMap(decode(VolumeFile))),
  ),
);

const previewQuery = Atom.family((key: string) =>
  ApiClient.query("volumes", "agentContextPreview", {
    params: { orgId: OrgId.make(orgOf(key)) },
    query: JSON.parse(restOf(key)) as Record<string, string>,
    reactivityKeys: [driveReactivityKey(orgOf(key))],
    timeToLive: queryTimeToLive,
  }),
);

export type AgentContextPreviewQuery = {
  projectId: string;
  model?: string | undefined;
  captainJamId?: string | undefined;
};

export const agentContextPreviewKey = (
  orgId: string,
  query: AgentContextPreviewQuery,
) =>
  `${orgId}|${JSON.stringify(
    Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined),
    ),
  )}`;

/** Capy's own breakdown when the endpoint answers it; undefined until then. Keyed by `agentContextPreviewKey`. */
export const agentContextPreviewAtom = Atom.family((key: string) =>
  Atom.make((get) =>
    get.result(previewQuery(key)).pipe(
      Effect.flatMap(decode(AgentContextPreview)),
      Effect.map((preview): CapyAgentContextPreview | undefined =>
        preview.parts === undefined || preview.contextWindow === undefined
          ? undefined
          : {
              modelId: preview.modelId,
              contextWindow: preview.contextWindow,
              used: preview.used ?? 0,
              parts: preview.parts,
            },
      ),
    ),
  ),
);

const modelsQuery = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: ["model_catalog"],
  timeToLive: queryTimeToLive,
});

/** Capy's model catalog: a bare array, the same shape every other catalog read uses. */
export const agentModelsAtom = Atom.make((get) =>
  get.result(modelsQuery).pipe(
    Effect.flatMap(decode(Schema.Array(AgentModel))),
    Effect.map(
      (models): ReadonlyArray<ModelOption> =>
        models.flatMap((model) => {
          const name = model.name ?? model.label;
          return name === undefined
            ? []
            : [
                {
                  id: model.id,
                  name,
                  provider: model.provider,
                  contextWindow: model.contextWindow,
                  defaultFavorite: model.defaultFavorite === true,
                },
              ];
        }),
    ),
  ),
);

const captainsQuery = Atom.family((orgId: string) =>
  ApiClient.query("captains", "list", {
    params: { orgId: OrgId.make(orgId) },
    query: {},
    reactivityKeys: [`captain:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const captainsAtom = Atom.family((orgId: string) =>
  Atom.make((get) =>
    get
      .result(captainsQuery(orgId))
      .pipe(Effect.flatMap(decode(Schema.Array(Captain)))),
  ),
);

export const driveWriteAtom = ApiClient.mutation("volumes", "write");
