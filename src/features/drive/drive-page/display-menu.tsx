import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "@/primitives/menu";
import { SlidersIcon } from "../icons";
import {
  type DriveOrdering,
  driveOrderingLabels,
  driveOrderings,
} from "../lib/scopes";

/** The top bar's Display menu: one Ordering group, as Capy's DriveDisplayMenu. */
export function DriveDisplayMenu({
  ordering,
  onOrdering,
}: {
  ordering: DriveOrdering;
  onOrdering: (ordering: DriveOrdering) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Display options" />
        }
      >
        <SlidersIcon className="size-(--icon-sm)" />
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <MenuGroup>
          <MenuLabel>Ordering</MenuLabel>
          {driveOrderings.map((option) => (
            <MenuItem
              key={option}
              aria-checked={ordering === option}
              onClick={() => onOrdering(option)}
            >
              {driveOrderingLabels[option]}
              {ordering === option && (
                <span aria-hidden="true" className="ml-auto text-foreground">
                  ✓
                </span>
              )}
            </MenuItem>
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
