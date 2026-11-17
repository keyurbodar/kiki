import { RegistryProvider } from "@effect/atom-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  RegionLockedDialog,
  regionLockedDescription,
  regionLockedDialogAtom,
} from "./region-locked-dialog";

afterEach(cleanup);

describe("RegionLockedDialog", () => {
  it("names the model in the description", () => {
    expect(regionLockedDescription("Sample Model")).toBe(
      "Sample Model is only available in the United States and Canada",
    );
  });

  it("opens from the atom and closes on Got it", async () => {
    render(
      <RegistryProvider
        initialValues={[
          [regionLockedDialogAtom, { open: true, model: "Sample Model" }],
        ]}
      >
        <RegionLockedDialog />
      </RegistryProvider>,
    );
    expect(screen.getByText("US and Canada only")).toBeTruthy();
    expect(
      screen.getByText(
        "Sample Model is only available in the United States and Canada",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Got it" })).toBeNull(),
    );
  });
});
