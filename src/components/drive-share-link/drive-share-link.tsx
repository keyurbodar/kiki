import { Link, useRouterState } from "@tanstack/react-router";
import { type ComponentProps, createContext, useContext } from "react";

export const DriveShareOpenContext = createContext<
  ((shareId: string) => void) | undefined
>(undefined);

export type DriveShareLinkProps = Omit<ComponentProps<"a">, "href" | "ref"> & {
  readonly shareId: string;
};

const isInApp = (routeIds: ReadonlyArray<string>) =>
  routeIds.some((id) => id === "/_app" || id.startsWith("/_app/"));

export function DriveShareLink({
  shareId,
  children,
  onClick,
  ...props
}: DriveShareLinkProps) {
  const open = useContext(DriveShareOpenContext);
  const inApp = useRouterState({
    select: (state) => isInApp(state.matches.map((match) => match.routeId)),
  });
  return (
    <Link
      data-track-owner="shared/drive-share-link.tsx#DriveShareLink:Link.1"
      {...props}
      to={inApp ? "/drive/share/$shareId" : "/s/$shareId"}
      params={{ shareId }}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          open === undefined ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        open(shareId);
      }}
    >
      {children}
    </Link>
  );
}
