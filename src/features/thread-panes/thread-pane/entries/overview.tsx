import { OverviewPane } from "../../overview";
import { definePane } from "../registry";

export const entry = definePane({
  id: "overview",
  label: "Overview",
  order: 0,
  component: OverviewPane,
});
