import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import {
  THREAD_DEVICE_SPECIMEN_STATES,
  ThreadDeviceSpecimen,
  type ThreadDeviceSpecimenState,
} from "@/features/thread/device-access-dialog/specimen";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { state: ThreadDeviceSpecimenState; mode: ColorMode };

export const Route = createFileRoute("/__thread-device")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    state:
      THREAD_DEVICE_SPECIMEN_STATES.find((s) => s === search.state) ?? "cost",
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ThreadDevicePage,
});

function ThreadDevicePage() {
  const { state, mode } = Route.useSearch();
  useLayoutEffect(() => {
    applyColorMode(mode);
  }, [mode]);
  return <ThreadDeviceSpecimen state={state} />;
}
