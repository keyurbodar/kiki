import { RegistryProvider } from "@effect/atom-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessRows } from "./access-rows";

afterEach(cleanup);

const renderRows = (props: Parameters<typeof AccessRows>[0]) =>
  render(
    <RegistryProvider>
      <AccessRows {...props} />
    </RegistryProvider>,
  );

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Access" }));

describe("AccessRows", () => {
  it("shows a read-only label without onChange", () => {
    renderRows({ visibility: "private" });
    expect(screen.queryByRole("button", { name: "Access" })).toBeNull();
    expect(screen.getByText("Only specific people")).toBeTruthy();
  });

  it("uses the shared label override", () => {
    renderRows({ visibility: "shared", sharedLabel: "Everyone in Web" });
    expect(screen.getByText("Everyone in Web")).toBeTruthy();
  });

  it("changes visibility straight away without confirmPrivate", async () => {
    const onChange = vi.fn();
    renderRows({
      visibility: "shared",
      onChange,
      sharedLabel: "Everyone in Web",
    });
    openMenu();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Only specific people" }),
    );
    expect(onChange).toHaveBeenCalledWith("private");
  });

  it("asks before making it private when confirmPrivate is set", async () => {
    const onChange = vi.fn();
    renderRows({
      visibility: "shared",
      onChange,
      confirmPrivate: true,
      sharedLabel: "Everyone in Web",
    });
    openMenu();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Only specific people" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Making this private makes you its owner"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Confirm" }));
    expect(onChange).toHaveBeenCalledWith("private");
  });

  it("cancel returns to the choices without changing anything", async () => {
    const onChange = vi.fn();
    renderRows({
      visibility: "shared",
      onChange,
      confirmPrivate: true,
      sharedLabel: "Everyone in Web",
    });
    openMenu();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Only specific people" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    openMenu();
    expect(
      await screen.findByRole("menuitem", { name: "Only specific people" }),
    ).toBeTruthy();
    expect(
      screen.queryByText("Making this private makes you its owner"),
    ).toBeNull();
  });
});
