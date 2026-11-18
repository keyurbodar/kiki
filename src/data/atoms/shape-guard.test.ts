import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assert, describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Atom } from "effect/reactivity";
import { AtomRegistry } from "effect/reactivity";
import {
  pullDiffAtom,
  pullReviewAtom,
  pullThreadsAtom,
} from "@/components/pull-view/atoms";
import {
  memberShareAtom,
  publicShareAtom,
} from "@/components/share-file/share-file";
import {
  orgSharesAtom,
  volumeSharesAtom,
} from "@/components/share-popover/share-data";
import { onboardingStatusAtom } from "@/components/sidebar-setup-card/atoms";
import type { OrgId } from "@/data/api/schemas/ids";
import { agentModelsAtom } from "@/data/atoms/agent-context";
import { apiKeysAtom, serviceUsersAtom } from "@/data/atoms/api-keys";
import { automationsAtom } from "@/data/atoms/automations";
import { captainsAtom } from "@/data/atoms/captains";
import {
  driveFileAtom,
  driveFileVersionsAtom,
  driveTreeAtom,
  driveVersionsAtom,
  driveVolumesAtom,
} from "@/data/atoms/drive";
import {
  joinableOrganizationsAtom,
  myInvitationsAtom,
} from "@/data/atoms/invitations";
import {
  allIssuesAtom,
  captainIssueActivityAtom,
  issueLabelsAtom,
  issueStatesAtom,
} from "@/data/atoms/issues";
import { threadAtom } from "@/data/atoms/jams";
import { machineFileAtom } from "@/data/atoms/machine-files";
import { membersAtom } from "@/data/atoms/members";
import { modelsAtom } from "@/data/atoms/models";
import {
  overviewChildrenAtom,
  overviewLocalPullsAtom,
} from "@/data/atoms/overview";
import {
  githubInstallationReposAtom,
  projectAtom,
  snapshotBuildAtom,
} from "@/data/atoms/project-settings";
import { projectsAtom } from "@/data/atoms/projects";
import { promotionRecipientByCodeAtom } from "@/data/atoms/promotions";
import {
  projectSetupAtom,
  snapshotBuildsAtom,
  snapshotConfigAtom,
  threadMachinesAtom,
} from "@/data/atoms/setup";
import { foldersAtom } from "@/data/atoms/threadOrganization";
import { threadsAtom } from "@/data/atoms/threads";
import { accountAtom } from "@/data/atoms/users";
import {
  captains,
  driveFiles,
  projects,
  threads,
  orgId as worldOrgId,
  pulls as worldPulls,
} from "@/data/mocks/fixtures/world";
import { sampleVolumes, shareId } from "@/data/mocks/volumes/fixtures";
import { digest } from "@/data/mocks/volumes/index";
import { fileUrlAtom } from "@/features/mobile/mobile-view/screenshot-url";
import { decodeCatalog } from "@/features/settings-models/model-routing/decode";
import { emailPreferencesAtom } from "@/features/settings-notifications/email-page/atoms";
import { captainIssueActivityAtom as paneIssueActivityAtom } from "@/features/thread-panes/thread-summary-pane/model";

const orgId = worldOrgId as OrgId;
/** The fixture volume and its first checkpoint, in the ids the schema brands require. */
const volumeId = "vol_01SORG00000000000000000000";
const versionId = "vver_01SORG10000000000000000000";
/** A digest the volume fixtures actually carry, so the read is a hit rather than a miss. */
const fileDigest = digest(
  sampleVolumes[0]?.versions[0]?.files[0]?.content ?? "",
);

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
    endpoint: "issues.captainActivity",
    consumers: [
      {
        name: "captainIssueActivityAtom (data/atoms)",
        atom: captainIssueActivityAtom(orgId, captains[0]?.id ?? ""),
      },
      {
        name: "captainIssueActivityAtom (thread-summary-pane)",
        atom: paneIssueActivityAtom(orgId, captains[0]?.id ?? ""),
      },
    ],
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
        atom: driveVolumesAtom(orgId, {}),
      },
    ],
  },
  {
    endpoint: "projects.get",
    consumers: [
      { name: "projectAtom", atom: projectAtom(`${orgId}/${projects.web.id}`) },
    ],
  },
  {
    endpoint: "integrations.listGitHubInstallationRepos",
    consumers: [
      {
        name: "githubInstallationReposAtom",
        atom: githubInstallationReposAtom(orgId),
      },
    ],
  },
  {
    endpoint: "organizations.listMyInvitations",
    consumers: [{ name: "myInvitationsAtom", atom: myInvitationsAtom }],
  },
  {
    endpoint: "organizations.listJoinableOrganizations",
    consumers: [
      { name: "joinableOrganizationsAtom", atom: joinableOrganizationsAtom },
    ],
  },
  {
    endpoint: "onboarding.status",
    consumers: [
      {
        name: "onboardingStatusAtom",
        atom: onboardingStatusAtom(orgId),
      },
    ],
  },
  {
    endpoint: "pulls.threads",
    consumers: [
      {
        name: "pullThreadsAtom",
        atom: pullThreadsAtom(orgId, worldPulls[0]?.id ?? ""),
      },
    ],
  },
  {
    endpoint: "pulls.review",
    consumers: [
      {
        name: "pullReviewAtom",
        atom: pullReviewAtom(orgId, worldPulls[0]?.id ?? ""),
      },
    ],
  },
  {
    endpoint: "pulls.diff",
    consumers: [
      {
        name: "pullDiffAtom",
        atom: pullDiffAtom(orgId, worldPulls[0]?.id ?? ""),
      },
    ],
  },
  {
    endpoint: "files.read",
    consumers: [
      {
        name: "machineFileAtom",
        atom: machineFileAtom(
          orgId,
          threads.checkoutTest.id,
          driveFiles[0]?.path ?? "",
        ),
      },
    ],
  },
  {
    endpoint: "volumes.fileVersions",
    consumers: [
      {
        name: "driveFileVersionsAtom",
        atom: driveFileVersionsAtom(orgId, volumeId, "README.md"),
      },
    ],
  },
  {
    endpoint: "volumes.versions",
    consumers: [
      {
        name: "driveVersionsAtom",
        atom: driveVersionsAtom(orgId, volumeId),
      },
    ],
  },
  {
    endpoint: "volumes.listShares",
    consumers: [
      {
        name: "volumeSharesAtom",
        atom: volumeSharesAtom(orgId, volumeId as never),
      },
    ],
  },
  {
    endpoint: "volumes.listOrgShares",
    consumers: [{ name: "orgSharesAtom", atom: orgSharesAtom(orgId) }],
  },
  {
    endpoint: "threadOrganization.manifest",
    consumers: [{ name: "foldersAtom", atom: foldersAtom(orgId) }],
  },
  {
    endpoint: "machines.list",
    consumers: [
      {
        name: "threadMachinesAtom",
        atom: threadMachinesAtom(orgId, threads.checkoutTest.id),
      },
    ],
  },
  {
    endpoint: "emailPreferences.get",
    consumers: [
      {
        name: "emailPreferencesAtom",
        atom: emailPreferencesAtom("user_sample_keyur"),
      },
    ],
  },
  {
    endpoint: "files.url",
    consumers: [
      {
        name: "fileUrlAtom",
        atom: fileUrlAtom(
          orgId,
          threads.checkoutTest.id,
          "file_sample_checkout",
        ),
      },
    ],
  },
  {
    endpoint: "projects.getSnapshotBuild",
    consumers: [
      {
        name: "snapshotBuildAtom",
        atom: snapshotBuildAtom(
          `${orgId}/${projects.web.id}/snapbuild_sample_web_3`,
        ),
      },
    ],
  },
  {
    endpoint: "promotions.getRecipientByCode",
    consumers: [
      {
        name: "promotionRecipientByCodeAtom",
        atom: promotionRecipientByCodeAtom("WELCOME50"),
      },
    ],
  },
  {
    endpoint: "volumes.manifest",
    consumers: [
      {
        name: "driveTreeAtom",
        atom: driveTreeAtom(orgId, volumeId, versionId),
      },
    ],
  },
  {
    endpoint: "volumes.file",
    consumers: [
      {
        name: "driveFileAtom",
        atom: driveFileAtom(orgId, volumeId, versionId, fileDigest),
      },
    ],
  },
  {
    endpoint: "volumes.publicShare",
    consumers: [
      {
        name: "publicShareAtom",
        atom: publicShareAtom(shareId("spec") as never),
      },
    ],
  },
  {
    endpoint: "volumes.readShare",
    consumers: [
      {
        name: "memberShareAtom",
        atom: memberShareAtom(shareId("spec") as never),
      },
    ],
  },
  {
    endpoint: "users.getAccount",
    consumers: [{ name: "accountAtom", atom: accountAtom }],
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

/**
 * The list is only a guard if it cannot go stale. This recomputes, from the
 * source, which endpoints more than one module reads, and fails when one of
 * them has neither a row above nor a reasoned exemption below — so a new
 * shared endpoint cannot be added without someone deciding.
 */
describe("the guard's own coverage", () => {
  const queries = () => {
    const found = new Map<string, Set<string>>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (path.endsWith("data/mocks")) continue;
          walk(path);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name) || /\.test\./.test(entry.name))
          continue;
        const text = readFileSync(path, "utf8");
        for (const match of text.matchAll(
          /ApiClient\.query\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g,
        )) {
          const endpoint = `${match[1]}.${match[2]}`;
          const readers = found.get(endpoint) ?? new Set<string>();
          readers.add(path);
          found.set(endpoint, readers);
        }
      }
    };
    walk("src");
    return found;
  };

  /**
   * Endpoints read by more than one module that this table still cannot drive,
   * each with the reason. Every one is a real gap, not an exemption from the
   * rule: they read a payload that only exists inside a hook's closure.
   */
  const exempt = new Map<string, string>();

  it("has a row or a reason for every endpoint more than one module reads", () => {
    const multi = [...queries()].filter(([, readers]) => readers.size > 1);
    const covered = new Set(readers.map((row) => row.endpoint));
    const missing = multi
      .map(([endpoint]) => endpoint)
      .filter((endpoint) => !covered.has(endpoint) && !exempt.has(endpoint))
      .sort();
    expect(missing).toEqual([]);
  });
});
