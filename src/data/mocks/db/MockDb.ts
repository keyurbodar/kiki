import { Context, Effect, Layer, Ref } from "effect";
import { world } from "../fixtures/world.ts";
import { makeOrgState, type OrgState } from "../organizations/state.ts";

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends ReadonlyArray<infer U>
        ? Array<Widen<U>>
        : T extends object
          ? { -readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type Row<K extends TableName> =
  (typeof world)[K] extends ReadonlyArray<infer R> ? Widen<R> : never;

const tables = [
  "members",
  "pendingInvitations",
  "serviceUsers",
  "repos",
  "captains",
  "issueStates",
  "issueLabels",
  "issues",
  "pulls",
  "machines",
  "devices",
  "automations",
  "threadFolders",
  "threadFolderItems",
  "threadTags",
  "threadTagAssignments",
  "threadPins",
  "mcpServers",
  "apiKeys",
  "driveFiles",
  "myInvitations",
  "joinableOrganizations",
] as const;

export type TableName = (typeof tables)[number];

export type MockTables = {
  readonly [K in TableName]: Ref.Ref<ReadonlyArray<Row<K>>>;
} & {
  readonly orgState: OrgState;
  readonly hiddenThemes: Ref.Ref<ReadonlyArray<string>>;
};

let sequence = 0;

/**
 * The fake org's mutable state, shared by every mock group so a write in one
 * group (say, a new issue state) shows up in another (the issues list).
 * Each `MockServices` build seeds a fresh copy from `fixtures/world.ts` and
 * restarts the `newId` sequence, so ids are deterministic per build.
 */
export class MockDb extends Context.Service<MockDb, MockTables>()(
  "kiki/MockDb",
) {
  static readonly layer = Layer.effect(
    MockDb,
    Effect.gen(function* () {
      yield* Effect.sync(() => {
        sequence = 0;
      });
      const entries = yield* Effect.forEach(tables, (name) =>
        Ref.make(structuredClone(world[name]) as ReadonlyArray<unknown>).pipe(
          Effect.map((ref) => [name, ref] as const),
        ),
      );
      const orgState = yield* makeOrgState;
      const hiddenThemes = yield* Ref.make<ReadonlyArray<string>>([]);
      return MockDb.of({
        ...(Object.fromEntries(entries) as unknown as Omit<
          MockTables,
          "orgState" | "hiddenThemes"
        >),
        orgState,
        hiddenThemes,
      });
    }),
  );
}

/** Reads an `Undecoded` payload as a plain object. */
export const fields = (payload: unknown): Record<string, unknown> =>
  typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};

/**
 * Undecoded endpoints declare no error schema, so an unknown id can only be a
 * defect. It answers 500 and fails the caller loudly, like a missing mock.
 */
export const missing = (table: TableName, id: string) =>
  Effect.die(new Error(`MockDb.${table}: no row ${id}`));

/** A fresh id for a row a mock creates, e.g. `newId("lbl")` → `lbl_mock_1`. */
export const newId = (prefix: string) => `${prefix}_mock_${++sequence}`;
