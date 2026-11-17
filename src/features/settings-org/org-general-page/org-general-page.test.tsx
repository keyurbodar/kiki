import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
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
import { Toaster } from "@/primitives/toaster";
import { routeTree } from "@/routeTree.gen";

afterEach(cleanup);

async function renderPage() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ["/settings/org/general"],
    }),
  });
  await router.load();
  render(
    <RegistryProvider>
      <RouterProvider router={router} />
      <Toaster />
    </RegistryProvider>,
  );
  return router;
}

describe("/settings/org/general", () => {
  it("renders the active organization's settings", async () => {
    await renderPage();
    expect(
      await screen.findByRole("heading", { name: "Organization" }),
    ).toBeTruthy();
    const name = (await screen.findByLabelText(
      "Organization name",
    )) as HTMLInputElement;
    expect(name.value).toBe("Acme");
    expect(screen.getByText("For support and API requests")).toBeTruthy();
    const prefix = (await screen.findByLabelText(
      "Issue prefix",
    )) as HTMLInputElement;
    expect(prefix.value).toBe("ACME");
    expect(screen.getByText("Sharing")).toBeTruthy();
    expect(screen.getByText("Private work")).toBeTruthy();
    expect(screen.getByText("Danger zone")).toBeTruthy();
  });

  it("saves sharing through the organizations API", async () => {
    await renderPage();
    fireEvent.click(
      await screen.findByRole("switch", { name: "Allow private work" }),
    );
    expect(await screen.findByText("Sharing saved")).toBeTruthy();
  });

  it("uppercases the issue prefix and saves it on blur", async () => {
    await renderPage();
    const prefix = (await screen.findByLabelText(
      "Issue prefix",
    )) as HTMLInputElement;
    fireEvent.change(prefix, { target: { value: "ac1me" } });
    expect(prefix.value).toBe("ACME");
    fireEvent.change(prefix, { target: { value: "acm" } });
    fireEvent.blur(prefix);
    expect(await screen.findByText("Issue prefix saved")).toBeTruthy();
  });

  it("confirms before deleting the organization", async () => {
    await renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete organization" }),
    );
    await waitFor(() => expect(screen.getByText("Delete Acme?")).toBeTruthy());
  });
});
