import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../api/schemas/ids.ts";
import { mockUploadHost } from "../mocks/files/index.ts";
import { pendingPreviewFn, runAtomFn, uploadFilesFn } from "./files.ts";

const orgId = OrgId.make("org_sample_acme");

describe("files atoms over MockServices", () => {
  it.effect("hand out one local upload target per declared file", () =>
    Effect.promise(async () => {
      const registry = AtomRegistry.make();
      const { targets } = await runAtomFn(registry, uploadFilesFn(), {
        orgId,
        files: [
          { name: "a.png", mediaType: "image/png", sizeBytes: 10 },
          { name: "b.md", mediaType: "text/markdown", sizeBytes: 3 },
        ],
      });
      assert.strictEqual(targets.length, 2);
      assert.notStrictEqual(targets[0]?.fileId, targets[1]?.fileId);
      assert.strictEqual(
        new URL(targets[0]?.url ?? "").hostname,
        mockUploadHost,
      );
      const first = targets[0];
      if (first === undefined) return assert.fail("no target");
      const preview = await runAtomFn(registry, pendingPreviewFn(), {
        orgId,
        fileId: first.fileId,
      });
      assert.include(preview.url, first.fileId);
    }),
  );
});
