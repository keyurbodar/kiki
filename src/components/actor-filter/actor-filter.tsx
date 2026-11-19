import { type ReactNode, useState } from "react";
import {
  menuCheckClassName,
  menuIconSlotClassName,
} from "@/components/view-toolbar";
import { MenuLabel, MenuSearchRow } from "@/primitives/menu";
import {
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
} from "@/primitives/responsive-menu";
import {
  type ActorFilter,
  type ActorToggle,
  actorCount,
  captainScopeLabels,
  captainScopes,
} from "../issues-filters/filters";
import {
  BellGlyph,
  CheckGlyph,
  CrownGlyph,
  PersonGlyph,
} from "../issues-toolbar/glyphs";

/** A person, Captain or thread the actor filter can pick. */
export type ActorOption = {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
};

export type ActorSources = {
  readonly me: ActorOption | undefined;
  readonly people: ReadonlyArray<ActorOption>;
  readonly captains: ReadonlyArray<ActorOption>;
  readonly threads: ReadonlyArray<ActorOption>;
};

export const emptyActorSources: ActorSources = {
  me: undefined,
  people: [],
  captains: [],
  threads: [],
};

/** Capy shows this many recent threads before the user searches. */
export const recentThreadLimit = 8;

const matches = (terms: ReadonlyArray<string>, query: string) =>
  query === "" || terms.some((term) => term.toLowerCase().includes(query));

/** Capy's ActorRow: icon slot, label, trailing check; keeps the menu open. */
export function ActorRow({
  leading,
  label,
  checked,
  onClick,
}: {
  leading: ReactNode;
  label: ReactNode;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <ResponsiveMenuItem closeOnClick={false} onClick={onClick}>
      <span className={menuIconSlotClassName}>{leading}</span>
      <span className="min-w-0 truncate">{label}</span>
      {checked ? (
        <CheckGlyph className={`ml-auto ${menuCheckClassName}`} />
      ) : null}
    </ResponsiveMenuItem>
  );
}

export function MenuSearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <MenuSearchRow className="flex shrink-0 items-center">
      <input
        className="h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key !== "Escape" &&
            event.key !== "ArrowDown" &&
            event.key !== "ArrowUp" &&
            (event.key !== "ArrowLeft" || value !== "")
          )
            event.stopPropagation();
        }}
      />
    </MenuSearchRow>
  );
}

const sectionLabel =
  "mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

/** Capy's ActorFilterItems: Me, Captain scopes, none, people, Captains, threads. */
export function ActorFilterItems({
  placeholder,
  filter,
  noneLabel,
  sources,
  onToggle,
}: {
  placeholder: string;
  filter: ActorFilter;
  noneLabel?: string;
  sources: ActorSources;
  onToggle: (toggle: ActorToggle) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const people = sources.people.filter(
    (person) => person.id !== sources.me?.id && matches([person.label], needle),
  );
  const captains = sources.captains.filter((captain) =>
    matches([captain.label], needle),
  );
  const captainIds = new Set(sources.captains.map((captain) => captain.id));
  const threads = sources.threads
    .filter((thread) => !captainIds.has(thread.id))
    .filter((thread) => matches([thread.label], needle))
    .slice(0, needle === "" ? recentThreadLimit : undefined);
  const showMe = matches(["me", sources.me?.label ?? ""], needle);
  const scopes = captainScopes.filter((scope) =>
    matches([captainScopeLabels[scope], "captain", "crew", scope], needle),
  );
  const showNone =
    noneLabel !== undefined &&
    matches([noneLabel, "none", "unassigned"], needle);
  const empty =
    !showMe &&
    !showNone &&
    scopes.length === 0 &&
    people.length + captains.length + threads.length === 0;
  return (
    <>
      <MenuSearchInput
        placeholder={placeholder}
        value={query}
        onChange={setQuery}
      />
      {empty ? (
        <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
          No results
        </div>
      ) : null}
      {showMe ? (
        <ActorRow
          leading={sources.me?.icon ?? <PersonGlyph />}
          label="Me"
          checked={filter.me}
          onClick={() => onToggle({ kind: "me" })}
        />
      ) : null}
      {scopes.map((scope) => (
        <ActorRow
          key={scope}
          leading={scope === "subscribed" ? <BellGlyph /> : <CrownGlyph />}
          label={captainScopeLabels[scope]}
          checked={filter.captains === scope}
          onClick={() => onToggle({ kind: "captains", scope })}
        />
      ))}
      {showNone ? (
        <ActorRow
          leading={<PersonGlyph />}
          label={noneLabel}
          checked={filter.none}
          onClick={() => onToggle({ kind: "none" })}
        />
      ) : null}
      {people.length > 0 ? (
        <>
          {showMe || showNone || scopes.length > 0 ? (
            <ResponsiveMenuSeparator />
          ) : null}
          <MenuLabel className={sectionLabel}>People</MenuLabel>
          {people.map((person) => (
            <ActorRow
              key={person.id}
              leading={person.icon}
              label={person.label}
              checked={filter.userIds.includes(person.id)}
              onClick={() => onToggle({ kind: "user", id: person.id })}
            />
          ))}
        </>
      ) : null}
      {captains.length > 0 ? (
        <>
          <ResponsiveMenuSeparator />
          <MenuLabel className={sectionLabel}>Captains</MenuLabel>
          <div className="px-2 pb-1 text-xs font-normal text-muted-foreground-3">
            Includes each Captain's crew threads
          </div>
          {captains.map((captain) => (
            <ActorRow
              key={captain.id}
              leading={captain.icon}
              label={captain.label}
              checked={filter.jamIds.includes(captain.id)}
              onClick={() => onToggle({ kind: "jam", id: captain.id })}
            />
          ))}
        </>
      ) : null}
      {threads.length > 0 ? (
        <>
          <ResponsiveMenuSeparator />
          <MenuLabel className={sectionLabel}>
            {needle === "" ? "Recent threads" : "Threads"}
          </MenuLabel>
          {threads.map((thread) => (
            <ActorRow
              key={thread.id}
              leading={thread.icon}
              label={thread.label}
              checked={filter.jamIds.includes(thread.id)}
              onClick={() => onToggle({ kind: "jam", id: thread.id })}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

/** The chip value for an actor filter: up to two names, else a count. */
export function ActorFilterValue({
  filter,
  noun,
  noneLabel,
  meLabel = "Me",
  sources,
}: {
  filter: ActorFilter;
  noun: string;
  noneLabel?: string;
  meLabel?: string;
  sources: ActorSources;
}) {
  const count = actorCount(filter);
  if (count > 2)
    return (
      <span className="truncate">
        {count} {noun}
      </span>
    );
  const known = [...sources.people, ...sources.captains, ...sources.threads];
  const parts: Array<{ key: string; icon: ReactNode; label: string }> = [
    ...(filter.me
      ? [
          {
            key: "me",
            icon: sources.me?.icon ?? <PersonGlyph />,
            label: meLabel,
          },
        ]
      : []),
    ...(filter.captains === null
      ? []
      : [
          {
            key: "captains",
            icon:
              filter.captains === "subscribed" ? <BellGlyph /> : <CrownGlyph />,
            label: captainScopeLabels[filter.captains],
          },
        ]),
    ...(filter.none && noneLabel !== undefined
      ? [{ key: "none", icon: <PersonGlyph />, label: noneLabel }]
      : []),
    ...[...filter.userIds, ...filter.jamIds].map((id) => {
      const option = known.find((candidate) => candidate.id === id);
      return {
        key: id,
        icon: option?.icon ?? <PersonGlyph />,
        label: option?.label ?? id,
      };
    }),
  ];
  return (
    <span className="flex min-w-0 items-center gap-2">
      {parts.map((part) => (
        <span
          key={part.key}
          className="flex min-w-0 items-center gap-1 [&_svg]:size-3 [&_svg]:shrink-0"
        >
          {part.icon}
          <span className="truncate">{part.label}</span>
        </span>
      ))}
    </span>
  );
}

/** A round actor avatar: the image, or the name's initial. */
export function ActorAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return avatarUrl === null ? (
    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-orange text-xs leading-none font-medium text-background">
      {name.slice(0, 1).toUpperCase()}
    </span>
  ) : (
    <img
      src={avatarUrl}
      alt=""
      className="size-3.5 shrink-0 rounded-full object-cover"
    />
  );
}
