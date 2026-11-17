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
  MobileNavigationProvider,
  MobileProjectSheet,
  MobileShell,
  MobileSidebarTrigger,
  matchesQuery,
  narrowQuery,
  touchQuery,
  useIsNarrow,
  useIsTouch,
  useMobileNavigation,
} from "@/features/mobile";

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
      {useIsNarrow() ? "narrow" : "wide"} {useIsTouch() ? "touch" : "pointer"}
    </span>
  );
}

function NavigationState() {
  const { open, setOpen } = useMobileNavigation();
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {open ? "open" : "closed"}
    </button>
  );
}

function OpenSidebar() {
  const { setOpen } = useMobileNavigation();
  return (
    <button type="button" onClick={() => setOpen(true)}>
      menu
    </button>
  );
}

describe("mobile detection", () => {
  it("builds the narrow query from the md breakpoint token", () => {
    document.documentElement.style.setProperty("--breakpoint-md", "768px");
    expect(narrowQuery()).toBe("(width < 768px)");
    expect(touchQuery).toBe("(hover: none) and (pointer: coarse)");
  });

  it("follows media query changes", () => {
    render(<Probe />);
    expect(screen.getByText("wide pointer")).toBeTruthy();
    setMatches("narrow", true);
    setMatches(touchQuery, true);
    expect(screen.getByText("narrow touch")).toBeTruthy();
  });
});

describe("mobile navigation", () => {
  it("throws outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<NavigationState />)).toThrow(
      "useMobileNavigation must be inside MobileNavigationProvider",
    );
  });

  it("toggles from the sidebar trigger and labels it", () => {
    setMatches("narrow", true);
    render(
      <MobileNavigationProvider>
        <MobileSidebarTrigger />
      </MobileNavigationProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    expect(trigger.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(trigger);
    expect(
      screen
        .getByRole("button", { name: "Close sidebar" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("closes when the route key changes", () => {
    setMatches("narrow", true);
    const { rerender } = render(
      <MobileNavigationProvider closeKey="/new">
        <NavigationState />
      </MobileNavigationProvider>,
    );
    fireEvent.click(screen.getByText("closed"));
    expect(screen.getByText("open")).toBeTruthy();
    rerender(
      <MobileNavigationProvider closeKey="/threads">
        <NavigationState />
      </MobileNavigationProvider>,
    );
    expect(screen.getByText("closed")).toBeTruthy();
  });

  it("closes when the viewport widens", () => {
    setMatches("narrow", true);
    render(
      <MobileNavigationProvider>
        <NavigationState />
      </MobileNavigationProvider>,
    );
    fireEvent.click(screen.getByText("closed"));
    setMatches("narrow", false);
    expect(screen.getByText("closed")).toBeTruthy();
  });

  it("renders the sidebar in the Navigation sheet only on narrow screens", () => {
    render(
      <MobileNavigationProvider>
        <MobileShell sidebar={<nav>sidebar</nav>}>
          <OpenSidebar />
        </MobileShell>
      </MobileNavigationProvider>,
    );
    fireEvent.click(screen.getByText("menu"));
    expect(screen.queryByText("sidebar")).toBeNull();
    setMatches("narrow", true);
    fireEvent.click(screen.getByText("menu"));
    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeTruthy();
    expect(screen.getByText("sidebar")).toBeTruthy();
  });

  it("keeps the navigation sheet closed on a left-edge swipe", () => {
    setMatches("narrow", true);
    setMatches(touchQuery, true);
    render(
      <MobileNavigationProvider>
        <MobileShell sidebar={<nav>sidebar</nav>}>
          <main>thread</main>
        </MobileShell>
      </MobileNavigationProvider>,
    );
    const main = screen.getByText("thread");
    fireEvent.pointerDown(main, {
      pointerType: "touch",
      clientX: 2,
      clientY: 400,
    });
    fireEvent.pointerMove(main, {
      pointerType: "touch",
      clientX: 300,
      clientY: 400,
    });
    fireEvent.pointerUp(main, {
      pointerType: "touch",
      clientX: 300,
      clientY: 400,
    });
    expect(screen.queryByText("sidebar")).toBeNull();
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
