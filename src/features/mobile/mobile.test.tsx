import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  filterModelSections,
  MobileAddSheet,
  MobileProjectSheet,
  MobileSidebarTrigger,
  matchesQuery,
  narrowQuery,
  touchQuery,
  useIsNarrow,
  useIsPhoneSurface,
  useIsTouch,
} from "@/features/mobile";
import { SidebarProvider } from "@/features/shell/sidebar-container";

type FakeList = {
  matches: boolean;
  listeners: Set<() => void>;
};

const lists = new Map<string, FakeList>();
const listFor = (query: string) => {
  const key = query.startsWith("(width") ? "narrow" : query;
  let list = lists.get(key);
  if (!list) {
    list = { matches: false, listeners: new Set() };
    lists.set(key, list);
  }
  return list;
};
const setMatches = (key: string, matches: boolean) => {
  const list = listFor(key === "narrow" ? "(width" : key);
  list.matches = matches;
  act(() => {
    for (const listener of list.listeners) listener();
  });
};

beforeAll(() => {
  document.documentElement.style.setProperty("--breakpoint-md", "768px");
  vi.stubGlobal("matchMedia", (query: string) => {
    const list = listFor(query);
    return {
      get matches() {
        return list.matches;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) =>
        list.listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        list.listeners.delete(listener),
    };
  });
});

afterEach(() => {
  cleanup();
  setMatches("narrow", false);
  setMatches(touchQuery, false);
});

function Probe() {
  return (
    <span>
      {useIsNarrow() ? "narrow" : "wide"} {useIsTouch() ? "touch" : "pointer"}{" "}
      {useIsPhoneSurface() ? "phone" : "app"}
    </span>
  );
}

describe("mobile detection", () => {
  it("builds the narrow query from the md breakpoint token", () => {
    document.documentElement.style.setProperty("--breakpoint-md", "768px");
    expect(narrowQuery()).toBe("(width < 768px)");
    expect(touchQuery).toBe("(hover: none) and (pointer: coarse)");
  });

  it("keeps the width hook width-only but the phone surface mouse-aware", () => {
    setMatches("narrow", true);
    render(<Probe />);
    expect(screen.getByText("narrow pointer app")).toBeTruthy();
    setMatches(touchQuery, true);
    expect(screen.getByText("narrow touch phone")).toBeTruthy();
  });

  it("follows media query changes", () => {
    render(<Probe />);
    expect(screen.getByText("wide pointer app")).toBeTruthy();
    setMatches(touchQuery, true);
    setMatches("narrow", true);
    expect(screen.getByText("narrow touch phone")).toBeTruthy();
  });
});

describe("mobile sidebar trigger", () => {
  it("opens and closes the shell's navigation sheet state", () => {
    setMatches("narrow", true);
    render(
      <SidebarProvider>
        <MobileSidebarTrigger />
      </SidebarProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    expect(trigger.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(trigger);
    const close = screen.getByRole("button", { name: "Close sidebar" });
    expect(close.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(close);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeTruthy();
  });
});

describe("mobile sheets", () => {
  it("matches queries case-insensitively and trims them", () => {
    expect(matchesQuery("Acme Web", " web ")).toBe(true);
    expect(matchesQuery("Acme Web", "api")).toBe(false);
  });

  it("drops empty model sections when filtering", () => {
    const sections = [
      {
        id: "featured",
        label: "Featured",
        models: [{ id: "a", name: "Alpha" }],
      },
      {
        id: "lab",
        label: "Lab",
        models: [
          { id: "b", name: "Beta" },
          { id: "c", name: "Alpha Two" },
        ],
      },
    ];
    expect(filterModelSections(sections, "beta")).toEqual([
      { id: "lab", label: "Lab", models: [{ id: "b", name: "Beta" }] },
    ]);
    expect(filterModelSections(sections, "")).toEqual(sections);
  });

  it("filters projects, marks the selection and reports choices", () => {
    const onSelect = vi.fn();
    render(
      <MobileProjectSheet
        open
        projects={[
          { id: "p1", name: "Acme Web" },
          { id: "p2", name: "Acme API" },
        ]}
        selectedId="p1"
        onSelect={onSelect}
        onNewProject={() => {}}
        onManageProjects={() => {}}
      />,
    );
    expect(
      screen
        .getByText("Acme Web")
        .closest("button")
        ?.getAttribute("aria-checked"),
    ).toBe("true");
    fireEvent.change(screen.getByPlaceholderText("Search projects"), {
      target: { value: "api" },
    });
    expect(screen.queryByText("Acme Web")).toBeNull();
    fireEvent.click(screen.getByText("Acme API"));
    expect(onSelect).toHaveBeenCalledWith("p2");
    expect(screen.getByText("New project")).toBeTruthy();
    expect(screen.getByText("Manage projects")).toBeTruthy();
  });

  it("lists Capy's add-to-message entries in order", () => {
    render(<MobileAddSheet open onSelect={() => {}} />);
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(
      expect.arrayContaining([
        "Upload attachment",
        "Environment variables",
        "People",
        "Captains",
        "Threads",
        "Pull requests",
        "Skills",
        "Plugins",
        "Devices",
        "Files",
      ]),
    );
  });
});
