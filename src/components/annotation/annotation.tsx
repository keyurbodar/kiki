import { cva } from "class-variance-authority";
import {
  type ComponentProps,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import { Popover, PopoverContent } from "@/primitives/popover";
import { Textarea } from "@/primitives/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const stopPropagation = (event: { stopPropagation: () => void }) =>
  event.stopPropagation();

export type AnnotationProps = ComponentProps<"div">;

export function Annotation(props: AnnotationProps) {
  return <div {...props} />;
}

function TooltipShortcut({
  shortcut,
  children,
}: {
  shortcut?: string;
  children: ReactNode;
}) {
  return (
    <TooltipContent>
      {children}
      {shortcut === undefined ? null : <Kbd>{shortcut}</Kbd>}
    </TooltipContent>
  );
}

const pinTouchTarget =
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2";

const pinBase =
  "absolute flex size-6 -translate-y-full rounded-full rounded-bl-none text-xs font-medium text-primary-foreground tabular-nums";

export const annotationPinFaceVariants = cva(
  "flex size-full origin-bottom-left items-center justify-center rounded-full rounded-bl-none bg-primary shadow-overlay ring-(length:--annotation-stroke) ring-overlay-fg transition-[opacity,scale] duration-fast ease-out-quint starting:opacity-0 motion-safe:starting:scale-75",
  {
    variants: { active: { true: "outline-4 outline-primary-20", false: "" } },
    defaultVariants: { active: false },
  },
);

export type AnnotationPinProps = Omit<
  ComponentProps<"span">,
  "children" | "ref"
> & {
  n: number;
  x: number | string;
  y: number | string;
  active?: boolean;
  label?: string;
  onOpen?: () => void;
  onHover?: (hovering: boolean) => void;
  ref?: Ref<HTMLElement>;
};

export function AnnotationPin({
  n,
  x,
  y,
  active = false,
  label,
  onOpen,
  onHover,
  ref,
  className,
  style,
  ...props
}: AnnotationPinProps) {
  const face = (
    <span className={annotationPinFaceVariants({ active })}>{n}</span>
  );
  if (onOpen === undefined) {
    return (
      <span
        {...props}
        ref={ref as Ref<HTMLSpanElement>}
        data-slot="annotation-pin"
        data-active={active ? "" : undefined}
        className={cx("pointer-events-none", pinBase, className)}
        style={{ ...style, left: x, top: y }}
      >
        {face}
      </span>
    );
  }
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      data-slot="annotation-pin"
      data-active={active ? "" : undefined}
      aria-label={`${label ?? "Comment"} ${n}`}
      className={cx(
        "pointer-events-auto cursor-pointer focus-visible:outline-ring-inset",
        pinTouchTarget,
        pinBase,
        className,
      )}
      style={{ ...style, left: x, top: y }}
      onPointerDown={stopPropagation}
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
      onClick={onOpen}
    >
      {face}
    </button>
  );
}

export const annotationRegionVariants = cva(
  "pointer-events-none absolute rounded-(--radius-inner) border-(length:--annotation-stroke) border-primary bg-primary-soft transition-[opacity] duration-fast ease-out-quint starting:opacity-0",
  {
    variants: { active: { true: "outline-4 outline-primary-20", false: "" } },
    defaultVariants: { active: false },
  },
);

export type AnnotationRegionProps = Omit<ComponentProps<"span">, "ref"> & {
  active?: boolean;
  ref?: Ref<HTMLSpanElement>;
};

export function AnnotationRegion({
  active = false,
  className,
  ...props
}: AnnotationRegionProps) {
  return (
    <span
      data-slot="annotation-region"
      data-active={active ? "" : undefined}
      className={annotationRegionVariants({ active, className })}
      {...props}
    />
  );
}

export type AnnotationIndexProps = Omit<ComponentProps<"span">, "children"> & {
  n: ReactNode;
  active?: boolean;
};

export function AnnotationIndex({
  n,
  active = false,
  className,
  ...props
}: AnnotationIndexProps) {
  return (
    <span
      data-slot="annotation-index"
      data-active={active ? "" : undefined}
      className={cx(
        "flex size-4 shrink-0 items-center justify-center rounded-full rounded-bl-none bg-secondary text-2xs leading-none font-medium text-muted-foreground-1 tabular-nums transition-colors duration-100 data-[active]:bg-primary data-[active]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {n}
    </span>
  );
}

export type AnnotationRowProps = Omit<ComponentProps<"div">, "children"> & {
  n: number;
  note: ReactNode;
  meta?: ReactNode;
  active?: boolean;
  selectLabel?: string;
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
  onRemove?: () => void;
};

export function AnnotationRow({
  n,
  note,
  meta,
  active = false,
  selectLabel,
  onSelect,
  onHover,
  onRemove,
  className,
  ...props
}: AnnotationRowProps) {
  const body = (
    <>
      <span className="flex h-5 shrink-0 items-center">
        <AnnotationIndex n={n} active={active} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-3 text-sm leading-5 break-words text-foreground">
          {note}
        </span>
        {meta === undefined ? null : (
          <span className="truncate text-xs leading-4 text-muted-foreground-2 tabular-nums">
            {meta}
          </span>
        )}
      </span>
    </>
  );
  return (
    <div
      data-slot="annotation-row"
      data-active={active ? "" : undefined}
      className={cx(
        "group/row relative rounded-(--radius) focus-within:bg-secondary hover:bg-secondary data-[active]:bg-secondary",
        className,
      )}
      onPointerEnter={() => onHover?.(true)}
      onPointerLeave={() => onHover?.(false)}
      {...props}
    >
      {onSelect === undefined ? (
        <div className="flex gap-2 p-1.5">{body}</div>
      ) : (
        <button
          type="button"
          aria-label={
            selectLabel === undefined ? undefined : `${selectLabel} ${n}`
          }
          aria-pressed={active}
          className="flex w-full gap-2 rounded-[inherit] p-1.5 text-left focus-visible:outline-ring-inset"
          onClick={onSelect}
        >
          {body}
        </button>
      )}
      {onRemove === undefined ? null : (
        <span className="mask-fade-l [--mask-fade-ramp:var(--mask-fade-ramp-toolbar)] pointer-events-none absolute top-1 right-1 flex items-center rounded-r-(--radius) pl-8 opacity-0 transition-opacity duration-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100 group-hover/row:pointer-events-auto group-hover/row:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100">
          <span
            aria-hidden
            className="absolute inset-0 rounded-r-(--radius) bg-popover"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-r-(--radius) bg-secondary"
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="relative"
                  aria-label={`Remove comment ${n}`}
                  onClick={onRemove}
                >
                  <Icon name="trash-can" />
                </Button>
              }
            />
            <TooltipShortcut>Remove</TooltipShortcut>
          </Tooltip>
        </span>
      )}
    </div>
  );
}

export type AnnotationGroupProps = { label?: ReactNode; children: ReactNode };

export function AnnotationGroup({ label, children }: AnnotationGroupProps) {
  return (
    <div className="flex flex-col">
      {label === undefined ? null : (
        <h3 className="flex h-7 shrink-0 items-center px-3 text-xs text-muted-foreground-2">
          {label}
        </h3>
      )}
      <div className="flex flex-col gap-0.5 px-1.5">{children}</div>
    </div>
  );
}

export type AnnotationHintProps = { children: ReactNode };

export function AnnotationHint({ children }: AnnotationHintProps) {
  return (
    <p className="px-3 pb-1.5 text-sm text-muted-foreground-2">{children}</p>
  );
}

export type AnnotationPanelProps = Omit<ComponentProps<"section">, "ref"> & {
  count: number;
  onHide?: () => void;
  footer?: ReactNode;
};

export function AnnotationPanel({
  count,
  onHide,
  footer,
  className,
  children,
  ...props
}: AnnotationPanelProps) {
  return (
    <section
      data-slot="annotation-panel"
      aria-label="Comments"
      className={cx(
        "flex min-h-0 origin-top-right flex-col rounded-(--radius-overlay) border-(length:--border-width-hairline) border-border-2 bg-popover text-foreground shadow-overlay transition-[opacity,scale] duration-fast ease-out-quint starting:opacity-0 motion-safe:starting:scale-[0.97]",
        className,
      )}
      {...props}
    >
      <header className="flex h-10 shrink-0 items-center gap-1.5 pr-1.5 pl-3">
        <h2 className="text-sm font-medium text-foreground">Comments</h2>
        {count === 0 ? null : (
          <span className="text-sm text-muted-foreground-3 tabular-nums">
            {count}
          </span>
        )}
        {onHide === undefined ? null : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="ml-auto"
                  aria-label="Hide comments"
                  aria-keyshortcuts="Shift+C"
                  onClick={onHide}
                >
                  <Icon name="cross-small" />
                </Button>
              }
            />
            <TooltipShortcut shortcut="⇧C">Hide comments</TooltipShortcut>
          </Tooltip>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pb-1.5">
        {children}
      </div>
      {footer == null ? null : (
        <footer className="flex shrink-0 items-center justify-end border-t-(length:--border-width-hairline) border-border-2 p-1.5">
          {footer}
        </footer>
      )}
    </section>
  );
}

export type AnnotationSendProps = {
  count: number;
  sending?: boolean;
  action?: string;
  onSend: () => void;
};

export function AnnotationSend({
  count,
  sending = false,
  action,
  onSend,
}: AnnotationSendProps) {
  const button = (
    <Button
      size="sm"
      intent="accent"
      disabled={sending}
      aria-busy={sending || undefined}
      data-loading={sending ? "" : undefined}
      onClick={onSend}
    >
      Send {count} {count === 1 ? "comment" : "comments"}
    </Button>
  );
  if (action === undefined) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipShortcut>Send to Capy</TooltipShortcut>
    </Tooltip>
  );
}

export type AnnotateToggleProps = {
  on: boolean;
  hint: string;
  className?: string;
  onToggle: () => void;
};

export function AnnotateToggle({
  on,
  hint,
  className,
  onToggle,
}: AnnotateToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            intent={on ? "accent" : undefined}
            aria-pressed={on}
            aria-keyshortcuts={on ? "Escape" : "C"}
            className={className}
            onClick={onToggle}
          >
            <Icon name="bubble-plus" />
            {on ? "Done" : "Annotate"}
          </Button>
        }
      />
      <TooltipShortcut shortcut={on ? "Esc" : "C"}>
        {on ? "Stop annotating" : hint}
      </TooltipShortcut>
    </Tooltip>
  );
}

const composerGap = 8;
const composerCollision = 12;

export type AnnotationComposerProps = {
  anchor: Element;
  region?: Element | null;
  n: number;
  caption: ReactNode;
  initialValue?: string;
  placeholder?: string;
  editing?: boolean;
  onSubmit: (note: string) => void;
  onClose: (event?: PointerEvent) => void;
  onRemove?: () => void;
};

export function AnnotationComposer({
  anchor,
  region = null,
  n,
  caption,
  initialValue = "",
  placeholder,
  editing = false,
  onSubmit,
  onClose,
  onRemove,
}: AnnotationComposerProps) {
  const [restore] = useState(
    () => anchor.closest("[role=dialog]") ?? document.activeElement,
  );
  const [popup, setPopup] = useState<HTMLDivElement | null>(null);
  const [besideRegion, setBesideRegion] = useState(region !== null);
  const [note, setNote] = useState(initialValue);

  useLayoutEffect(() => {
    if (region === null || popup === null) {
      setBesideRegion(false);
      return;
    }
    const measure = () => {
      const box = region.getBoundingClientRect();
      const w = popup.offsetWidth + composerGap;
      const h = popup.offsetHeight + composerGap;
      setBesideRegion(
        box.right + w <= window.innerWidth - composerCollision ||
          box.left - w >= composerCollision ||
          box.bottom + h <= window.innerHeight - composerCollision ||
          box.top - h >= composerCollision,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(popup);
    observer.observe(region);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [region, popup]);

  useLayoutEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (popup === null || !(event.target instanceof Node)) return;
      if (popup.contains(event.target)) return;
      onClose(event);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [popup, onClose]);

  const trimmed = note.trim();
  const submit = () => {
    if (trimmed !== "") onSubmit(trimmed);
  };

  return (
    <Popover open modal={false}>
      <PopoverContent
        ref={setPopup}
        variant="unstyled"
        anchor={besideRegion && region !== null ? region : anchor}
        finalFocus={() => {
          if (!(restore instanceof HTMLElement) || !restore.isConnected)
            return true;
          restore.focus({ preventScroll: true });
          return false;
        }}
        side="right"
        align="start"
        sideOffset={composerGap}
        collisionPadding={composerCollision}
        collisionAvoidance={{
          fallbackAxisSide: besideRegion ? "end" : "start",
        }}
        className="w-72 max-w-[calc(100vw-2rem)]"
      >
        <div
          data-slot="selection-box"
          className="flex w-full min-w-0 flex-col gap-1 rounded-(--radius-overlay) border-(length:--border-width-hairline) border-border-2 bg-popover p-3 font-sans shadow-overlay"
        >
          <div className="-mx-1 -mt-1 flex h-(--h-control-xs) items-center gap-0.5">
            <span className="flex size-(--h-control-xs) shrink-0 items-center justify-center">
              <AnnotationIndex n={n} active />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground-2">
              {caption}
            </span>
            {onRemove === undefined ? null : (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove comment ${n}`}
                onClick={onRemove}
              >
                <Icon name="trash-can" />
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Close"
                    onClick={() => onClose()}
                  >
                    <Icon name="cross-small" />
                  </Button>
                }
              />
              <TooltipShortcut shortcut="Esc">Close</TooltipShortcut>
            </Tooltip>
          </div>
          <Textarea
            variant="blank"
            autoFocus
            rows={2}
            className="min-h-12 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground-3"
            placeholder={placeholder ?? "Ask Capy about this"}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="flex items-center justify-end">
            <Button
              size="xs"
              intent="accent"
              disabled={trimmed === ""}
              onClick={submit}
            >
              {editing ? "Save" : "Add"}
              <Kbd variant="onFill" className="pointer-coarse:hidden">
                ↵
              </Kbd>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
