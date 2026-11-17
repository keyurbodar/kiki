import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { VolumeFolderPage } from "../../api/schemas/drive.ts";
import {
  driveChangesAtom,
  driveCreateShare,
  driveFileVersionsAtom,
  driveFolderAtom,
  driveOrgSharesAtom,
  drivePublicShareAtom,
  driveScopeDirectoryAtom,
  driveUpdateShare,
  driveVersionsAtom,
  driveVolumesAtom,
  driveWrite,
} from "../../atoms/drive.ts";
import { ApiClient, makeApiClientLayer } from "../../client/ApiClient.ts";
import { orgId, projects, viewer } from "../fixtures/world.ts";
import { MockTransport } from "../MockServices.ts";
import { shareId, versionId, volumeId } from "./fixtures.ts";
import { digest, folderEntries } from "./index.ts";

const web = volumeId("WEB");

describe("volumes mock", () => {
  it.effect("summarises every scope with storage", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const directory = yield* AtomRegistry.getResult(
        registry,
        driveScopeDirectoryAtom(orgId),
      );
      assert.strictEqual(directory.items.length, 8);
      assert.strictEqual(directory.storage.limitBytes, 10 * 1024 ** 3);
      assert.isAbove(directory.storage.usedBytes, 0);
    }),
  );

  it.effect("lists one exact scope and its root folder", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const volumes = yield* AtomRegistry.getResult(
        registry,
        driveVolumesAtom(orgId, { projectId: projects.web.id }),
      );
      assert.deepStrictEqual(
        volumes.map((volume) => volume.id),
        [web],
      );
      const head = volumes[0]?.headVersionId ?? "";
      const page = yield* AtomRegistry.getResult(
        registry,
        driveFolderAtom(orgId, web, head, ""),
      );
      assert.instanceOf(page, VolumeFolderPage);
      assert.deepStrictEqual(
        (page as VolumeFolderPage).entries.map((entry) => entry.name),
        ["reports", "specs", "AGENTS.md"],
      );
    }),
  );

  it.effect("reports history and per-file versions", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const versions = yield* AtomRegistry.getResult(
        registry,
        driveVersionsAtom(orgId, web),
      );
      assert.deepStrictEqual(
        versions.map((row) => row.id),
        [versionId("WEB2"), versionId("WEB1")],
      );
      const changes = yield* AtomRegistry.getResult(
        registry,
        driveChangesAtom(orgId, web, versionId("WEB2")),
      );
      assert.deepStrictEqual(
        changes.changes.map((row) => [row.path, row.change]),
        [
          ["reports/latency-week-9.csv", "added"],
          ["specs/checkout-retry.md", "modified"],
        ],
      );
      const fileVersions = yield* AtomRegistry.getResult(
        registry,
        driveFileVersionsAtom(orgId, web, "specs/checkout-retry.md"),
      );
      assert.strictEqual(fileVersions.length, 2);
    }),
  );

  it.effect("writes a file and refreshes the drive queries", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const scope = { userId: viewer.id };
      registry.mount(driveVolumesAtom(orgId, scope));
      const before = yield* AtomRegistry.getResult(
        registry,
        driveVolumesAtom(orgId, scope),
      );
      assert.strictEqual(before[0]?.fileCount, 0);
      registry.set(driveWrite, {
        params: { orgId: orgId as never },
        payload: {
          scope: scope as never,
          expectedDigest: null,
          changes: [{ path: "todo.md", content: "# Todo\n" }],
        },
        reactivityKeys: [`volume:${orgId}`],
      });
      yield* AtomRegistry.getResult(registry, driveWrite);
      const after = yield* AtomRegistry.getResult(
        registry,
        driveVolumesAtom(orgId, scope),
        { suspendOnWaiting: true },
      );
      assert.strictEqual(after[0]?.fileCount, 1);
    }),
  );

  it.effect("creates, publishes and lists shares", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.set(driveCreateShare, {
        params: { orgId: orgId as never, volumeId: web as never },
        payload: { path: "AGENTS.md" },
        reactivityKeys: [`volume:${orgId}`],
      });
      const share = yield* AtomRegistry.getResult(registry, driveCreateShare);
      registry.mount(drivePublicShareAtom(share.id));
      assert.strictEqual(share.visibility, "private");
      const restricted = yield* AtomRegistry.getResult(
        registry,
        drivePublicShareAtom(share.id),
      );
      assert.strictEqual(restricted.type, "restricted");
      registry.set(driveUpdateShare, {
        params: { orgId: orgId as never, shareId: share.id },
        payload: { visibility: "public" },
        reactivityKeys: [`volume:${orgId}`, `drive-share:${share.id}`],
      });
      yield* AtomRegistry.getResult(registry, driveUpdateShare);
      const opened = yield* AtomRegistry.getResult(
        registry,
        drivePublicShareAtom(share.id),
        { suspendOnWaiting: true },
      );
      assert.strictEqual(opened.type, "file");
      const listed = yield* AtomRegistry.getResult(
        registry,
        driveOrgSharesAtom(orgId),
      );
      assert.strictEqual(listed.total, 3);
      assert.isTrue(listed.items.some((row) => row.id === shareId("spec")));
    }),
  );

  it.effect("pages file history before a cursor", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const older = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("volumes", "fileVersions", {
          params: { orgId: orgId as never, volumeId: web as never },
          query: {
            path: "specs/checkout-retry.md",
            before: versionId("WEB2") as never,
          },
        }),
      );
      assert.deepStrictEqual(
        older.map((row) => row.versionId),
        [versionId("WEB1")],
      );
    }),
  );

  it.effect("refuses a share for a path that is not a file", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      for (const path of ["missing.md", "specs"]) {
        const error = yield* Effect.flip(
          client.volumes.createShare({
            params: { orgId: orgId as never, volumeId: web as never },
            payload: { path },
          }),
        );
        assert.strictEqual(error._tag, "capy/DriveSharePathNotFound");
      }
    }).pipe(Effect.provide(makeApiClientLayer(MockTransport))),
  );

  it.effect("creates a drive on first write and keeps UTF-8 and modes", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const scope = { projectId: projects.api.id as never };
      const first = yield* client.volumes.write({
        params: { orgId: orgId as never },
        payload: {
          scope,
          expectedDigest: null,
          changes: [{ path: "run.sh", contentBase64: "w6k=", mode: 420 }],
        },
      });
      assert.strictEqual(first.entries[0]?.sizeBytes, 2);
      const second = yield* client.volumes.write({
        params: { orgId: orgId as never },
        payload: {
          scope,
          expectedDigest: first.digest,
          changes: [{ path: "run.sh", contentBase64: "w6k=", mode: 493 }],
        },
      });
      assert.notStrictEqual(second.digest, first.digest);
      const changes = yield* client.volumes.changes({
        params: {
          orgId: orgId as never,
          volumeId: second.volumeId,
          versionId: second.versionId,
        },
      });
      assert.deepStrictEqual(
        changes.changes.map((row) => [row.path, row.change]),
        [["run.sh", "modified"]],
      );
      const file = yield* client.volumes.file({
        params: {
          orgId: orgId as never,
          volumeId: second.volumeId,
          versionId: second.versionId,
          sha256: second.entries[0]?.sha256 ?? "",
        },
      });
      assert.deepStrictEqual(file.type === "content" && file.content, "é");
    }).pipe(Effect.provide(makeApiClientLayer(MockTransport))),
  );

  it.effect("filters the agent context preview by search", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const preview = (search: string) =>
        AtomRegistry.getResult(
          registry,
          ApiClient.query("volumes", "agentContextPreview", {
            params: { orgId },
            query: { search },
          }),
        ) as Effect.Effect<{
          sources: ReadonlyArray<unknown>;
          availableFiles: ReadonlyArray<string>;
        }>;
      const matched = yield* preview("checkout");
      assert.strictEqual(matched.sources.length, 1);
      assert.isAbove(matched.availableFiles.length, 0);
      assert.strictEqual((yield* preview("no-such-file")).sources.length, 0);
    }),
  );

  it("derives folders and stable digests", () => {
    assert.match(digest("a"), /^[0-9a-f]{64}$/u);
    assert.strictEqual(digest("a"), digest("a"));
    assert.notStrictEqual(digest("a"), digest("b"));
    const entries = folderEntries(
      [
        { path: "a/b.md", content: "x" },
        { path: "a/c/d.md", content: "yy" },
        { path: "e.md", content: "z" },
      ],
      "a",
    );
    assert.deepStrictEqual(
      entries.map((entry) => [entry.kind, entry.path, entry.sizeBytes]),
      [
        ["folder", "a/c", 2],
        ["file", "a/b.md", 1],
      ],
    );
  });
});
