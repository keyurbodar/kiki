import { type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { menuRowVariants } from "@/primitives/menu";
import { PersonAvatar } from "./person-avatar";
import { displayName, type OrgMember, usePeople } from "./share-data";

const searchKeysOf = (member: OrgMember) => [
  displayName(member) ?? member.userId,
  member.email ?? "",
];

const rankOf = (key: string, query: string) => {
  const value = key.toLowerCase();
  if (value.startsWith(query)) return 3;
  if (value.split(/[\s@._-]+/).some((word) => word.startsWith(query))) return 2;
  return value.includes(query) ? 1 : 0;
};

export const pickablePeople = (
  members: ReadonlyArray<OrgMember>,
  excluded: ReadonlySet<string>,
  bound: ReadonlySet<string> | undefined,
  query: string,
): ReadonlyArray<OrgMember> => {
  const allowed = members.filter(
    (member) =>
      !excluded.has(member.userId) &&
      (bound === undefined || bound.has(member.userId)),
  );
  const needle = query.trim().toLowerCase();
  if (needle === "") return allowed;
  return allowed
    .map((member, index) => ({
      member,
      index,
      rank: Math.max(...searchKeysOf(member).map((key) => rankOf(key, needle))),
    }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .map((entry) => entry.member);
};

export type PeopleFieldProps = {
  excluded: ReadonlySet<string>;
  batchLimit: number;
  disabled: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  bound?: ReadonlySet<string>;
  onPick: (userId: string) => void;
  children?: ReactNode;
  busy?: boolean;
  description?: string;
};

export function PeopleField({
  excluded,
  batchLimit,
  disabled,
  autoFocus,
  placeholder = "Add people",
  bound,
  onPick,
  children,
  busy = false,
  description,
}: PeopleFieldProps) {
  const { members } = usePeople();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const matches = pickablePeople(members, excluded, bound, query);
  return (
    <div
      className={cn(
        "flex flex-col",
        description === undefined ? "gap-1.5" : "gap-3",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "flex min-h-(--h-control-base) w-full items-center rounded px-1.5 py-1",
            "border-hairline border-border-2 bg-input",
            "focus-within:outline-ring-inset",
          )}
        >
          <input
            ref={input}
            value={query}
            placeholder={placeholder}
            aria-label={placeholder}
            // biome-ignore lint/a11y/noAutofocus: the share dialog focuses its people field when it opens
            autoFocus={autoFocus}
            readOnly={busy}
            className={cn(
              "min-w-24 flex-1 bg-transparent text-sm font-normal text-foreground outline-none",
              "placeholder:text-muted-foreground-3 selection:bg-primary-20",
            )}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {description === undefined ? null : (
          <span className="text-xs text-muted-foreground-2">{description}</span>
        )}
        {disabled && !busy ? (
          <span className="text-2xs text-muted-foreground-3">{`Pick up to ${batchLimit} at a time`}</span>
        ) : null}
      </div>
      {query.trim() === "" ? (
        children
      ) : (
        <ul className="flex max-h-40 flex-col gap-px overflow-y-auto">
          {matches.length === 0 ? (
            <li className="flex h-7 items-center px-2 text-2xs text-muted-foreground-3">
              No people match
            </li>
          ) : (
            matches.map((member) => {
              const name = displayName(member) ?? member.userId;
              return (
                <li key={member.userId}>
                  <button
                    data-track-owner="shared/share-dialog.tsx#PeopleField:button.1"
                    type="button"
                    className={menuRowVariants({ interaction: "button" })}
                    disabled={disabled || busy}
                    onClick={() => {
                      onPick(member.userId);
                      setQuery("");
                      input.current?.focus();
                    }}
                  >
                    <PersonAvatar src={member.imageUrl} name={name} size="xs" />
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
