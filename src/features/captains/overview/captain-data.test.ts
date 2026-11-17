import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { orgId } from "@/data/mocks/fixtures/world";
import {
  type CrewThread,
  captainAtom,
  captainCrewAtom,
  captainDriveAtom,
  crewRemovedDescription,
  hasCaptainOverviewContent,
  recentDriveFiles,
  sortCrew,
  toCaptain,
  toCaptainDrive,
  toCrewThread,
} from "./captain-data";

const at = (iso: string) => new Date(iso);

describe("toCaptain", () => {
  it("reads the face of a typed captain card", () => {
    const captain = toCaptain({
      id: "jam_1",
      title: "Untitled",
      face: {
        name: "Release captain",
        description: "Ships the release.",
        avatar: { kind: "emoji", value: "🚢" },
      },
    });
    assert.deepStrictEqual(captain, {
      id: "jam_1",
      name: "Release captain",
      description: "Ships the release.",
      avatar: {
        kind: "emoji",
        value: "🚢",
        background: "#ffffff",
        image: undefined,
      },
    });
  });

  it("falls back to flat fields and an uploaded image", () => {
    const captain = toCaptain({
      id: "jam_2",
      name: "Docs captain",
      description: null,
      imageUrl: "https://images.example.com/a.png",
    });
    assert.strictEqual(captain?.name, "Docs captain");
    assert.strictEqual(captain?.description, null);
    assert.strictEqual(
      captain?.avatar?.image,
      "https://images.example.com/a.png",
    );
  });

  it("rejects rows without an id", () => {
    assert.isUndefined(toCaptain({ name: "x" }));
  });
});

describe("toCrewThread", () => {
  it("defaults missing fields", () => {
    const thread = toCrewThread({ id: "jam_3", title: "Fix checkout" });
    assert.strictEqual(thread?.status, "idle");
    assert.strictEqual(thread?.pullCount, 0);
    assert.strictEqual(thread?.updatedAt.getTime(), 0);
  });

  it("reads status, pulls and activity", () => {
    const thread = toCrewThread({
      id: "jam_4",
      title: null,
      status: "working",
      pulls: [{ number: 12, state: "open" }],
      lastActivityAt: "2026-03-10T10:00:00Z",
      updatedAt: "2026-03-09T10:00:00Z",
      hasUnreads: true,
    });
    assert.strictEqual(thread?.status, "working");
    assert.strictEqual(thread?.unread, true);
    assert.deepStrictEqual(thread?.pulls, [{ number: 12, state: "open" }]);
    assert.strictEqual(thread?.pullCount, 1);
  });
});

const crew = (id: string, status: CrewThread["status"], iso: string) =>
  toCrewThread({ id, status, updatedAt: iso }) as CrewThread;

describe("sortCrew", () => {
  it("orders working, waiting, idle, then newest activity", () => {
    const sorted = sortCrew([
      crew("a", "idle", "2026-03-10T10:00:00Z"),
      crew("b", "waiting", "2026-03-01T10:00:00Z"),
      crew("c", "working", "2026-03-02T10:00:00Z"),
      crew("d", "working", "2026-03-05T10:00:00Z"),
    ]);
    assert.deepStrictEqual(
      sorted.map((t) => t.id),
      ["d", "c", "b", "a"],
    );
  });
});

describe("drive", () => {
  const drive = toCaptainDrive({
    volumeId: "vol_1",
    items: [
      { path: "notes/a.md", size: 10, updatedAt: "2026-03-01T00:00:00Z" },
      { path: "b.md", size: 20, updatedAt: "2026-03-05T00:00:00Z" },
      { path: "c.md", size: 30, updatedAt: "2026-03-03T00:00:00Z" },
    ],
  });

  it("decodes the listing into entries on one volume", () => {
    assert.strictEqual(drive?.volume.id, "vol_1");
    assert.strictEqual(drive?.files.length, 3);
    assert.strictEqual(drive?.files[0]?.sizeBytes, 10);
    assert.isNull(toCaptainDrive({}));
  });

  it("shows the newest files first, capped, keeping undated files reachable", () => {
    const withUndated = [
      ...(drive?.files ?? []),
      {
        path: "undated.md",
        volume: drive?.volume ?? {
          id: "vol_1",
          namespace: "artifacts",
          name: "artifacts",
          headVersionId: "ver_1",
        },
        versionId: "ver_1",
        sha256: "abc",
        sizeBytes: 1,
        updatedAt: null,
      },
    ];
    const { shown, total } = recentDriveFiles(withUndated, 2);
    assert.deepStrictEqual(
      shown.map((f) => f.path),
      ["b.md", "c.md"],
    );
    assert.strictEqual(total, 4);
    assert.deepStrictEqual(
      recentDriveFiles(withUndated, 4).shown.map((f) => f.path),
      ["b.md", "c.md", "notes/a.md", "undated.md"],
    );
  });

  it("knows when the overview has content", () => {
    assert.isFalse(hasCaptainOverviewContent([], null));
    assert.isTrue(hasCaptainOverviewContent([], drive));
    assert.isTrue(
      hasCaptainOverviewContent(
        [crew("a", "idle", at("2026-01-01").toISOString())],
        null,
      ),
    );
  });
});

describe("crewRemovedDescription", () => {
  it("names the Captain when known", () => {
    assert.strictEqual(crewRemovedDescription("Fix checkout"), "Fix checkout");
    assert.strictEqual(
      crewRemovedDescription("Fix checkout", "Release captain"),
      "Fix checkout left Release captain",
    );
  });
});

describe("captain atoms", () => {
  it.effect("read the captain, its crew and its drive from the mocks", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const captain = toCaptain(
        yield* AtomRegistry.getResult(
          registry,
          captainAtom(orgId, "jam_sample_cap1"),
        ),
      );
      assert.strictEqual(captain?.name, "Release captain");
      const rows = yield* AtomRegistry.getResult(
        registry,
        captainCrewAtom(orgId, "jam_sample_cap1"),
      );
      assert.strictEqual((rows as unknown[]).length, 3);
      const volumes = yield* AtomRegistry.getResult(
        registry,
        captainDriveAtom(orgId, "jam_sample_cap1"),
      );
      assert.isAbove((volumes as unknown[]).length, 0);
      assert.strictEqual(
        captainAtom(orgId, "jam_sample_cap1"),
        captainAtom(orgId, "jam_sample_cap1"),
      );
    }),
  );
});
