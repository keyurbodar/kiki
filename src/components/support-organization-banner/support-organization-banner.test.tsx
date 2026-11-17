import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SupportOrganizationBannerView } from "./support-organization-banner";

afterEach(cleanup);

it("names the organization and exits", () => {
  const onExit = vi.fn();
  render(<SupportOrganizationBannerView name="Acme" onExit={onExit} />);
  expect(screen.getByText("Viewing Acme as superadmin")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Exit" }));
  expect(onExit).toHaveBeenCalled();
});
