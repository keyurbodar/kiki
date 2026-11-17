import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { SettingsRow } from "@/primitives/settings-row";

export type ListingItem = {
  readonly name: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly trailing?: ReactNode;
  readonly detail?: ReactNode;
};

export const countedListLabel = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export type ItemRowProps = { item: ListingItem };

export function ItemRow({ item }: ItemRowProps) {
  const [open, setOpen] = useState(false);
  const description = item.description === "" ? undefined : item.description;
  const detail = item.detail;
  return (
    <>
      <SettingsRow
        data-track-owner="shared/listing-items.tsx#ItemRow:SettingsRow.1"
        icon={item.icon}
        label={item.name}
        description={description}
        onClick={detail === undefined ? undefined : () => setOpen(true)}
      >
        {item.trailing !== undefined && (
          <span className="text-sm text-muted-foreground-2 tabular-nums">
            {item.trailing}
          </span>
        )}
      </SettingsRow>
      {detail !== undefined && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{item.name}</DialogTitle>
              {description !== undefined && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">{detail}</DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export type CountedListProps = {
  noun: string;
  items: ReadonlyArray<ListingItem>;
  limit?: number;
};

export function CountedList({ noun, items, limit = 5 }: CountedListProps) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, limit);
  return (
    <section className="flex flex-col gap-2">
      <Card rows>
        <CardListHeader>{countedListLabel(items.length, noun)}</CardListHeader>
        {visible.map((item) => (
          <ItemRow key={item.name} item={item} />
        ))}
      </Card>
      {items.length > limit && (
        <Button
          data-track-owner="shared/listing-items.tsx#CountedList:Button.1"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : `View ${items.length - limit} more`}
        </Button>
      )}
    </section>
  );
}
