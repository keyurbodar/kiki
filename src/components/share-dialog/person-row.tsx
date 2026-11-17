import { cn } from "@/lib/cn";
import { Button } from "@/primitives/button";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { ChevronRightSmallIcon, CrossIcon, DotsHorizontalIcon } from "./icons";
import { PersonAvatar } from "./person-avatar";
import { type PersonState, usePeople } from "./share-data";

export type PersonRowProps = {
  name: string;
  imageUrl?: string;
  state: PersonState;
  onRemove?: () => void;
  size?: "xs" | "sm";
  disabled?: boolean;
  onTransfer?: () => void;
};

export function PersonRow({
  name,
  imageUrl,
  state,
  onRemove,
  size = "xs",
  disabled = false,
  onTransfer,
}: PersonRowProps) {
  const note =
    size === "sm"
      ? "text-sm text-muted-foreground-1"
      : "text-2xs text-muted-foreground-3";
  return (
    <li
      className={cn(
        size === "sm"
          ? "flex min-h-9 items-center gap-2.5 text-sm"
          : "flex h-7 items-center gap-2 rounded px-2 text-xs",
        state === "dropping" && "opacity-40",
      )}
    >
      <PersonAvatar src={imageUrl} name={name} size="xs" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          state === "dropping" && "line-through",
        )}
      >
        {name}
      </span>
      {state === "owner" ? <span className={note}>Owner</span> : null}
      {state === "unsubscribed" ? (
        <span className={note}>Unsubscribed</span>
      ) : null}
      {state === "adding" ? <span className={note}>Adding</span> : null}
      {onTransfer === undefined ? null : (
        <ResponsiveMenu>
          <MenuTrigger
            data-track-owner="shared/share-dialog.tsx#PersonRow:ResponsiveMenuTrigger.1"
            render={
              <Button
                data-track-owner="shared/share-dialog.tsx#PersonRow:Button.1"
                variant="bare"
                size="icon-shrink"
                aria-label={`Manage ${name}`}
                disabled={disabled}
              >
                <DotsHorizontalIcon />
              </Button>
            }
          />
          <MenuContent>
            <ResponsiveMenuItem
              data-track-owner="shared/share-dialog.tsx#PersonRow:ResponsiveMenuItem[Transfer ownership]"
              onClick={onTransfer}
            >
              Transfer ownership
            </ResponsiveMenuItem>
          </MenuContent>
        </ResponsiveMenu>
      )}
      {onRemove === undefined ? null : state === "dropping" ? (
        <Button
          data-track-owner="shared/share-dialog.tsx#PersonRow:Button[Undo]"
          variant="bare"
          size="xs"
          onClick={onRemove}
          disabled={disabled}
        >
          Undo
        </Button>
      ) : (
        <Button
          data-track-owner="shared/share-dialog.tsx#PersonRow:Button[onClick=onRemove]"
          variant="bare"
          size="icon-shrink"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          disabled={disabled}
        >
          <CrossIcon className="size-3" />
        </Button>
      )}
    </li>
  );
}

export type ListedPerson = {
  readonly userId: string;
  readonly state: PersonState;
};

export type PeopleListProps = {
  ownerUserId: string;
  people: ReadonlyArray<ListedPerson>;
  limit?: number;
  onMore?: () => void;
  onToggle?: (person: ListedPerson) => void;
  disabled?: boolean;
  onTransfer?: () => void;
};

export function PeopleList({
  ownerUserId,
  people,
  limit,
  onMore,
  onToggle,
  disabled = false,
  onTransfer,
}: PeopleListProps) {
  const { nameOf, avatarOf } = usePeople();
  if (
    limit !== undefined &&
    onMore !== undefined &&
    people.length + 1 > limit
  ) {
    const everyone = [ownerUserId, ...people.map((person) => person.userId)];
    return (
      <ul className="flex flex-col divide-y-(length:--border-hairline) divide-border-1">
        <li>
          <button
            data-track-owner="shared/share-dialog.tsx#PeopleList:button[onClick=onMore]"
            type="button"
            className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded text-sm outline-none focus-visible:outline-ring-inset"
            onClick={onMore}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex items-center">
                {everyone.slice(0, 4).map((userId, index) => (
                  <PersonAvatar
                    key={userId}
                    src={avatarOf(userId)}
                    name={nameOf(userId)}
                    size="stack"
                    className={index > 0 ? "-ml-2" : undefined}
                  />
                ))}
              </span>
              <span className="font-medium text-foreground">{`${everyone.length} people`}</span>
            </span>
            <ChevronRightSmallIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
          </button>
        </li>
      </ul>
    );
  }
  return (
    <ul className="flex flex-col divide-y-(length:--border-hairline) divide-border-1">
      <PersonRow
        size="sm"
        name={nameOf(ownerUserId)}
        imageUrl={avatarOf(ownerUserId)}
        state="owner"
        disabled={disabled}
        onTransfer={onTransfer}
      />
      {people.map((person) => (
        <PersonRow
          key={person.userId}
          size="sm"
          name={nameOf(person.userId)}
          imageUrl={avatarOf(person.userId)}
          state={person.state}
          onRemove={onToggle === undefined ? undefined : () => onToggle(person)}
          disabled={disabled}
        />
      ))}
    </ul>
  );
}
