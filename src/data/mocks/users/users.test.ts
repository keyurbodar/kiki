import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { isoMinutesAgo, orgId, people } from "../fixtures/world.ts";

interface Row {
  readonly id: string;
  readonly [key: string]: unknown;
}

const run = (
  registry: Parameters<typeof AtomRegistry.getResult>[0],
  atom: unknown,
  input: object,
) => {
  const writable = atom as { set: (value: object) => void };
  registry.set(writable as never, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(registry, writable as never);
};

const key = `users:${orgId}`;
const stamp = isoMinutesAgo(0);
const accountAtom = ApiClient.query("users", "getAccount", {
  reactivityKeys: [key],
});
const passkeysAtom = ApiClient.query("users", "listPasskeys", {
  reactivityKeys: [key],
});
const changesAtom = ApiClient.query("users", "listAppearanceChanges", {
  query: {},
  reactivityKeys: [key],
});
const signingAtom = ApiClient.query("users", "getGitSigning", {
  reactivityKeys: [key],
});
const currentUserAtom = ApiClient.query("users", "getCurrent", {
  reactivityKeys: [key],
});
const createEmail = ApiClient.mutation("users", "createAccountEmail");
const deleteEmail = ApiClient.mutation("users", "deleteAccountEmail");
const setPrimaryEmail = ApiClient.mutation("users", "setPrimaryAccountEmail");
const trustPasskey = ApiClient.mutation("users", "trustPasskey");
const undoChange = ApiClient.mutation("users", "undoAppearanceChange");
const updateName = ApiClient.mutation("users", "updateAccountName");
const replaceEmail = ApiClient.mutation("users", "replaceAccountEmail");
const updateImage = ApiClient.mutation("users", "updateAccountImage");
const rotateSigning = ApiClient.mutation("users", "rotateGitSigning");
const refreshMfa = ApiClient.mutation("users", "refreshMfa");
const setRequirement = ApiClient.mutation("users", "setPasskeyRequirement");
const updatePreferences = ApiClient.mutation("users", "updatePreferences");
const updateAppearance = ApiClient.mutation("users", "updateClientAppearance");
const uploadFile = ApiClient.mutation("users", "uploadAppearanceFiles");
const ensureSigning = ApiClient.mutation("users", "ensureGitSigning");
const recoverAcquisition = ApiClient.mutation("users", "recoverAcquisition");
const deleteAccount = ApiClient.mutation("users", "deleteAccount");

const emails = (value: unknown) =>
  (value as { emails: ReadonlyArray<Row> }).emails;

describe("users mock", () => {
  it.effect("returns every read endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const reads = yield* Effect.all(
        [
          AtomRegistry.getResult(registry, currentUserAtom),
          AtomRegistry.getResult(registry, accountAtom),
          AtomRegistry.getResult(registry, passkeysAtom),
          AtomRegistry.getResult(registry, changesAtom),
          AtomRegistry.getResult(registry, signingAtom),
          AtomRegistry.getResult(
            registry,
            ApiClient.query("users", "appearanceFileUrl", {
              params: { fileId: "appearance_file_sample_logo" },
              reactivityKeys: [key],
            }),
          ),
        ],
        { concurrency: 6 },
      );
      assert.strictEqual((reads[0] as unknown as Row).id, people.alex.id);
      assert.equal(emails(reads[1]).length, 2);
      assert.equal((reads[2] as ReadonlyArray<Row>).length, 2);
      assert.equal((reads[3] as ReadonlyArray<Row>).length, 2);
      assert.ok((reads[4] as Row).enabled);
      assert.ok((reads[5] as { url: string }).url.includes("example.com"));
    }),
  );

  it.effect("exercises every mutation endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(accountAtom);
      registry.mount(passkeysAtom);
      registry.mount(changesAtom);
      yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });

      const created = (yield* run(registry, createEmail, {
        payload: { email: "alex.alt@example.com" },
      })) as Row;
      const afterCreate = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.include(
        emails(afterCreate).map((row) => row.id),
        created.id,
      );
      yield* run(registry, setPrimaryEmail, {
        params: { emailId: created.id },
      });
      const afterPrimary = yield* AtomRegistry.getResult(
        registry,
        accountAtom,
        {
          suspendOnWaiting: true,
        },
      );
      assert.strictEqual(
        (afterPrimary as { primaryEmailId: string }).primaryEmailId,
        created.id,
      );
      yield* run(registry, deleteEmail, { params: { emailId: created.id } });
      const afterDelete = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(
        emails(afterDelete).map((row) => row.id),
        created.id,
      );

      yield* run(registry, updateName, {
        payload: { firstName: "Alex", lastName: "Morgan" },
      });
      yield* run(registry, replaceEmail, {
        payload: { email: "alex@example.com" },
      });
      yield* run(registry, updateImage, {
        payload: { imageUrl: "https://static.example.com/avatars/alex.png" },
      });
      const afterProfile = yield* AtomRegistry.getResult(
        registry,
        accountAtom,
        {
          suspendOnWaiting: true,
        },
      );
      assert.ok((afterProfile as Row).imageUrl);

      yield* run(registry, trustPasskey, {
        params: { passkeyId: "passkey_sample_phone" },
      });
      const afterTrust = yield* AtomRegistry.getResult(registry, passkeysAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue(
        (afterTrust as ReadonlyArray<Row>).find(
          (row) => row.id === "passkey_sample_phone",
        )?.trusted,
      );

      yield* run(registry, undoChange, {
        payload: { id: "change_sample_font" },
      });
      const afterUndo = yield* AtomRegistry.getResult(registry, changesAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(
        (afterUndo as ReadonlyArray<Row>).map((row) => row.id),
        "change_sample_font",
      );

      const uploaded = (yield* run(registry, uploadFile, {
        payload: { name: "team.png" },
      })) as Row;
      yield* run(registry, updateAppearance, {
        payload: { density: "compact" },
      });
      const uploadedUrl = yield* AtomRegistry.getResult(
        registry,
        ApiClient.query("users", "appearanceFileUrl", {
          params: { fileId: uploaded.id },
          reactivityKeys: [key],
        }),
      );
      assert.ok((uploadedUrl as { url: string }).url.includes("example.com"));

      yield* run(registry, rotateSigning, {});
      const signing = yield* AtomRegistry.getResult(registry, signingAtom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual((signing as Row).rotatedAt, stamp);
      yield* run(registry, ensureSigning, {});
      yield* run(registry, refreshMfa, {});
      yield* run(registry, setRequirement, { payload: { required: true } });
      yield* run(registry, updatePreferences, { payload: { theme: "dark" } });
      yield* run(registry, recoverAcquisition, {
        payload: { source: "team-invite" },
      });
      yield* run(registry, deleteAccount, {});
      const afterDeleteAccount = yield* AtomRegistry.getResult(
        registry,
        accountAtom,
        { suspendOnWaiting: true },
      );
      assert.deepStrictEqual(afterDeleteAccount, {});
    }),
  );

  it.effect("hands back the picture a profile write stored", () =>
    Effect.gen(function* () {
      globalThis.localStorage.clear();
      const registry = AtomRegistry.make();
      const imageUrl = "data:image/png;base64,iVBORw0KGgo=";

      yield* run(registry, updateImage, { payload: { imageUrl } });

      const account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual((account as Row).imageUrl, imageUrl);
      const user = yield* AtomRegistry.getResult(registry, currentUserAtom, {
        suspendOnWaiting: true,
      });
      assert.strictEqual((user as { imageUrl: string }).imageUrl, imageUrl);
    }),
  );

  it.effect(
    "answers the 404 the appearance file URL declares for an unknown file",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const missingUrl = ApiClient.query("users", "appearanceFileUrl", {
          params: { fileId: "appearance_file_nobody" },
          reactivityKeys: [key],
        });
        const error = yield* AtomRegistry.getResult(registry, missingUrl).pipe(
          Effect.flip,
        );
        assert.instanceOf(error, HttpApiError.NotFound);
      }),
  );
});
