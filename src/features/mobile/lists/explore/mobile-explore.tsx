import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, ButtonIcon } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input, InputGroup } from "@/primitives/input";
import {
  MobileSheet,
  MobileSheetRow,
  MobileSheetSeparator,
} from "../../sheets";
import { MobileListHeader } from "../list-header";
import { MobileListEmpty, MobileListLoading } from "../list-states";
import type { MobileListing } from "./explore-data";
import { useMobileExplore } from "./explore-data";

const exploreKinds = [
  { key: "plugins", label: "Plugins", href: "/explore" },
  { key: "skills", label: "Skills", href: "/explore?tab=skill" },
  { key: "themes", label: "Themes", href: "/explore?tab=theme" },
] as const;

const categories = [
  "featured",
  "recent",
  "developer-tools",
  "productivity",
  "design",
  "docs",
  "monitoring",
  "payments",
  "database",
  "deployment",
  "integrations",
  "other",
] as const;

export type MobileExploreProps = {
  kind?: (typeof exploreKinds)[number]["key"];
};

/** Page 19's explore list: hero, search, kinds and category sections. */
export function MobileExplore({ kind = "plugins" }: MobileExploreProps) {
  const { rows, waiting } = useMobileExplore();
  const [search, setSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const needle = search.trim().toLowerCase();
  const matching = rows.filter((row) =>
    needle === ""
      ? true
      : `${row.name} ${row.description}`.toLowerCase().includes(needle),
  );
  const byCategory = (value: string) =>
    matching.filter((row) => row.category === value);
  const featured = category === undefined ? matching : byCategory(category);
  const recent = matching.slice(0, 4);
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <MobileListHeader
        gap="wide"
        title={
          <div className="flex min-w-0 flex-1 items-center">
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1 pl-2.5"
            >
              <Link
                to="/explore"
                className="shrink-0 rounded text-sm font-medium text-muted-foreground-1 transition-colors duration-100 hover:text-foreground"
              >
                Explore
              </Link>
              <Icon
                name="chevron-right"
                size="sm"
                className="text-icon-muted"
              />
              <span className="truncate text-sm font-medium text-foreground">
                {exploreKinds.find((entry) => entry.key === kind)?.label}
              </span>
            </nav>
          </div>
        }
      />
      <div className="flex flex-col gap-5 px-6 pt-12 pb-6">
        <h1 className="text-xl font-medium text-foreground">
          {exploreKinds.find((entry) => entry.key === kind)?.label}
        </h1>
        <InputGroup className="relative flex w-full">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-muted">
            <Icon name="magnifying-glass" size="sm" />
          </span>
          <Input
            aria-label="Search Explore"
            placeholder="Search plugins"
            className="h-(--h-control-base) w-full rounded border-(length:--border-width-hairline) border-border-2 bg-input pl-8 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <div className="flex items-center justify-between gap-2">
          <nav
            aria-label="Explore types"
            className="-ml-2 flex items-center gap-1"
          >
            {exploreKinds.map((entry) => (
              <Button
                key={entry.key}
                render={<a href={entry.href} />}
                variant="ghost"
                size="auto-sm"
                aria-current={entry.key === kind}
              >
                {entry.label}
              </Button>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="auto-sm"
            aria-haspopup="dialog"
            onClick={() => setCategoriesOpen(true)}
          >
            Categories
            <ButtonIcon>
              <Icon name="chevron-down-small" />
            </ButtonIcon>
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {waiting ? (
          <MobileListLoading label="Loading Explore" />
        ) : matching.length === 0 ? (
          <MobileListEmpty
            line="No plugins match that search"
            sub="Try another word or clear the search"
            action={{ label: "Clear search", onClick: () => setSearch("") }}
          />
        ) : (
          <div className="flex flex-col gap-9 px-6 pb-18">
            <ListingSection
              label={category === undefined ? "Featured" : titleCase(category)}
              rows={featured}
              emptyLine="No featured plugins yet"
              emptySub="Newly listed plugins appear here"
            />
            {category === undefined ? (
              <ListingSection
                label="Recently added"
                rows={recent}
                emptyLine="No new plugins yet"
                emptySub="Newly listed plugins appear here"
              />
            ) : null}
          </div>
        )}
      </div>
      <MobileSheet
        label="Categories"
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      >
        <MobileSheetRow
          label="All categories"
          aria-checked={category === undefined}
          onClick={() => setCategory(undefined)}
        />
        <MobileSheetSeparator />
        {categories
          .filter((entry) => entry !== "featured" && entry !== "recent")
          .map((entry) => (
            <MobileSheetRow
              key={entry}
              label={titleCase(entry)}
              aria-checked={category === entry}
              onClick={() => setCategory(entry)}
            />
          ))}
      </MobileSheet>
    </div>
  );
}

function ListingSection({
  label,
  rows,
  emptyLine,
  emptySub,
}: {
  label: string;
  rows: ReadonlyArray<MobileListing>;
  emptyLine: string;
  emptySub: string;
}) {
  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-foreground">{label}</h2>
      {rows.length === 0 ? (
        <p className="text-sm font-normal text-muted-foreground-2">
          {emptyLine}. {emptySub}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map((row) => (
            <ListingRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function ListingRow({ row }: { row: MobileListing }) {
  return (
    <div
      data-slot="listing-card"
      className="group -mx-2 flex h-14 min-w-0 items-center gap-3 rounded px-2"
    >
      <span className="relative flex w-fit shrink-0">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-secondary text-foreground">
          {row.iconUrl === null ? (
            <Icon name="plugin-1" size="lg" />
          ) : (
            <img src={row.iconUrl} alt="" className="size-full object-cover" />
          )}
        </span>
        {row.verified ? (
          <span
            role="img"
            aria-label="Verified by Capy"
            className="absolute -right-1.25 -bottom-1.25 flex rounded-full bg-panel p-0.5 text-foreground"
          >
            <Icon name="form-seal" size="sm" />
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">
          {row.name}
        </span>
        <span className="truncate text-sm text-muted-foreground-2">
          {row.description}
        </span>
      </span>
    </div>
  );
}

const titleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
