import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SidebarCaptain } from "@/components/sidebar-threads";
import type { CaptainCard } from "@/data/api/schemas/captain";
import { failMockRequests } from "@/data/mocks/failure";
import { CaptainPreviewCard } from "./captain-preview-card";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

const captain = (): SidebarCaptain & { card: CaptainCard } => ({
  id: "jam_sample_cap1",
  name: "Yuzu",
  avatar: { kind: "preset", value: "capy-avatar-1", background: "#ffffff" },
  status: "idle",
  needsYou: false,
  ask: null,
  preview: "Ships the crew's pull requests",
  hasUnreads: false,
  crewMentionCount: 0,
  age: "2m",
  card: {
    id: "jam_sample_cap1",
    title: "Yuzu",
    userId: "user_sample_alex",
    origin: "web",
    status: "idle",
    archived: false,
    needsYou: false,
    ask: null,
    preview: "Ships the crew's pull requests",
    pulls: [],
    lastModelId: null,
    crewCount: 3,
  } as unknown as CaptainCard,
});

async function renderCard() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <CaptainPreviewCard captain={captain()} />,
    }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
  await router.load();
}

describe("a Captain's preview card", () => {
  it("says the crew did not load instead of showing no crew", async () => {
    failMockRequests(/\/captains\/jam_sample_cap1\/crew$/);
    await renderCard();
    expect(
      await screen.findByText("Couldn't load this Captain's crew", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-slot="captain-preview-crew-failed"]'),
    ).not.toBeNull();
  });

  it("lists the crew once it loads, and leaves the failed state out", async () => {
    await renderCard();
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="captain-preview-crew-failed"]'),
        ).toBeNull(),
      { timeout: 4000 },
    );
    expect(screen.getByText("Crew")).toBeTruthy();
  });

  it("refills the card when the retry lands", async () => {
    failMockRequests(/\/captains\/jam_sample_cap1\/crew$/);
    await renderCard();
    const retry = await screen.findByText("Retry", undefined, {
      timeout: 4000,
    });
    failMockRequests(null);
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByText("Crew")).not.toBeNull(), {
      timeout: 4000,
    });
    expect(
      document.querySelector('[data-slot="captain-preview-crew-failed"]'),
    ).toBeNull();
  });
});
