import { Link } from "@tanstack/react-router";
import { AppTopBar } from "@/components/app-top-bar";
import { Icon } from "@/primitives/icon";

export type Crumb = { label: string; to?: string };

export function ExploreCrumbs({ crumbs }: { crumbs: ReadonlyArray<Crumb> }) {
  return (
    <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 px-2">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1 pl-2.5"
      >
        {crumbs.map((crumb, index) => (
          <span key={crumb.label} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <Icon
                name="chevron-right"
                size="sm"
                className="text-icon-muted"
              />
            )}
            {crumb.to === undefined ? (
              <span className="truncate text-sm font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="shrink-0 rounded text-sm font-medium text-muted-foreground-1 outline-none transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </AppTopBar>
  );
}
