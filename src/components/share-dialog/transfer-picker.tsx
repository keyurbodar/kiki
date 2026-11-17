import { PeopleField } from "./people-field";
import { PersonRow } from "./person-row";
import { usePeople } from "./share-data";

export type TransferPickerProps = {
  name: string;
  transferTo: string | null;
  excluded: ReadonlySet<string>;
  onPick: (userId: string | null) => void;
};

export function TransferPicker({
  name,
  transferTo,
  excluded,
  onPick,
}: TransferPickerProps) {
  const { nameOf, avatarOf } = usePeople();
  return (
    <div className="flex flex-col gap-3">
      <PeopleField
        excluded={excluded}
        batchLimit={1}
        disabled={false}
        placeholder={
          transferTo === null ? "Choose the new owner" : "Choose someone else"
        }
        onPick={onPick}
      >
        {transferTo === null ? (
          <span className="text-sm text-muted-foreground-2">{`${name} keeps working for its new owner`}</span>
        ) : (
          <ul className="flex flex-col">
            <PersonRow
              size="sm"
              name={nameOf(transferTo)}
              imageUrl={avatarOf(transferTo)}
              state="named"
              onRemove={() => onPick(null)}
            />
          </ul>
        )}
      </PeopleField>
      {transferTo === null ? null : (
        <span className="flex flex-col gap-1 text-sm text-muted-foreground-2">
          <span>{`${nameOf(transferTo)} becomes the owner and can rename, share, or delete ${name}`}</span>
          <span>You stay on it</span>
        </span>
      )}
    </div>
  );
}
