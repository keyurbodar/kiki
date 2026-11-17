import { ScrollArea } from ".";

const rows = Array.from({ length: 40 }, (_, index) => `Row ${index + 1}`);

export function ScrollAreaSpecimen() {
  return (
    <div className="flex gap-6 p-6">
      {[false, true].map((fadeY) => (
        <ScrollArea
          key={String(fadeY)}
          fadeY={fadeY}
          className="h-60 w-60 rounded-(--radius-card) bg-card"
        >
          {rows.map((row) => (
            <p key={row} className="px-3 py-1 text-sm">
              {row}
            </p>
          ))}
        </ScrollArea>
      ))}
    </div>
  );
}
