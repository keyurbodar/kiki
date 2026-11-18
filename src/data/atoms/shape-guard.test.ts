import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { Atom } from "effect/unstable/reactivity";
import { agentModelsAtom } from "@/data/atoms/agent-context";
import { apiKeysAtom, serviceUsersAtom } from "@/data/atoms/api-keys";
import { automationsAtom } from "@/data/atoms/automations";
import { captainsAtom } from "@/data/atoms/captains";
import { driveVolumesAtom } from "@/data/atoms/drive";
import {
  allIssuesAtom,
  issueLabelsAtom,
  issueStatesAtom,
} from "@/data/atoms/issues";
import { threadAtom } from "@/data/atoms/jams";
import { membersAtom } from "@/data/atoms/members";
import { modelsAtom } from "@/data/atoms/models";
import {
  overviewChildrenAtom,
  overviewLocalPullsAtom,
} from "@/data/atoms/overview";
import { projectsAtom } from "@/data/atoms/projects";
import {
  projectSetupAtom,
  snapshotBuildsAtom,
  snapshotConfigAtom,
} from "@/data/atoms/setup";
import { threadsAtom } from "@/data/atoms/threads";
import { orgId, projects, threads } from "@/data/mocks/fixtures/world";
import { decodeCatalog } from "@/features/settings-models/model-routing/decode";

/**
 * One endpoint, one shape, many readers.
 *
 * Twice in one day a shared endpoint changed shape and one consumer did not
 * follow: `/models` went from `{ models, credentials, services }` to a bare
 * array while `agentModelsAtom` still decoded the envelope (the Instructions
 * preview sat on a skeleton with an empty Model picker), and a group started
 * failing with a typed `NotFound` while a helper still declared `never`. Both
 * passed typecheck, because these endpoints are `Undecoded` — the response is
 * `unknown` until a consumer decodes it — and both pages looked right.
 *
 * Each case below drives the mock's own response through every consumer that
 * reads that endpoint, so a shape change fails here instead of in a page test
 * four PRs later. A consumer is covered by mounting it: its own decode runs,
 * and a decode failure surfaces as a failure rather than an empty value.
 */

type Consumer = { readonly name: string; readonly atom: Atom.Atom<unknown> };

const readers: ReadonlyArray<{
  readonly endpoint: string;
  readonly consumers: ReadonlyArray<Consumer>;
}> = [
  {
    endpoint: "models.list",
    consumers: [
      { name: "agentModelsAtom", atom: agentModelsAtom },
      { name: "modelsAtom", atom: modelsAtom(orgId) },
    ],
  },
  {
    endpoint: "members.listMembers",
    consumers: [{ name: "membersAtom", atom: membersAtom(orgId) }],
  },
  {
    endpoint: "captains.list",
    consumers: [{ name: "captainsAtom", atom: captainsAtom(orgId) }],
  },
  {
    endpoint: "projects.list",
    consumers: [{ name: "projectsAtom", atom: projectsAtom(orgId) }],
  },
  {
    endpoint: "automations.list",
    consumers: [{ name: "automationsAtom", atom: automationsAtom(orgId) }],
  },
  {
    endpoint: "jams.list",
    consumers: [{ name: "threadsAtom", atom: threadsAtom(orgId) }],
  },
  {
    endpoint: "jams.get",
    consumers: [
      {
        name: "threadAtom",
        atom: threadAtom(`${orgId}/${threads.checkoutTest.id}`),
      },
    ],
  },
  {
    endpoint: "issues.list",
    consumers: [{ name: "allIssuesAtom", atom: allIssuesAtom(orgId) }],
  },
  {
    endpoint: "issues.states",
    consumers: [{ name: "issueStatesAtom", atom: issueStatesAtom(orgId) }],
  },
  {
    endpoint: "issues.labels",
    consumers: [{ name: "issueLabelsAtom", atom: issueLabelsAtom(orgId) }],
  },
  {
    endpoint: "apiKeys.list",
    consumers: [{ name: "apiKeysAtom", atom: apiKeysAtom(orgId) }],
  },
  {
    endpoint: "serviceUsers.list",
    consumers: [{ name: "serviceUsersAtom", atom: serviceUsersAtom(orgId) }],
  },
  {
    endpoint: "children.list",
    consumers: [
      {
        name: "overviewChildrenAtom",
        atom: overviewChildrenAtom(orgId, threads.checkoutTest.id),
      },
    ],
  },
  {
    endpoint: "projects.getSetup",
    consumers: [
      {
        name: "projectSetupAtom",
        atom: projectSetupAtom(orgId, projects.web.id),
      },
    ],
  },
  {
    endpoint: "projects.getSnapshotConfig",
    consumers: [
      {
        name: "snapshotConfigAtom",
        atom: snapshotConfigAtom(orgId, projects.web.id),
      },
    ],
  },
  {
    endpoint: "projects.listSnapshotBuilds",
    consumers: [
      {
        name: "snapshotBuildsAtom",
        atom: snapshotBuildsAtom(orgId, projects.web.id),
      },
    ],
  },
  {
    endpoint: "volumes.list",
    consumers: [
      {
        name: "driveVolumesAtom",
        atom: driveVolumesAtom(orgId, { scope: "mine" }),
      },
    ],
  },
  {
    endpoint: "pulls.localPullsForThread",
    consumers: [
      {
        name: "overviewLocalPullsAtom",
        atom: overviewLocalPullsAtom(orgId, threads.checkoutTest.id),
      },
    ],
  },
];

/** A consumer decoded the payload: it resolved, and with something in it. */
const decodes = (registry: AtomRegistry.AtomRegistry, consumer: Consumer) =>
  Effect.gen(function* () {
    const value = yield* AtomRegistry.getResult(
      registry,
      consumer.atom as never,
    );
    assert.isDefined(value, `${consumer.name} resolved to nothing`);
    return value;
  });

describe("every consumer of a shared endpoint still decodes it", () => {
  for (const { endpoint, consumers } of readers) {
    it.effect(`${endpoint} decodes through ${consumers.length} reader(s)`, () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        for (const consumer of consumers) yield* decodes(registry, consumer);
      }),
    );
  }

  it.effect("the settings-models catalog reader decodes models.list", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const raw = yield* AtomRegistry.getResult(registry, modelsAtom(orgId));
      assert.isAbove(decodeCatalog(raw).length, 0);
    }),
  );
});
