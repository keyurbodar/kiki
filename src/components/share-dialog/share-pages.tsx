import { type ReactNode, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/primitives/button";
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { ChevronLeftSmallIcon } from "./icons";

export type SharePage = {
  title: string;
  body: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  footerClassName?: string;
};

export type SharePagesProps<K extends string> = {
  page: K;
  root: K;
  pages: Record<K, SharePage>;
  onBack: () => void;
  backDisabled?: boolean;
};

function PageHeight({
  pageKey,
  children,
}: {
  pageKey: string;
  children: ReactNode;
}) {
  const [height, setHeight] = useState<number>();
  const observer = useRef<ResizeObserver | null>(null);
  const measure = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (node === null) return;
    setHeight(node.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.current.observe(node);
  }, []);
  return (
    <div
      className="min-h-0 shrink overflow-x-hidden overflow-y-auto transition-[height] duration-base ease-out-quint motion-reduce:transition-none"
      style={{ height }}
    >
      <div
        key={pageKey}
        ref={measure}
        className="transition-opacity duration-base ease-out-quint starting:opacity-0 motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
}

export function SharePages<K extends string>({
  page,
  root,
  pages,
  onBack,
  backDisabled,
}: SharePagesProps<K>) {
  const current = pages[page];
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-1">
          {page === root ? null : (
            <Button
              data-track-owner="ui/dialog-pages.tsx#DialogPages:Button[Back]"
              variant="ghost"
              size="icon-sm"
              type="button"
              aria-label="Back"
              className="-ml-2"
              disabled={backDisabled}
              onClick={onBack}
            >
              <ChevronLeftSmallIcon />
            </Button>
          )}
          <span className="min-w-0 truncate">{current.title}</span>
        </DialogTitle>
      </DialogHeader>
      <PageHeight pageKey={page}>
        <DialogBody className={current.bodyClassName}>
          {current.body}
        </DialogBody>
      </PageHeight>
      {current.footer === undefined ? null : (
        <DialogFooter
          className={cn(
            "border-t-(length:--border-width-hairline) border-border-1 pt-4",
            current.footerClassName,
          )}
        >
          {current.footer}
        </DialogFooter>
      )}
    </>
  );
}
