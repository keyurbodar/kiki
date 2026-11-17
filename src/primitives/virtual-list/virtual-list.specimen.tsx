import { VirtualList } from ".";

const rows = Array.from({ length: 500 }, (_, index) => `Row ${index + 1}`);

export function VirtualListSpecimen() {
  return (
    <div className="h-80 w-72 rounded-(--radius-card) bg-card p-1">
      <VirtualList
        data={rows}
        keyExtractor={(row) => row}
        estimatedItemSize={28}
        renderItem={({ item }) => <p className="px-3 py-1 text-sm">{item}</p>}
      />
    </div>
  );
}
