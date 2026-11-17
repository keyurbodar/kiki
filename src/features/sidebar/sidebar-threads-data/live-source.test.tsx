import { RegistryContext } from "@effect/atom-react";
import { assert, describe, it } from "@effect/vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { DateTime } from "effect";
import { AtomRegistry } from "effect/reactivity";
import type { ReactNode } from "react";
import { afterEach, expect } from "vitest";
import type { CaptainCard } from "@/data/api/schemas/captain";
import { JamId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { ThreadCard } from "@/data/api/schemas/thread";
import { ThreadFolder } from "@/data/api/schemas/threadOrganization";
import { sampleThreads } from "@/data/mocks/jams/fixtures";
import {
  askText,
  mapCaptain,
  mapFolder,
  mapPinnedFolder,
  mapProject,
  mapThread,
  toSidebarSource,
  useLiveSidebarSource,
} from "./live-source";
import { useSidebarThreads } from "./use-sidebar-threads";

afterEach(cleanup);

const now = new Date("2026-01-10T12:00:00Z");
const at = "2026-01-09T12:00:00.000Z";
const sampleCard = sampleThreads[0];
if (!sampleCard) throw new Error("Missing sample thread fixture");
const card = (patch: Partial<ThreadCard> = {}): ThreadCard =>
  new ThreadCard({ ...sampleCard, pinned: false, ...patch });
const folder = (id: string, name: string | null, systemKind: "pinned" | null) =>
  new ThreadFolder({
    id: id as ThreadFolder["id"],
    systemKind,
    visibility: "private",
    section: "threads",
    ownerUserId: null,
    name,
    position: 0,
    hidden: false,
    viewerRole: "owner",
    members: [],
    createdAt: DateTime.makeUnsafe(at),
    updatedAt: DateTime.makeUnsafe(at),
  });

describe("sidebar mapping", () => {
  it("maps status, needs-you and ask text", () => {
    const mapped = mapThread(
      card({
        status: "waiting",
        needsYou: true,
        ask: { key: "approval", text: "Approve the release?" },
      }),
    );
    expect(mapped.status).toBe("waiting");
    expect(mapped.needsYou).toBe(true);
    expect(mapped.ask).toBe("Approve the release?");
    expect(askText("Plain ask")).toBe("Plain ask");
    expect(askText(null)).toBeNull();
  });

  it("maps age from the thread's updatedAt", () => {
    const mapped = mapThread(
      card({ updatedAt: DateTime.fromDateUnsafe(new Date(at)) }),
    );
    expect(mapped.updatedAt.getTime()).toBe(new Date(at).getTime());
    expect(
      toSidebarSource(
        { threads: [], folders: [], board: [], captains: [], projects: [] },
        now,
      ).now,
    ).toBe(now);
  });

  it("maps folders, including the pinned system folder", () => {
    const pins = mapPinnedFolder([
      card({ id: JamId.make("jam_a"), pinned: true }),
      card({ id: JamId.make("jam_b") }),
    ]);
    expect(pins).toEqual({
      id: "pinned",
      name: null,
      systemKind: "pinned",
      threadIds: ["jam_a"],
    });
    expect(mapFolder(folder("f1", "Release", null))).toEqual({
      id: "f1",
      name: "Release",
      systemKind: null,
      threadIds: [],
    });
  });

  it("maps captains and projects", () => {
    const captain = {
      ...card({ id: JamId.make("jam_cap") }),
      face: {
        name: "Harbor",
        avatar: { kind: "preset", value: "capy-avatar-1", background: "#fff" },
        description: null,
      },
    } as CaptainCard;
    expect(mapCaptain(captain, 2)).toMatchObject({
      id: JamId.make("jam_cap"),
      name: "Harbor",
      position: 2,
    });
    expect(mapProject({ id: "proj_1", name: "Web" } as Project)).toEqual({
      id: "proj_1",
      name: "Web",
      logoUrl: null,
    });
  });
});

describe("useLiveSidebarSource", () => {
  it("reads mock atoms and replaces sample data in the sidebar hook", async () => {
    const registry = AtomRegistry.make();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RegistryContext.Provider value={registry}>
        {children}
      </RegistryContext.Provider>
    );
    const live = renderHook(() => useLiveSidebarSource(now), { wrapper });
    await waitFor(() => assert.isNotNull(live.result.current));
    const ids = live.result.current?.threads.map((thread) => thread.id) ?? [];
    assert.isAbove(ids.length, 0);
    assert.equal(live.result.current?.folders[0]?.systemKind, "pinned");

    const sidebar = renderHook(
      () => {
        const source = useLiveSidebarSource(now);
        return useSidebarThreads(source === null ? {} : { source });
      },
      { wrapper },
    );
    await waitFor(() =>
      assert.isFalse(
        sidebar.result.current.view.sections.some((section) =>
          section.threads.some((thread) => thread.id === "jam_sample_1"),
        ),
      ),
    );
    assert.isTrue(
      sidebar.result.current.view.sections.some((section) =>
        section.threads.some((thread) => ids.includes(thread.id)),
      ),
    );
  });
});
