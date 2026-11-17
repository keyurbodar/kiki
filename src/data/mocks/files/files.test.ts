import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { FileUploadTargets, FileUrl } from "../../api/schemas/files.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { newId } from "../db/MockDb.ts";
import { orgId, threads } from "../fixtures/world.ts";
import { defaultThreadId } from "./fixtures.ts";
import { mockUploadHost } from "./index.ts";

interface WrittenFile {
  readonly id: string;
  readonly path: string;
  readonly content: string;
}

const jamId = defaultThreadId;
const fileId = "file_sample_checkout";
const key = `files:${orgId}:${jamId}`;

const urlAtom = ApiClient.query("files", "url", {
  params: { orgId, jamId, fileId },
  query: {},
  reactivityKeys: [key],
});
const versionsAtom = ApiClient.query("files", "versions", {
  params: { orgId, jamId, fileId },
  reactivityKeys: [key],
});
const machineAtom = ApiClient.query("files", "read", {
  params: { orgId, jamId },
  query: {},
  reactivityKeys: [key],
});
const write = ApiClient.mutation("files", "write");
const writeMachine = ApiClient.mutation("files", "writeMachine");

const values = <A>(result: unknown) => result as A;

describe("files mock", () => {
  it.effect("serves every read endpoint with thread and machine files", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const url = values<{ url: string; expiresAt: string }>(
        yield* AtomRegistry.getResult(registry, urlAtom),
      );
      const versions = values<ReadonlyArray<{ version: number }>>(
        yield* AtomRegistry.getResult(registry, versionsAtom),
      );
      const machine = values<{ path: string; content: string }>(
        yield* AtomRegistry.getResult(registry, machineAtom),
      );
      assert.include(url.url, mockUploadHost);
      assert.isAbove(versions.length, 0);
      assert.isNotEmpty(machine.content);

      const preview = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("files", "pendingPreview", {
          params: { orgId, fileId },
        }),
      );
      assert.instanceOf(preview, FileUrl);
    }),
  );

  it.effect("uploads files and refreshes write and machine-file queries", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(versionsAtom);
      registry.mount(machineAtom);
      yield* AtomRegistry.getResult(registry, versionsAtom);

      const upload = ApiClient.mutation("files", "upload");
      registry.set(upload, {
        params: { orgId },
        payload: {
          files: [{ name: "log.txt", mediaType: "text/plain", sizeBytes: 120 }],
        },
        reactivityKeys: [key],
      });
      const targets = values<FileUploadTargets>(
        yield* AtomRegistry.getResult(registry, upload),
      );
      assert.instanceOf(targets, FileUploadTargets);
      assert.equal(targets.targets.length, 1);
      assert.include(targets.targets[0]?.url, mockUploadHost);

      const newFileId = newId("file");
      registry.set(write, {
        params: { orgId, jamId, fileId: newFileId },
        payload: {
          path: "notes/new-note.md",
          content: "Draft the release notes.",
          mediaType: "text/markdown",
        },
        reactivityKeys: [key],
      });
      const written = values<WrittenFile>(
        yield* AtomRegistry.getResult(registry, write),
      );
      assert.equal(written.id, newFileId);
      const newVersionsAtom = ApiClient.query("files", "versions", {
        params: { orgId, jamId, fileId: newFileId },
        reactivityKeys: [key],
      });
      assert.equal(
        values<ReadonlyArray<unknown>>(
          yield* AtomRegistry.getResult(registry, newVersionsAtom, {
            suspendOnWaiting: true,
          }),
        ).length,
        1,
      );

      registry.set(writeMachine, {
        params: { orgId, jamId: threads.darkMode.id },
        payload: { content: "# Dark mode notes\n" },
        reactivityKeys: [key],
      });
      const updatedMachine = values<{ ok: boolean }>(
        yield* AtomRegistry.getResult(registry, writeMachine),
      );
      assert.isTrue(updatedMachine.ok);
      const otherMachineAtom = ApiClient.query("files", "read", {
        params: { orgId, jamId: threads.darkMode.id },
        query: {},
        reactivityKeys: [key],
      });
      assert.include(
        values<{ content: string }>(
          yield* AtomRegistry.getResult(registry, otherMachineAtom, {
            suspendOnWaiting: true,
          }),
        ).content,
        "Dark mode notes",
      );
    }),
  );
});
