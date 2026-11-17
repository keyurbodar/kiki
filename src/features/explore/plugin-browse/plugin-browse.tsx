import { Menu } from "@base-ui/react/menu";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button, ButtonIcon } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuLevel,
} from "@/primitives/responsive-menu";
import peerArt from "./assets/peer.svg";
import sleepArt from "./assets/sleep.svg";
import {
  browsePlugins,
  PLUGIN_CATEGORIES,
  PLUGIN_CATEGORY_LABELS,
  type PluginBrowseCard,
  type PluginBrowseSearch,
} from "./catalog";

const owner = "features/explore/plugin-browse.tsx";
const gridClass = "grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2";
const art = { peer: peerArt, sleep: sleepArt };

export type PluginCardRenderer<Card> = (card: Card) => ReactNode;

function DefaultPluginCard({ card }: { card: PluginBrowseCard }) {
  return (
    <Link
      to="/explore/$kind/$slug"
      params={{ kind: "plugins", slug: card.slug }}
      className="flex min-w-0 items-center gap-3 rounded-(--radius-card) text-sm font-medium text-foreground outline-none focus-visible:outline-ring-inset"
    >
      {card.displayName}
    </Link>
  );
}

const defaultRenderCard = (card: PluginBrowseCard) => (
  <DefaultPluginCard key={card.slug} card={card} />
);

export type PluginShelfProps<Card extends PluginBrowseCard> = {
  title: string;
  cards: Card[];
  onViewAll?: () => void;
  renderCard?: PluginCardRenderer<Card>;
};

export function PluginShelf<Card extends PluginBrowseCard>({
  title,
  cards,
  onViewAll,
  renderCard = defaultRenderCard,
}: PluginShelfProps<Card>) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {onViewAll !== undefined && (
          <Button
            data-track-owner={`${owner}#PluginShelf:Button[View all]`}
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            aria-label={`View all ${title.toLowerCase()}`}
          >
            View all
            <ButtonIcon data-side="trailing">
              <Icon name="chevron-right" />
            </ButtonIcon>
          </Button>
        )}
      </div>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground-2">
          Newly listed plugins will appear here
        </p>
      ) : (
        <div className={gridClass}>{cards.map(renderCard)}</div>
      )}
    </section>
  );
}

export type PluginCategoriesProps = {
  onSearch: (search: PluginBrowseSearch) => void;
};

export function PluginCategories({ onSearch }: PluginCategoriesProps) {
  return (
    <ResponsiveMenu>
      <Menu.Trigger
        data-track-owner={`${owner}#PluginCategories:ResponsiveMenuTrigger[Categories]`}
        render={
          <Button
            data-track-owner={`${owner}#PluginCategories:Button.1`}
            variant="ghost"
            size="sm"
          />
        }
      >
        Categories
        <ButtonIcon data-side="trailing">
          <Icon name="chevron-grabber-vertical" />
        </ButtonIcon>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <ResponsiveMenuLevel>
              <ResponsiveMenuItem
                data-track-owner={`${owner}#PluginCategories:ResponsiveMenuItem[All categories]`}
                onClick={() => onSearch({})}
              >
                All categories
              </ResponsiveMenuItem>
              {PLUGIN_CATEGORIES.map((category) => (
                <ResponsiveMenuItem
                  key={category}
                  data-track-owner={`${owner}#PluginCategories:ResponsiveMenuItem.1`}
                  onClick={() => onSearch({ category })}
                >
                  {PLUGIN_CATEGORY_LABELS[category]}
                </ResponsiveMenuItem>
              ))}
            </ResponsiveMenuLevel>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </ResponsiveMenu>
  );
}

export type PluginBrowseProps<Card extends PluginBrowseCard> = {
  cards: readonly Card[];
  search: PluginBrowseSearch;
  onSearch: (search: PluginBrowseSearch) => void;
  renderCard?: PluginCardRenderer<Card>;
};

export function PluginBrowse<Card extends PluginBrowseCard>({
  cards,
  search,
  onSearch,
  renderCard = defaultRenderCard,
}: PluginBrowseProps<Card>) {
  const view = browsePlugins(cards, search);

  if (view.kind === "empty") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <img
          src={art[view.art]}
          alt=""
          className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
        />
        <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
          {view.line}
        </span>
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {view.sub}
        </span>
        <span className="mt-2">
          <Button
            data-track-owner={`${owner}#PluginBrowse:Button[${view.action}]`}
            variant="outline"
            onClick={() => onSearch({})}
          >
            {view.action}
          </Button>
        </span>
      </div>
    );
  }

  if (view.kind === "results") {
    return (
      <section className="flex flex-col gap-4" aria-label="Plugin results">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">{view.title}</h2>
          <Button
            data-track-owner={`${owner}#PluginBrowse:Button[All plugins].2`}
            variant="ghost"
            size="sm"
            onClick={() => onSearch({})}
          >
            All plugins
          </Button>
        </div>
        <div className={gridClass}>{view.cards.map(renderCard)}</div>
        {view.pages > 1 && (
          <nav
            aria-label="Plugin result pages"
            className="flex items-center justify-between gap-3"
          >
            <Button
              data-track-owner={`${owner}#PluginBrowse:Button[Previous]`}
              variant="ghost"
              size="sm"
              disabled={view.page === 1}
              onClick={() => onSearch({ ...search, page: view.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground-2 tabular-nums">
              {view.page} of {view.pages}
            </span>
            <Button
              data-track-owner={`${owner}#PluginBrowse:Button[Next]`}
              variant="ghost"
              size="sm"
              disabled={view.page === view.pages}
              onClick={() => onSearch({ ...search, page: view.page + 1 })}
            >
              Next
            </Button>
          </nav>
        )}
      </section>
    );
  }

  return (
    <>
      {view.shelves.map((shelf) => {
        const viewAll = shelf.viewAll;
        return (
          <PluginShelf
            key={shelf.title}
            title={shelf.title}
            cards={shelf.cards}
            onViewAll={
              viewAll === undefined ? undefined : () => onSearch(viewAll)
            }
            renderCard={renderCard}
          />
        );
      })}
    </>
  );
}
