import { useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Cause } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import {
  type ExploreListing,
  ExploreNotFound,
  type ListingKind,
  listingKey,
} from "@/data/api/schemas/explore";
import { listingDetailAtom, listingDetailKey } from "@/data/atoms/explore";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card, CardContent } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { ListingAddAction } from "../listing-add-action";
import { type Crumb, ExploreCrumbs } from "./explore-crumbs";
import { useAddedSet, useSignedIn, useUpdatesSet } from "./explore-session";
import {
  fileMarkdown,
  hasSetup,
  kindLabels,
  kindPaths,
  lineCount,
  shortDate,
  shortVersion,
  trimPeriod,
} from "./format";
import { CheckmarkGlyph } from "./glyphs";
import { ListingIcon } from "./listing-icon";
import {
  CountedList,
  FileDetail,
  type ListingItem,
  ServerList,
} from "./listing-items";
import { type Installed, ListingSetupPanel } from "./listing-setup";
import { ListingSidebar } from "./listing-sidebar";
import { SignInLink } from "./sign-in-link";

const pageLayout =
  "mx-auto flex w-full max-w-229 flex-col gap-10 px-6 pt-10 pb-18 lg:flex-row lg:gap-14 lg:px-0";

export const listingCrumbs = (
  kind: ListingKind,
  slug: string,
  name?: string,
): Crumb[] => [
  { label: "Explore", to: "/explore" },
  {
    label: kindLabels[kind],
    to: kind === "plugin" ? "/explore" : `/explore/${kindPaths[kind]}`,
  },
  { label: name ?? slug },
];

function PageFrame({
  crumbs,
  children,
}: {
  crumbs: ReadonlyArray<Crumb>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <ExploreCrumbs crumbs={crumbs} />
      {children}
    </div>
  );
}

function Scroller({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <ScrollAreaViewport className="size-full overscroll-contain">
        {children}
      </ScrollAreaViewport>
    </ScrollArea>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading" className={pageLayout}>
      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-160">
        <SkeletonPanel className="size-11 rounded-(--radius-card)" />
        <div className="flex flex-col gap-2">
          <SkeletonPanel className="h-5 w-40" />
          <SkeletonPanel className="h-3.5 w-72" />
        </div>
        <SkeletonPanel className="h-48 w-full rounded-(--radius-panel)" />
      </div>
      <div className="flex flex-col gap-4 lg:w-55 lg:pt-17">
        <SkeletonPanel className="h-8 w-24" />
        <SkeletonPanel className="h-8 w-32" />
        <SkeletonPanel className="h-8 w-28" />
      </div>
    </div>
  );
}

export function NotListed({ failed }: { failed: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col px-6 pt-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground-2">
            {failed
              ? "Capy couldn't load this item"
              : "This item is not listed in Explore"}
          </p>
          {failed ? (
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload
            </Button>
          ) : (
            <Button size="sm" render={<Link to="/explore" />}>
              Back to Explore
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const fileItem = (file: { path: string; content: string }): ListingItem => ({
  key: file.path,
  icon: <Icon name="file-text" />,
  name: file.path,
  description: lineCount(file.content),
  detail: <FileDetail markdown={fileMarkdown(file.path, file.content)} />,
});

export function ListingDetail({ listing }: { listing: ExploreListing }) {
  const card = listing.card;
  const content = listing.content;
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const added = useAddedSet();
  const updates = useUpdatesSet();
  const [justInstalled, setJustInstalled] = useState<Installed | null>(null);
  const key = listingKey(card);
  const setup = hasSetup(card) ? listing.setup : null;
  const installed =
    justInstalled ??
    (setup !== null && added.has(key)
      ? { project: "", installationId: null }
      : null);

  const manage = () =>
    card.kind === "skill"
      ? void navigate({ to: "/drive" })
      : void navigate({ to: "/settings/mcp" });

  const action =
    setup !== null && signedIn && updates.has(key) ? (
      <ListingAddAction listing={listing} added size="base" />
    ) : setup === null ? (
      signedIn || card.builtIn !== null ? (
        <ListingAddAction
          listing={listing}
          added={added.has(key)}
          size="base"
        />
      ) : (
        <SignInLink size="base">Sign in to add</SignInLink>
      )
    ) : (
      signedIn &&
      installed !== null && (
        <>
          <Badge color="success">
            <CheckmarkGlyph size="xs" />
            {installed.project === ""
              ? "Installed"
              : `Installed in ${installed.project}`}
          </Badge>
          <Button size="base" onClick={manage}>
            Manage
          </Button>
        </>
      )
    );

  return (
    <PageFrame crumbs={listingCrumbs(card.kind, card.slug, card.displayName)}>
      <Scroller>
        <div className={pageLayout}>
          <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-160">
            <ListingIcon card={card} size="lg" />
            <header className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="min-w-32 flex-1 text-xl font-medium text-foreground">
                  <span className="truncate">{card.displayName}</span>
                </h1>
                <div className="flex shrink-0 items-center gap-2">{action}</div>
              </div>
              <p className="text-sm text-muted-foreground-1">
                {trimPeriod(card.description)}
              </p>
            </header>
            {setup !== null && (
              <ListingSetupPanel
                listing={listing}
                setup={setup}
                installed={installed}
                onInstalled={setJustInstalled}
              />
            )}
            {content.kind === "plugin" && (
              <>
                <CountedList
                  noun="skill"
                  items={content.plugin.skills.map((skill) => ({
                    key: skill.name,
                    icon: <Icon name="books" />,
                    name: skill.name,
                    description: trimPeriod(skill.description),
                    detail:
                      skill.content === null ? undefined : (
                        <FileDetail
                          markdown={fileMarkdown("SKILL.md", skill.content)}
                        />
                      ),
                  }))}
                />
                <ServerList
                  icon={<ListingIcon card={card} size="xs" />}
                  maker={card.maker?.name ?? card.displayName}
                  servers={content.plugin.servers}
                />
              </>
            )}
            {content.kind === "skill" && (
              <CountedList
                noun="file"
                limit={Number.POSITIVE_INFINITY}
                items={content.skill.files.map(fileItem)}
              />
            )}
            <CountedList
              noun="version"
              items={listing.versions.map((version) => ({
                key: version.id,
                icon: <Icon name="file-text" />,
                name: shortVersion(version.version),
                description:
                  version.notes === null || version.notes === ""
                    ? undefined
                    : trimPeriod(version.notes),
                trailing: shortDate(version.createdAt),
              }))}
            />
          </div>
          <ListingSidebar listing={listing} />
        </div>
      </Scroller>
    </PageFrame>
  );
}

export const isNotFound = (cause: Cause.Cause<unknown>) =>
  Cause.squash(cause) instanceof ExploreNotFound;

export type ListingDetailPageProps = { kind: ListingKind; slug: string };

export function ListingDetailPage({ kind, slug }: ListingDetailPageProps) {
  const result = useAtomValue(listingDetailAtom(listingDetailKey(kind, slug)));
  if (AsyncResult.isSuccess(result))
    return <ListingDetail listing={result.value} />;
  const crumbs = listingCrumbs(kind, slug);
  return (
    <PageFrame crumbs={crumbs}>
      {AsyncResult.isFailure(result) ? (
        <NotListed failed={!isNotFound(result.cause)} />
      ) : (
        <ListingDetailSkeleton />
      )}
    </PageFrame>
  );
}
