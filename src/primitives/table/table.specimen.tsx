import { useState } from "react";
import { Icon } from "@/primitives/icon";
import {
  SortableTableHeaderCell,
  type SortDirection,
  Table,
  TableActionRow,
  TableCell,
  TableGroup,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "./table";

const active = [
  { id: "Alpha workspace", owner: "Team A", size: 12 },
  { id: "Beta workspace", owner: "Team B", size: 4 },
];
const archived = { id: "Gamma workspace", owner: "Team C", size: 31 };
const rows = [...active, archived];

export function TableSpecimen() {
  const [direction, setDirection] = useState<SortDirection>("descending");
  return (
    <div className="flex flex-col gap-8 bg-panel p-6">
      <Table id="table-directory" columns="minmax(0,1fr) minmax(0,1fr) auto">
        <TableHeader>
          <SortableTableHeaderCell
            direction={direction}
            onSort={() =>
              setDirection(
                direction === "ascending" ? "descending" : "ascending",
              )
            }
          >
            Name
          </SortableTableHeaderCell>
          <TableHeaderCell>Owner</TableHeaderCell>
          <TableHeaderCell numeric sorted>
            Items
          </TableHeaderCell>
        </TableHeader>
        <TableGroup label="Active" count={2} />
        {active.map((row) => (
          <TableRow key={row.id}>
            <TableCell lead>{row.id}</TableCell>
            <TableCell>{row.owner}</TableCell>
            <TableCell numeric>{row.size}</TableCell>
          </TableRow>
        ))}
        <TableGroup label="Archived" count={1} />
        <TableRow interactive={false}>
          <TableCell lead>{archived.id}</TableCell>
          <TableCell>{archived.owner}</TableCell>
          <TableCell numeric>{archived.size}</TableCell>
        </TableRow>
      </Table>
      <Table id="table-card" card density="pick" columns="minmax(0,1fr) auto">
        <TableHeader>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell numeric>Items</TableHeaderCell>
        </TableHeader>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell lead>{row.id}</TableCell>
            <TableCell numeric>{row.size}</TableCell>
          </TableRow>
        ))}
        <TableActionRow icon={<Icon name="square-plus" />}>
          Add workspace
        </TableActionRow>
      </Table>
      <Table
        id="table-compact"
        flush
        density="compact"
        columns="minmax(0,1fr) auto"
      >
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell lead>{row.id}</TableCell>
            <TableCell numeric>{row.size}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
