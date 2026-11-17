import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MarkerRow as MarkerRowSchema } from "@/data/events";
import type { Schema } from "effect";

import { MarkerDivider } from "@/features/thread/markers";
import { entry as clusterEntry } from "./entries/cluster";
import { entry as errorEntry } from "./entries/error";
import { entry as markerEntry } from "./entries/marker";
import { entry as mobileSessionEntry } from "./entries/mobile-session";
import { entry as phoneCardEntry } from "./entries/phone-card";
import { entry as updateEntry } from "./entries/update";
import { entry as visualEntry } from "./entries/visual";

type MarkerRow = Schema.Schema.Type<typeof MarkerRowSchema>;

it("registers all T03 timeline row types", () => {
  expect([
    markerEntry.type,
    clusterEntry.type,
    updateEntry.type,
    errorEntry.type,
    visualEntry.type,
    phoneCardEntry.type,
    mobileSessionEntry.type,
  ]).toEqual([
    "marker",
    "cluster",
    "update",
    "error",
    "visual",
    "phone-card",
    "mobile-session",
  ]);
});

it("renders a marker divider with its bundle copy", () => {
  const row: MarkerRow = {
    id: "marker:1",
    eventId: "01J0000000000000000000000" as MarkerRow["eventId"],
    createdAt: new Date(0),
    type: "marker",
    kind: "handoff",
    label: "Handed off to cloud",
  };
  render(<MarkerDivider row={row} />);
  expect(screen.getByText("Handed off to cloud")).toBeDefined();
});
