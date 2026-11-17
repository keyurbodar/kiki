import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type DriveReference,
  DriveReferenceCards,
  driveReferenceName,
} from "./drive-reference-cards";

afterEach(cleanup);

const reference: DriveReference = {
  location: "project-kiki-design",
  path: "design/tokens.json",
  version: 2,
};

describe("driveReferenceName", () => {
  it("uses the title or the last path segment", () => {
    expect(driveReferenceName(reference)).toBe("tokens.json");
    expect(driveReferenceName({ ...reference, title: "Design tokens" })).toBe(
      "Design tokens",
    );
  });
});

describe("DriveReferenceCards", () => {
  it("opens a reference by its accessible name", () => {
    const open = vi.fn();
    render(
      <DriveReferenceCards
        references={[reference]}
        locationLabel={() => "Kiki design"}
        openDriveFile={() => open}
      />,
    );
    const button = screen.getByRole("button", { name: "Open tokens.json" });
    expect(button.getAttribute("disabled")).toBeNull();
    fireEvent.click(button);
    expect(open).toHaveBeenCalled();
  });

  it("disables a reference that cannot be opened", () => {
    render(
      <DriveReferenceCards
        references={[reference]}
        openDriveFile={() => undefined}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Open tokens.json" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
