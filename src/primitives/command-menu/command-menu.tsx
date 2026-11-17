import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { Kbd } from "@/primitives/kbd";
import { menuRowVariants } from "@/primitives/menu";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

type StateClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined;

function withClass<State>(base: string, className: StateClassName<State>) {
  return typeof className === "function"
    ? (state: State) => cx(base, className(state))
    : cx(base, className);
}

const overlayClass =
  "fixed inset-0 z-(--z-dialog) bg-overlay transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast";

export const commandMenuContentClass =
  "relative flex max-h-full w-full max-w-[45rem] min-h-0 flex-col overflow-hidden rounded-(--radius-panel) border-hairline border-border-2 bg-popover shadow-overlay outline-none transition-[opacity,scale] duration-base ease-out-quint data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast";

export const commandMenuInputClass =
  "h-11 w-full min-w-0 shrink-0 bg-transparent px-4 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

export const commandMenuGroupLabelClass =
  "flex min-h-7 items-center px-2.5 text-xs font-medium text-muted-foreground-2";

export const commandMenuItemIconClass =
  "flex size-(--icon-base) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const commandMenuItemTrailingClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground-2";

type FinalFocus = ComponentProps<typeof BaseDialog.Popup>["finalFocus"];
type CloseType = Parameters<
  Extract<FinalFocus, (...args: never[]) => unknown>
>[0];

const ReturnFocusContext = createContext<RefObject<HTMLElement | null> | null>(
  null,
);

export function resolveFinalFocus(
  finalFocus: FinalFocus,
  closeType: CloseType,
  returnTo: HTMLElement | null,
) {
  const requested =
    typeof finalFocus === "function"
      ? finalFocus(closeType)
      : typeof finalFocus === "object"
        ? finalFocus.current
        : finalFocus;
  const result = requested ?? true;
  if (result !== true) return result;
  return returnTo?.isConnected === true ? returnTo : true;
}

export type CommandMenuDialogProps = ComponentProps<typeof BaseDialog.Root>;

export function CommandMenuDialog(props: CommandMenuDialogProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!props.open) return;
    const active = document.activeElement;
    returnFocus.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, [props.open]);
  return (
    <ReturnFocusContext value={returnFocus}>
      <BaseDialog.Root {...props} />
    </ReturnFocusContext>
  );
}

export type CommandMenuContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function CommandMenuContent({
  className,
  children,
  finalFocus,
  ...props
}: CommandMenuContentProps) {
  const returnFocus = use(ReturnFocusContext);
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="dialog-overlay"
        className={overlayClass}
      />
      <div className="fixed inset-0 z-(--z-dialog) flex h-dvh flex-col items-center px-4 pt-[15dvh] pb-[calc(1rem+var(--safe-bottom))]">
        <BaseDialog.Popup
          data-slot="command-menu-content"
          aria-label="Command menu"
          initialFocus={false}
          finalFocus={(closeType) =>
            resolveFinalFocus(
              finalFocus,
              closeType,
              returnFocus?.current ?? null,
            )
          }
          className={withClass(commandMenuContentClass, className)}
          {...props}
        >
          <div data-slot="command-menu" className="flex min-h-0 flex-col">
            {children}
          </div>
        </BaseDialog.Popup>
      </div>
    </BaseDialog.Portal>
  );
}

export const CommandMenu = BaseAutocomplete.Root;

export type CommandMenuProps = ComponentProps<typeof BaseAutocomplete.Root>;

export type CommandMenuInputProps = ComponentProps<
  typeof BaseAutocomplete.Input
> & { trailing?: ReactNode };

export function CommandMenuInput({
  className,
  onKeyDown,
  trailing,
  ref,
  ...props
}: CommandMenuInputProps) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement);
  useEffect(() => {
    input.current?.focus();
  }, []);
  return (
    <>
      <div className="flex shrink-0 items-center">
        <BaseAutocomplete.Input
          ref={input}
          data-slot="command-menu-input"
          className={withClass(`${commandMenuInputClass} flex-1`, className)}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key !== "Escape") event.stopPropagation();
          }}
          {...props}
        />
        {trailing === undefined ? null : (
          <div className="flex shrink-0 items-center pr-2">{trailing}</div>
        )}
      </div>
      <div className="mx-0 my-0 h-px shrink-0 bg-border-1" />
    </>
  );
}

export type CommandMenuFiltersProps = ComponentProps<"div">;

export function CommandMenuFilters({
  className,
  ...props
}: CommandMenuFiltersProps) {
  return (
    <div
      role="tablist"
      data-slot="command-menu-filters"
      className={cx(
        "flex shrink-0 items-center gap-0.5 overflow-x-auto px-1.5 pt-1.5 [scrollbar-width:none] scroll-fade-x",
        className,
      )}
      {...props}
    />
  );
}

export type CommandMenuFilterProps = ComponentProps<"button"> & {
  active?: boolean;
};

export function CommandMenuFilter({
  active,
  className,
  ...props
}: CommandMenuFilterProps) {
  return (
    <button
      data-track-owner="ui/command-menu.tsx#CommandMenuFilter:button.1"
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={-1}
      data-slot="command-menu-filter"
      className={cx(
        "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center rounded px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-2 outline-none select-none transition-colors duration-100 hover:text-foreground aria-selected:bg-secondary aria-selected:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function highlightedValue(list: HTMLElement): string | undefined {
  return list.querySelector<HTMLElement>("[data-highlighted]")?.dataset.value;
}

export type CommandMenuListProps = ComponentProps<
  typeof BaseAutocomplete.List
> & { onHighlightChange?: (value: string | undefined) => void };

export function CommandMenuList({
  className,
  onHighlightChange,
  ...props
}: CommandMenuListProps) {
  const list = useRef<HTMLDivElement>(null);
  const last = useRef<string | undefined>(undefined);
  const report = useEffectEvent((element: HTMLElement) => {
    const value = highlightedValue(element);
    if (value === last.current) return;
    last.current = value;
    onHighlightChange?.(value);
  });
  useLayoutEffect(() => {
    const element = list.current;
    if (element === null) return;
    report(element);
    const observer = new MutationObserver(() => report(element));
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributeFilter: ["data-highlighted"],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <BaseAutocomplete.List
      ref={list}
      data-slot="command-menu-list"
      className={withClass(
        "max-h-[min(25rem,60vh)] min-h-0 flex-1 overflow-y-auto p-1.5 scroll-py-1.5 md:scroll-fade-y",
        className,
      )}
      {...props}
    />
  );
}

export type CommandMenuGroupProps = ComponentProps<
  typeof BaseAutocomplete.Group
>;

export function CommandMenuGroup({
  className,
  ...props
}: CommandMenuGroupProps) {
  return (
    <BaseAutocomplete.Group
      data-slot="command-menu-group"
      className={withClass("flex flex-col gap-px", className)}
      {...props}
    />
  );
}

export type CommandMenuGroupLabelProps = ComponentProps<
  typeof BaseAutocomplete.GroupLabel
>;

export function CommandMenuGroupLabel({
  className,
  ...props
}: CommandMenuGroupLabelProps) {
  return (
    <BaseAutocomplete.GroupLabel
      data-slot="command-menu-group-label"
      className={withClass(commandMenuGroupLabelClass, className)}
      {...props}
    />
  );
}

export type CommandMenuItemProps = ComponentProps<
  typeof BaseAutocomplete.Item
> & { intent?: "neutral" | "danger" };

export function CommandMenuItem({
  className,
  intent,
  ...props
}: CommandMenuItemProps) {
  return (
    <BaseAutocomplete.Item
      data-track-owner="ui/command-menu.tsx#CommandMenuItem:Autocomplete.Item.1"
      data-slot="command-menu-item"
      data-intent={intent === "danger" ? "danger" : undefined}
      data-value={typeof props.value === "string" ? props.value : undefined}
      className={withClass(
        menuRowVariants({ density: "palette", intent }),
        className,
      )}
      {...props}
    />
  );
}

export type CommandMenuEmptyProps = ComponentProps<"div">;

export function CommandMenuEmpty({
  className,
  ...props
}: CommandMenuEmptyProps) {
  return (
    <div
      data-slot="command-menu-empty"
      className={cx(
        "hidden px-2 py-10 text-center text-sm text-muted-foreground-2 only:block",
        className,
      )}
      {...props}
    />
  );
}

export type CommandMenuFooterProps = ComponentProps<"div">;

export function CommandMenuFooter({
  className,
  ...props
}: CommandMenuFooterProps) {
  return (
    <div
      data-slot="command-menu-footer"
      className={cx(
        "flex h-10 shrink-0 items-center gap-4 border-t-hairline border-border-1 px-4",
        className,
      )}
      {...props}
    />
  );
}

export type CommandMenuKeysProps = {
  keys: ReadonlyArray<ReactNode>;
  className?: string;
};

export function CommandMenuKeys({ keys, className }: CommandMenuKeysProps) {
  return (
    <span className={cx("flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a chord's keys never reorder
        <Kbd key={index} variant="chip">
          {key}
        </Kbd>
      ))}
    </span>
  );
}

export type CommandMenuHintProps = {
  keys: string | ReadonlyArray<ReactNode>;
  label: ReactNode;
};

export function CommandMenuHint({ keys, label }: CommandMenuHintProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground-2">
      <CommandMenuKeys keys={typeof keys === "string" ? [keys] : keys} />
      {label}
    </span>
  );
}
