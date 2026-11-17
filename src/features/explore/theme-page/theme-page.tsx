import { useAtomValue } from "@effect/atom-react";
import { Cause } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { ExploreListing } from "@/data/api/schemas/explore";
import { ExploreNotFound, listingKey } from "@/data/api/schemas/explore";
import { listingDetailAtom, listingDetailKey } from "@/data/atoms/explore";
import { ReportAction } from "../dialogs";
import { ListingAddAction } from "../listing-add-action";
import {
  ExploreCrumbs,
  ListingDetail,
  ListingDetailSkeleton,
  listingCrumbs,
  NotListed,
} from "../listing-detail";
import { useAddedSet } from "../listing-detail/explore-session";
import { ThemeDetail } from "../theme-detail";
import { themeDetail } from "./theme-data";

export function ThemeListing({ listing }: { listing: ExploreListing }) {
  const detail = themeDetail(listing);
  const added = useAddedSet();
  if (detail === undefined) return <ListingDetail listing={listing} />;
  const crumbs = listingCrumbs(
    "theme",
    listing.card.slug,
    listing.card.displayName,
  );
  return (
    <ThemeDetail
      listing={detail.listing}
      theme={detail.theme}
      crumbs={crumbs}
      header={<ExploreCrumbs crumbs={crumbs} />}
      addAction={
        <ListingAddAction
          listing={listing}
          added={added.has(listingKey(listing.card))}
          size="base"
        />
      }
      report={<ReportAction card={listing.card} />}
    />
  );
}

export function ThemeListingPage({ slug }: { slug: string }) {
  const result = useAtomValue(
    listingDetailAtom(listingDetailKey("theme", slug)),
  );
  if (AsyncResult.isSuccess(result))
    return <ThemeListing listing={result.value} />;
  const failed =
    AsyncResult.isFailure(result) &&
    !(Cause.squash(result.cause) instanceof ExploreNotFound);
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <ExploreCrumbs crumbs={listingCrumbs("theme", slug)} />
      {AsyncResult.isFailure(result) ? (
        <NotListed failed={failed} />
      ) : (
        <ListingDetailSkeleton />
      )}
    </div>
  );
}
