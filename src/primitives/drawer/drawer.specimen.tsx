import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from ".";

const GROUPS = [
  { label: "Featured", items: ["Item one", "Item two"] },
  { label: "Group two", items: ["Item three", "Item four", "Item five"] },
  { label: "Group three", items: ["Item six", "Item seven"] },
];

export function DrawerSpecimen() {
  return (
    <Drawer defaultOpen>
      <DrawerTrigger className="text-sm">Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle className="sr-only">Drawer specimen</DrawerTitle>
        <div className="flex flex-col pb-2 text-foreground">
          {GROUPS.map((group) => (
            <div
              key={group.label}
              className="flex flex-col border-border-1 border-t-hairline py-2 first:border-t-0"
            >
              <div className="px-3 py-1 text-muted-foreground">
                {group.label}
              </div>
              {group.items.map((item) => (
                <div key={item} className="px-3 py-2">
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
