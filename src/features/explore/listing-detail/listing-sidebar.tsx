import type { ReactNode } from "react";
import type { ExploreListing } from "@/data/api/schemas/explore";
import { ReportAction } from "../dialogs";
import {
  compactNumber,
  madeBy,
  permissions,
  repositoryLink,
  shortDate,
  shortVersion,
  starsTitle,
} from "./format";
import { ArrowUpRightGlyph, StarGlyph } from "./glyphs";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground-2">{label}</span>
      {children}
    </div>
  );
}

function Separator() {
  return <hr className="h-px shrink-0 border-0 bg-border-1" />;
}

export function ListingSidebar({ listing }: { listing: ExploreListing }) {
  const card = listing.card;
  const repository = repositoryLink(listing);
  const versionDate = listing.versions[0]?.createdAt ?? card.updatedAt;
  return (
    <aside className="flex flex-col gap-4.5 lg:w-55 lg:shrink-0 lg:pt-17">
      {card.stars !== null && (
        <Fact label="GitHub stars">
          <span
            title={starsTitle(card.starsCheckedAt)}
            className="flex items-center gap-1.5 text-sm text-foreground tabular-nums"
          >
            <StarGlyph size="sm" />
            {compactNumber(card.stars)}
          </span>
        </Fact>
      )}
      {repository !== undefined && (
        <Fact label="Repository">
          <a
            href={repository.href}
            target="_blank"
            rel="noreferrer"
            className="focus-gutter flex w-fit max-w-full items-center gap-1 rounded text-sm text-foreground outline-none hover:underline focus-visible:outline-ring-inset"
          >
            <span className="truncate">{repository.repository}</span>
            <ArrowUpRightGlyph size="xs" className="text-icon-muted" />
          </a>
        </Fact>
      )}
      <Fact label="Made by">
        <span className="text-sm text-foreground">{madeBy(card)}</span>
      </Fact>
      {card.source !== "user" && (
        <Fact label="Verified by">
          <span className="text-sm text-foreground">Capy</span>
        </Fact>
      )}
      {card.adds !== null && (
        <Fact label="Added">
          <span className="text-sm text-foreground tabular-nums">
            {card.adds === 1 ? "Once" : `${compactNumber(card.adds)} times`}
          </span>
        </Fact>
      )}
      {card.version !== null && (
        <Fact label="Version">
          <span className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {shortVersion(card.version)}
            </span>
            <span className="text-sm text-muted-foreground-2">
              {shortDate(versionDate)}
            </span>
          </span>
        </Fact>
      )}
      <Separator />
      <Fact label="Permissions">
        <ul className="flex flex-col gap-1.5">
          {permissions(listing).map((permission) => (
            <li
              key={permission}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground-2" />
              <span className="min-w-0 flex-1">{permission}</span>
            </li>
          ))}
        </ul>
      </Fact>
      <Separator />
      <div className="flex flex-col gap-1">
        <ReportAction card={card} />
      </div>
    </aside>
  );
}
