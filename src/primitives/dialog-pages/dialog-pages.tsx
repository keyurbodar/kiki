import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type Key,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import {
  DialogBody,
  type DialogBodyProps,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";

export type DialogPageSpec = {
  title: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  spacing?: DialogBodyProps["spacing"];
  bodyClassName?: string;
  footerClassName?: string;
};

export type DialogPagesProps<Page extends string = string> = {
  page: Page;
  root: Page;
  pages: Record<Page, DialogPageSpec>;
  onBack: () => void;
  backDisabled?: boolean;
};

function ChevronLeftSmallIcon() {
  return (
    <svg
      aria-hidden
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.3787 16L10.4393 13.0607C9.85355 12.4749 9.85355 11.5251 10.4393 10.9393L13.3787 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One dialog with a header, an animated body and a footer per page; non-root pages get a Back button. */
export function DialogPages<Page extends string>({
  page,
  root,
  pages,
  onBack,
  backDisabled,
}: DialogPagesProps<Page>) {
  const current = pages[page];
  return (
    <div data-slot="dialog-pages" className="contents">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-1">
          {page === root ? null : (
            <Button
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
      <DialogPage pageKey={page}>
        <DialogBody spacing={current.spacing} className={current.bodyClassName}>
          {current.body}
        </DialogBody>
      </DialogPage>
      {current.footer === undefined ? null : (
        <DialogFooter
          className={cx(
            "border-t-hairline border-border-1 pt-4",
            current.footerClassName,
          )}
        >
          {current.footer}
        </DialogFooter>
      )}
    </div>
  );
}

export type DialogPageProps = ComponentProps<"div"> & { pageKey?: Key };

/** Scrolls its page and animates its height to the page's measured height; a new pageKey fades the page in. */
export function DialogPage({
  pageKey,
  className,
  style,
  children,
  ...props
}: DialogPageProps) {
  const [height, setHeight] = useState<number>();
  const measure = useCallback((node: HTMLDivElement) => {
    setHeight(node.offsetHeight);
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      data-slot="dialog-page"
      className={cx(
        "min-h-0 shrink overflow-x-hidden overflow-y-auto transition-[height] duration-base ease-out-quint motion-reduce:transition-none",
        className,
      )}
      style={{ height, ...style }}
      {...props}
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
