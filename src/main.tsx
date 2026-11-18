import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CrashSurface } from "@/components/crash-surface";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({
  routeTree,
  defaultErrorComponent: CrashSurface,
  /**
   * Fetch a route's chunk when the reader shows intent — hovering, focusing or
   * touching a link — rather than after the click. Every route is code-split,
   * so without this the chunk a navigation needs only starts downloading once
   * the click lands, and the reader waits for a round trip they already
   * signalled. Ported from t3code's router.
   */
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
