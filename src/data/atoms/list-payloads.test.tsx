import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { assert, describe, it } from "@effect/vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { AsyncResult, Atom, AtomRegistry } from "effect/reactivity";
import type { ReactNode } from "react";
import { afterEach, expect } from "vitest";
import { pullsAtom } from "@/features/pulls/pulls-page/data/atoms";
import { OrgId } from "../api/schemas/ids";
import { ApiClient } from "../client/ApiClient";
import { captainsAtom } from "./captains";
import { devicesAtom } from "./devices";
import { projectsAtom } from "./projects";
import { selectedOrgIdAtom } from "./session";
import { threadsAtom } from "./threads";

/**
 * AMA-112: a list page reads a projection, never a detail record.
 *
 * The contract is two properties, both checkable without a browser:
 *
 * 1. Nothing a list atom carries is detail-shaped. A row may name what it is
 *    about — an id, a title, a status, a count — but must not carry message
 *    bodies, transcripts, diffs, logs or attachment lists, at any depth.
 * 2. Reading a list atom subscribes a component to that atom alone, so a write
 *    to an unrelated atom does not re-render the page.
 *
 * Both are guarded here against the mock world's own payloads, which is the
 * same shape the live API serves. A field added to a list row that only a
 * detail surface needs breaks property 1 on the next CI run.
 */

const orgId = OrgId.make("org_sample_acme");

/** Keys that only a detail surface reads. Matched at every depth. */
const detailOnly = new Set([
  "attachments",
  "body",
  "children",
  "content",
  "diff",
  "events",
  "files",
  "logs",
  "messages",
  "patch",
  "steps",
  "timeline",
  "tools",
  "transcript",
  "turns",
]);

/** A list row that serializes larger than this is carrying something a list
 * does not render. The heaviest row today is a thread card at ~1.2 KB. */
const rowBudget = 2_000;

const violationsIn = (
  value: unknown,
  path: ReadonlyArray<string> = [],
): ReadonlyArray<string> => {
  if (Array.isArray(value))
    return value.flatMap((item, index) =>
      violationsIn(item, [...path, String(index)]),
    );
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nested]) => {
      const here = [...path, key];
      const own = detailOnly.has(key) ? [here.join(".")] : [];
      return [...own, ...violationsIn(nested, here)];
    },
  );
};

const assertSlimRows = (label: string, rows: ReadonlyArray<unknown>): void => {
  assert.isAbove(rows.length, 0, `${label} fixture is empty`);

  const violations = rows.flatMap((row, index) =>
    violationsIn(row).map((path) => `${label}[${index}].${path}`),
  );
  assert.deepStrictEqual(
    violations,
    [],
    `${label} rows carry detail-only fields`,
  );

  const oversized = rows
    .map((row, index) => ({ index, size: JSON.stringify(row).length }))
    .filter((row) => row.size > rowBudget);
  assert.deepStrictEqual(
    oversized,
    [],
    `${label} rows exceed the ${rowBudget}-char budget for a list projection`,
  );
};

const emptyPullRequest = {
  projectIds: [],
  excludedProjectIds: [],
  states: [],
  excludedStates: [],
  authors: [],
  repos: [],
  labels: [],
  captainIds: [],
  updatedAfter: null,
  search: "",
  limit: 50,
};

const issueList = Atom.family((key: string) =>
  ApiClient.query("issues", "list", {
    params: { orgId: OrgId.make(key) },
    query: {} as never,
  }),
);

describe("the guard bites", () => {
  it("rejects a row that carries a message body", () => {
    assert.throws(() =>
      assertSlimRows("synthetic", [{ id: "a", title: "t", body: "x" }]),
    );
  });

  it("rejects a detail record nested inside a row", () => {
    assert.throws(() =>
      assertSlimRows("synthetic", [
        { id: "a", lastMessage: { messages: [{ text: "hi" }] } },
      ]),
    );
  });

  it("rejects a row past the size budget", () => {
    assert.throws(() =>
      assertSlimRows("synthetic", [{ id: "a", note: "x".repeat(rowBudget) }]),
    );
  });

  it("accepts a projection", () => {
    assertSlimRows("synthetic", [
      { id: "a", title: "t", status: "working", mentionCount: 2 },
    ]);
  });
});

describe("list payloads carry a projection, not a record", () => {
  it.effect("thread cards name what a row renders and nothing more", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const page = yield* AtomRegistry.getResult(registry, threadsAtom(orgId));
      assertSlimRows("threads", page.items);
    }),
  );

  it.effect("captain, project and device lists stay projections", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      assertSlimRows(
        "captains",
        (yield* AtomRegistry.getResult(
          registry,
          captainsAtom(orgId),
        )) as unknown as ReadonlyArray<unknown>,
      );
      assertSlimRows(
        "projects",
        (yield* AtomRegistry.getResult(
          registry,
          projectsAtom(orgId),
        )) as unknown as ReadonlyArray<unknown>,
      );
      assertSlimRows(
        "devices",
        (yield* AtomRegistry.getResult(
          registry,
          devicesAtom(orgId),
        )) as unknown as ReadonlyArray<unknown>,
      );
    }),
  );

  it.effect("the pull list atom holds cards, not pull bodies", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const page = (yield* AtomRegistry.getResult(
        registry,
        pullsAtom(orgId, emptyPullRequest),
      )) as unknown;
      const rows = Array.isArray(page)
        ? page
        : ((page as { readonly items?: ReadonlyArray<unknown> }).items ?? []);
      assertSlimRows("pull list", rows);
    }),
  );

  it.effect("the issue list carries summaries, not issue bodies", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const page = (yield* AtomRegistry.getResult(
        registry,
        issueList(orgId),
      )) as unknown as { readonly issues?: ReadonlyArray<unknown> };
      assertSlimRows("issues", page.issues ?? []);
    }),
  );
});

afterEach(cleanup);

type Wrapper = ({ children }: { children: ReactNode }) => ReactNode;

const registryWrapper =
  (registry: AtomRegistry.AtomRegistry): Wrapper =>
  ({ children }) => (
    <RegistryContext.Provider value={registry}>
      {children}
    </RegistryContext.Provider>
  );

describe("a list atom renders its own page and no other", () => {
  it("an unrelated atom write does not re-render the list reader", async () => {
    const registry = AtomRegistry.make();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        const page = useAtomValue(threadsAtom(orgId));
        return AsyncResult.isSuccess(page) ? page.value.items.length : 0;
      },
      { wrapper: registryWrapper(registry) },
    );

    await waitFor(() => expect(result.current).toBeGreaterThan(0));
    const afterMount = renders;

    registry.set(selectedOrgIdAtom, "org_sample_other");
    registry.set(selectedOrgIdAtom, null);

    expect(renders).toBe(afterMount);
  });
});
