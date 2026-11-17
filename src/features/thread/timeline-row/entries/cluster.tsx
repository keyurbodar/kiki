import { ClusterRow } from "@/features/thread/cluster-row";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "cluster",
  component: ClusterRow,
});
