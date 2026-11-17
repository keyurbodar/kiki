import { cx } from "class-variance-authority";
import { type KeyboardEvent, useState } from "react";
import {
  ChainLink,
  CircleBan,
  CrossSmall,
  issueMenuEmpty,
  issueMenuIcon,
  issueMenuInput,
  issuePropertyGlyph,
  issuePropertyValue,
  PlusLarge,
} from "@/components/issue-parts";
import {
  type IssueRelationKind,
  issueRelationKinds,
} from "@/data/api/schemas/issue";
import { Button } from "@/primitives/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";

export const relationLabels: Record<IssueRelationKind, string> = {
  blocked_by: "Blocked by",
  blocks: "Blocking",
  related: "Related to",
};

const addTrigger = cx(
  issuePropertyValue,
  "text-muted-foreground-2 hover:text-foreground",
);

const keepMenuKeys =
  (submit: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
    if (event.key !== "Escape") event.stopPropagation();
  };

/** A hover-revealed × that unlinks a row (Capy's UnlinkButton). */
export function UnlinkButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="bare"
      size="icon-shrink"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="opacity-0 group-hover/link:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
    >
      <CrossSmall className="size-(--icon-xs)" />
    </Button>
  );
}

/** "+ Link pull request" / "+ Link thread": paste a reference to link it. */
export function LinkMenu({
  label,
  placeholder,
  onLink,
}: {
  label: string;
  placeholder: string;
  onLink: (ref: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = query.trim();
  const submit = () => {
    if (ref === "") return;
    onLink(ref);
    setQuery("");
    setOpen(false);
  };
  return (
    <Menu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <MenuTrigger render={<button type="button" className={addTrigger} />}>
        <span className={issuePropertyGlyph}>
          <PlusLarge className="size-3" />
        </span>
        {label}
      </MenuTrigger>
      <MenuContent align="start" className="w-72">
        <div data-slot="menu-search-row">
          <input
            className={issueMenuInput}
            placeholder={placeholder}
            value={query}
            // biome-ignore lint/a11y/noAutofocus: Capy focuses the reference field as the menu opens
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={keepMenuKeys(submit)}
          />
        </div>
        {ref === "" ? (
          <div className={issueMenuEmpty}>Paste a reference to link</div>
        ) : (
          <MenuItem onClick={submit}>
            <span className={issueMenuIcon}>
              <PlusLarge />
            </span>
            <span className="min-w-0 truncate">Link {ref}</span>
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

/** "+ Add relation": type an issue code, then pick how it relates. */
export function RelationMenu({
  onRelate,
}: {
  onRelate: (relation: IssueRelationKind, code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const code = query.trim().toUpperCase();
  const submit = (relation: IssueRelationKind) => {
    if (code === "") return;
    onRelate(relation, code);
    setQuery("");
    setOpen(false);
  };
  return (
    <Menu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <MenuTrigger render={<button type="button" className={addTrigger} />}>
        <span className={issuePropertyGlyph}>
          <PlusLarge className="size-3" />
        </span>
        Add relation
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        <div data-slot="menu-search-row">
          <input
            className={issueMenuInput}
            placeholder="Issue code like CAP-12"
            value={query}
            // biome-ignore lint/a11y/noAutofocus: Capy focuses the code field as the menu opens
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={keepMenuKeys(() => submit("blocked_by"))}
          />
        </div>
        {code === "" ? (
          <div className={issueMenuEmpty}>Type an issue code</div>
        ) : (
          issueRelationKinds.map((relation) => (
            <MenuItem key={relation} onClick={() => submit(relation)}>
              <span className={issueMenuIcon}>
                {relation === "related" ? <ChainLink /> : <CircleBan />}
              </span>
              <span className="min-w-0 truncate">
                {relationLabels[relation]} {code}
              </span>
            </MenuItem>
          ))
        )}
      </MenuContent>
    </Menu>
  );
}
