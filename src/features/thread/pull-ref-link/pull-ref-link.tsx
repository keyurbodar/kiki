import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
} from "react";
import {
  isModifiedClick,
  type PullRef,
  parsePullHref,
  pullRefKey,
  pullRouteParams,
} from "./pull-ref";
import { PullStateIcon } from "./pull-state-icon";

export type OpenPull = (target: { number: number; url: string }) => void;

export type PullRefContextValue = {
  pullRequests: ReadonlyMap<string, PullRef>;
  openPr?: OpenPull;
};

export const PullRefContext = createContext<PullRefContextValue>({
  pullRequests: new Map(),
});

export const pullRefLinkClass =
  "text-(--text-link) [-webkit-text-fill-color:currentColor] -mx-1 px-1 cursor-pointer rounded-sm outline-none hover:underline underline-offset-2 focus-visible:outline-ring-inset";

export type PullRefLinkProps = {
  href: string;
  className?: string;
  children?: ReactNode;
  /** Runs before the link's own click handling, for a host that must keep the click. */
  onClick?: (event: MouseEvent) => void;
};

export function PullRefLink({
  href,
  className,
  children,
  onClick,
}: PullRefLinkProps) {
  const { pullRequests, openPr } = useContext(PullRefContext);
  const target = parsePullHref(href);
  const pull =
    target === undefined
      ? undefined
      : pullRequests.get(pullRefKey(target.repositoryFullName, target.number));
  const classes = cx(pullRefLinkClass, "whitespace-nowrap", className);
  const content = (
    <>
      {pull !== undefined && (
        <PullStateIcon
          state={pull.state}
          className="mr-1 inline size-3 shrink-0 align-[-0.115em]"
        />
      )}
      {children}
    </>
  );

  if (target === undefined) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  const handleClick =
    openPr === undefined && onClick === undefined
      ? undefined
      : (event: MouseEvent) => {
          onClick?.(event);
          if (openPr === undefined || isModifiedClick(event)) return;
          event.preventDefault();
          openPr({ number: target.number, url: pull?.url ?? href });
        };

  return (
    <Link
      to="/pull/$owner/$repo/$prNumber"
      params={pullRouteParams(target.repositoryFullName, target.number)}
      className={classes}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}
