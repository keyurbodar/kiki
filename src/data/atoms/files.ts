import { Effect } from "effect";
import { type Atom, AtomRegistry } from "effect/reactivity";
import type { FileId, FileUploadDeclaration } from "../api/schemas/files.ts";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";

export type UploadFilesInput = {
  readonly orgId: OrgId;
  readonly files: ReadonlyArray<FileUploadDeclaration>;
};

export type PendingPreviewInput = {
  readonly orgId: OrgId;
  readonly fileId: FileId;
};

/**
 * Fresh function atoms per call, as Capy's bundle builds them, so concurrent
 * uploads never interrupt each other on a shared atom.
 */
export const uploadFilesFn = () =>
  ApiClient.runtime.fn((input: UploadFilesInput) =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.files.upload({
        params: { orgId: input.orgId },
        payload: { files: [...input.files] },
      });
    }),
  );

export const pendingPreviewFn = () =>
  ApiClient.runtime.fn((input: PendingPreviewInput) =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.files.pendingPreview({
        params: { orgId: input.orgId, fileId: input.fileId },
      });
    }),
  );

/** Runs a function atom once on a registry and resolves with its success. */
export const runAtomFn = <Arg, A, E>(
  registry: AtomRegistry.AtomRegistry,
  atom: Atom.AtomResultFn<Arg, A, E>,
  arg: Arg,
): Promise<A> => {
  const release = registry.mount(atom);
  registry.set(atom, arg);
  return Effect.runPromise(
    AtomRegistry.getResult(registry, atom, { suspendOnWaiting: true }),
  ).finally(release);
};
