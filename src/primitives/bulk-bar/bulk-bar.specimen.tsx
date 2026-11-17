import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { BulkBar, BulkBarAction, BulkBarLabel } from "./bulk-bar";

export function BulkBarSpecimen() {
  return (
    <div className="relative h-40 bg-panel">
      <BulkBar count={3} onClear={() => {}}>
        <BulkBarAction label="Archive">
          <Button variant="ghost" size="sm">
            <Icon name="folder-1" size={null} />
            <BulkBarLabel>Archive</BulkBarLabel>
          </Button>
        </BulkBarAction>
        <BulkBarAction label="Delete" disabled>
          <Button variant="ghost" size="sm" disabled>
            <BulkBarLabel collapseAt="xl">Delete</BulkBarLabel>
          </Button>
        </BulkBarAction>
      </BulkBar>
    </div>
  );
}
