import {
  type TriggerType,
  triggerTypeLabels,
  triggerTypes,
} from "@/features/automations/automations-list";
import {
  type AutomationFilters,
  type AutomationOrdering,
  type AutomationStatus,
  orderingLabels,
  statusLabels,
} from "@/features/automations/automations-page";

/** Drives the filter drawer: one row per axis value, checked when applied. */
export type DrawerChoice = {
  readonly key: string;
  readonly label: string;
  readonly checked: boolean;
};

export const creatorChoices = (
  filters: AutomationFilters,
  viewerName: string,
): DrawerChoice[] => [
  {
    key: "me",
    label: `Me (${viewerName})`,
    checked: filters.creators === null,
  },
  { key: "anyone", label: "Anyone", checked: filters.creators?.length === 0 },
];

export const statusChoices = (filters: AutomationFilters): DrawerChoice[] =>
  (Object.keys(statusLabels) as AutomationStatus[]).map((status) => ({
    key: status,
    label: statusLabels[status],
    checked: filters.status === status,
  }));

export const sourceChoices = (filters: AutomationFilters): DrawerChoice[] =>
  triggerTypes.map((type) => ({
    key: type,
    label: triggerTypeLabels[type],
    checked: filters.sources.includes(type),
  }));

export const orderingChoices = (ordering: AutomationOrdering): DrawerChoice[] =>
  (Object.keys(orderingLabels) as AutomationOrdering[]).map((key) => ({
    key,
    label: orderingLabels[key],
    checked: ordering === key,
  }));

/** A choice row toggles its value off when it is already applied. */
export const pickCreator = (
  filters: AutomationFilters,
  key: string,
): AutomationFilters => ({
  ...filters,
  creators: key === "anyone" ? [] : key === "me" ? null : filters.creators,
});

export const pickStatus = (
  filters: AutomationFilters,
  key: string,
): AutomationFilters => ({
  ...filters,
  status: filters.status === key ? null : (key as AutomationStatus),
});

export const pickSource = (
  filters: AutomationFilters,
  key: string,
): AutomationFilters => {
  const type = key as TriggerType;
  return {
    ...filters,
    sources: filters.sources.includes(type)
      ? filters.sources.filter((entry) => entry !== type)
      : [...filters.sources, type],
  };
};

export type FilterChip = {
  readonly key: "creator" | "status" | "sources";
  readonly property: string;
  readonly value: string;
};

/** The chip bar under the toolbar, one chip per applied axis. */
export const filterChips = (
  filters: AutomationFilters,
  viewerName: string,
): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (filters.creators === null)
    chips.push({ key: "creator", property: "Creator", value: "Me" });
  else if (filters.creators.includes(viewerName))
    chips.push({ key: "creator", property: "Creator", value: "Me" });
  else if (filters.creators.length > 0)
    chips.push({
      key: "creator",
      property: "Creator",
      value: filters.creators.join(", "),
    });
  if (filters.status !== null)
    chips.push({
      key: "status",
      property: "Status",
      value: statusLabels[filters.status],
    });
  if (filters.sources.length > 0)
    chips.push({
      key: "sources",
      property: "Source",
      value: filters.sources.map((type) => triggerTypeLabels[type]).join(", "),
    });
  return chips;
};

export const clearChip = (
  filters: AutomationFilters,
  key: FilterChip["key"],
): AutomationFilters => {
  if (key === "creator") return { ...filters, creators: [] };
  if (key === "status") return { ...filters, status: null };
  return { ...filters, sources: [] };
};
