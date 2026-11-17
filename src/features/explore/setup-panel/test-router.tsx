import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

export async function renderInRouter(ui: () => ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: ui }),
    history: createMemoryHistory({
      initialEntries: ["/explore/plugins/sample"],
    }),
  });
  const view = render(<RouterProvider router={router} />);
  await screen.findByTestId("ready");
  return view;
}
