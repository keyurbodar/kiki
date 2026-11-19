import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/primitives/tooltip";
import {
  ConnectionsHeader,
  narrowOnly,
  wideColumns,
} from "./connection-shell.tsx";
import { CapyCreditsRow, CredentialRow } from "./credential-row.tsx";
import {
  fixtureNow,
  sampleCapyCredits,
  sampleCatalog,
  sampleCredential,
  sampleRouting,
  sampleSeat,
  sampleTicks,
} from "./fixtures.ts";
import { ModelsTable, ServedBy, skippedNote } from "./models-table.tsx";
import { catalogRows } from "./routing.ts";
import { SeatRow } from "./seat-row.tsx";
import { labCount, labState, TickTree } from "./tick-tree.tsx";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: fixtureNow });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const wrap = (node: React.ReactNode) =>
  render(<TooltipProvider>{node}</TooltipProvider>);

describe("TickTree", () => {
  it("summarises each lab", () => {
    const [anthropic, openai] = sampleTicks;
    expect(anthropic && labState(anthropic)).toBe("mixed");
    expect(anthropic && labCount(anthropic)).toBe("1 of 2");
    expect(openai && labState(openai)).toBe("off");
    expect(
      labCount({
        lab: "openai",
        ticked: false,
        models: [{ model: "a", entryId: "a", name: "A", ticked: true }],
      }),
    ).toBe("1, new ones left out");
  });

  it("ticks labs and models and locks org-only models", () => {
    const onTick = vi.fn();
    wrap(
      <TickTree
        ticks={sampleTicks}
        via="Claude Code"
        editable
        lockedModels={["anthropic/sample-large"]}
        lockReason="Locked by the organization"
        onTick={onTick}
      />,
    );
    expect(
      screen.getByText("Every Anthropic model on Claude Code"),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Every OpenAI model" }),
    );
    expect(onTick).toHaveBeenLastCalledWith({ lab: "openai", ticked: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "Sample Small" }));
    expect(onTick).toHaveBeenLastCalledWith({
      lab: "anthropic",
      model: "anthropic/sample-small",
      ticked: true,
    });
    expect(
      screen
        .getByRole("checkbox", { name: "Sample Large" })
        .getAttribute("aria-disabled") ??
        screen
          .getByRole("checkbox", { name: "Sample Large" })
          .hasAttribute("data-disabled"),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", { name: "Locked by the organization" }),
    ).toBeTruthy();
  });

  it("shows the reason when it cannot be edited", () => {
    wrap(
      <TickTree
        ticks={sampleTicks}
        editable={false}
        reason="Only admins can change this"
        onTick={vi.fn()}
      />,
    );
    expect(screen.getByText("Only admins can change this")).toBeTruthy();
  });

  it("collapses and expands a lab", () => {
    wrap(<TickTree ticks={sampleTicks} editable onTick={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: /Every OpenAI model/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("checkbox", { name: "Sample Turbo" })).toBeNull();
  });
});

describe("connection rows", () => {
  it("renders a key with its summary and endpoint", () => {
    const onToggle = vi.fn();
    wrap(
      <CredentialRow
        credential={sampleCredential}
        routing={sampleRouting}
        editable
        draggable
        expanded
        onToggle={onToggle}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Acme gateway")).toBeTruthy();
    expect(
      screen.getByText("Serves every Anthropic model, except Sample Small"),
    ).toBeTruthy();
    expect(
      screen.getByText("Through gateway.example.com/v1 with the Responses API"),
    ).toBeTruthy();
    expect(
      screen.getByRole("switch", { name: "Turn off Acme gateway" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Acme gateway" }),
    );
    expect(onToggle).toHaveBeenCalled();
  });

  it("flags a rejected key", () => {
    wrap(
      <CredentialRow
        credential={{ ...sampleCredential, status: "invalid" }}
        routing={sampleRouting}
        editable
        draggable={false}
        expanded={false}
        onToggle={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Key error")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("renders Capy credits", () => {
    wrap(
      <CapyCreditsRow
        credential={sampleCapyCredits}
        admin
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Capy credits")).toBeTruthy();
    expect(
      screen.getByText(
        "Serves models nothing else serves, except OpenAI models",
      ),
    ).toBeTruthy();
  });

  it("renders a subscription with usage", () => {
    wrap(
      <SeatRow
        seat={sampleSeat}
        credentialId="cred_sample_seat"
        routing={sampleRouting}
        fableColumn={false}
        draggable
        expanded
        onToggle={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onReconnect={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    expect(screen.getByText("alex@acme.test")).toBeTruthy();
    expect(screen.getByText("Usage cap")).toBeTruthy();
    expect(screen.getByText("42% used")).toBeTruthy();
    expect(screen.getByText(/Token expires by/)).toBeTruthy();
  });

  it("asks a signed-out subscription to reconnect", () => {
    wrap(
      <SeatRow
        seat={{
          ...sampleSeat,
          state: "needs_reauth",
          health: { state: "connected", provider: "claude" },
        }}
        credentialId="cred_sample_seat"
        routing={sampleRouting}
        fableColumn={false}
        draggable={false}
        expanded
        onToggle={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onReconnect={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );
    expect(screen.getByText("Claude Code needs to reconnect")).toBeTruthy();
    expect(
      screen.getByText(
        "Run claude setup-token again and reconnect with the new token",
      ),
    ).toBeTruthy();
  });

  it("offers Reconnect only where a reconnect flow exists", () => {
    const seat = (onReconnect?: () => void) => (
      <SeatRow
        seat={sampleSeat}
        credentialId="cred_sample_seat"
        routing={sampleRouting}
        fableColumn={false}
        draggable={false}
        expanded
        onToggle={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onReconnect={onReconnect}
        onDisconnect={vi.fn()}
      />
    );
    const { unmount } = wrap(seat(vi.fn()));
    fireEvent.click(screen.getByRole("button", { name: /Actions for/ }));
    expect(screen.getByText("Reconnect")).toBeTruthy();
    unmount();
    wrap(seat(undefined));
    fireEvent.click(screen.getByRole("button", { name: /Actions for/ }));
    expect(screen.queryByText("Reconnect")).toBeNull();
  });

  it("labels the usage columns", () => {
    wrap(<ConnectionsHeader fable />);
    expect(screen.getByText("5h used")).toBeTruthy();
    expect(screen.getByText("Fable used")).toBeTruthy();
  });

  it("hides the columns at the connection container token", () => {
    wrap(<ConnectionsHeader fable />);
    const head = screen.getByText("Account").parentElement;
    expect(head?.className).toContain("@min-connections-wide/connections:flex");
    expect(wideColumns).toContain("@min-connections-wide/connections:flex");
    expect(narrowOnly).toBe("@max-connections-wide/connections:hidden");
  });
});

describe("models table", () => {
  it("lists models with their routing", () => {
    wrap(
      <ModelsTable
        rows={catalogRows(sampleRouting, sampleCatalog, [])}
        credentials={sampleRouting.credentials}
        admin
        compactAtOf={() => undefined}
        myCompactAtOf={() => undefined}
        onCompactAt={vi.fn()}
      />,
    );
    expect(screen.getByRole("table", { name: "Models" })).toBeTruthy();
    expect(screen.getByText("Sample Large")).toBeTruthy();
    expect(screen.getByText("Claude Code plan")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
    expect(screen.getAllByText("400K").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select all models" }),
    );
    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("explains skipped connections", () => {
    const target = {
      kind: "member_seat" as const,
      ref: "b",
      label: "Codex",
      skipped: {
        kind: "org_credential" as const,
        ref: "a",
        label: "Acme gateway",
        exhaustedUntil: new Date(fixtureNow + 36e5),
        capped: true,
        resetNamed: false,
      },
    };
    expect(skippedNote(target, fixtureNow)).toBe(
      "Acme gateway at your usage cap",
    );
    wrap(<ServedBy route={undefined} org={undefined} />);
    expect(screen.getByText("Nothing")).toBeTruthy();
  });
});
