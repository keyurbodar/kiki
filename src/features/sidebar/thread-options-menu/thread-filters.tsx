import type { ThreadOrigin } from "@/data/api/schemas/thread";
import { Icon } from "@/primitives/icon";
import { ResponsiveMenuCheckboxItem } from "@/primitives/responsive-menu";

export const originLabels: Record<ThreadOrigin, string> = {
  web: "Web",
  slack: "Slack",
  linear: "Linear",
  github: "GitHub",
  api: "API",
  capy: "Capy",
  automation: "Automation",
};

const menuIconClassName =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";

/**
 * The sidebar's `Filters ›` submenu. Capy filters the list by the origin a
 * thread was started from; the options are the origins the source actually
 * carries, so the submenu never offers a filter that can only empty the list.
 */
export function ThreadFiltersMenu({
  origins,
  selected,
  onChange,
}: {
  origins: ReadonlyArray<ThreadOrigin>;
  selected: ReadonlyArray<ThreadOrigin>;
  onChange: (origins: ReadonlyArray<ThreadOrigin>) => void;
}) {
  return origins.map((origin) => (
    <ResponsiveMenuCheckboxItem
      key={origin}
      checked={selected.includes(origin)}
      closeOnClick={false}
      onCheckedChange={(checked) =>
        onChange(
          checked
            ? [...selected, origin]
            : selected.filter((candidate) => candidate !== origin),
        )
      }
    >
      <span className={menuIconClassName}>
        <Icon
          name={origin === "slack" ? "bubble-dots" : "circle-dashed"}
          size="sm"
        />
      </span>
      {originLabels[origin]}
    </ResponsiveMenuCheckboxItem>
  ));
}
