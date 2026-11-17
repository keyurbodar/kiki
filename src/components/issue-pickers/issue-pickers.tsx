import { cx } from "class-variance-authority";
import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import { Menu, MenuContent, MenuTrigger } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { CheckmarkGlyph, ChevronDownSmallGlyph } from "./issue-glyphs";

export const issuePickerPillClass = cx(
  "inline-flex h-(--h-control-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded",
  "border-hairline border-border-2 bg-button px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground-1 shadow-plate",
  "outline-none select-none transition-colors duration-100 hover:bg-button-hover hover:text-foreground",
  "focus-visible:outline-ring-inset",
  "[&_svg]:size-(--icon-sm) [&_svg]:shrink-0",
);

export const issuePickerInlineClass = cx(
  "-mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium text-foreground",
  "outline-none select-none transition-colors duration-100 hover:bg-secondary data-[popup-open]:bg-secondary",
  "focus-visible:outline-ring-inset",
);

/** The leading glyph slot of a picker row. */
export const issuePickerGlyphClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

/** The trailing check and digit slot of a picker row. */
export const issuePickerTrailingClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export const issuePickerEmptyClass =
  "px-2 py-3 text-center text-sm font-normal text-muted-foreground-2";

const searchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

/** `pill` for toolbars and dialogs, `inline` for property rows, or a custom trigger element. */
export type IssuePickerLook = "pill" | "inline" | ReactElement;

export type IssuePickerTriggerProps = {
  look: IssuePickerLook;
  label: string;
  children: ReactNode;
};

/** The button that opens an issue picker, in Capy's two looks. */
export function issuePickerTrigger({
  look,
  label,
  children,
}: IssuePickerTriggerProps): ReactElement {
  if (typeof look !== "string") return look;
  if (look === "pill")
    return (
      <button
        type="button"
        aria-label={label}
        className={cx(issuePickerPillClass, "max-w-56")}
      >
        {children}
      </button>
    );
  return (
    <button
      type="button"
      aria-label={label}
      className={cx(issuePickerInlineClass, "min-w-0")}
    >
      {children}
      <ChevronDownSmallGlyph className="size-(--icon-xs) shrink-0 text-icon-muted" />
    </button>
  );
}

export type IssuePickerValueProps = {
  glyph?: ReactNode;
  placeholder?: boolean;
  children: ReactNode;
};

/** A picker trigger's glyph and text; placeholder text is muted. */
export function IssuePickerValue({
  glyph,
  placeholder = false,
  children,
}: IssuePickerValueProps) {
  return (
    <>
      {glyph !== undefined && (
        <span className="flex size-(--icon-xs) shrink-0 items-center justify-center">
          {glyph}
        </span>
      )}
      <span
        className={cx(
          "min-w-0 truncate",
          placeholder
            ? "font-normal text-muted-foreground-2"
            : "text-foreground",
        )}
      >
        {children}
      </span>
    </>
  );
}

export type IssuePickerMenuProps = {
  label: string;
  trigger: ReactElement;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/** A tooltip-labelled trigger that opens a start-aligned menu of picker rows. */
export function IssuePickerMenu({
  label,
  trigger,
  className,
  onOpenChange,
  children,
}: IssuePickerMenuProps) {
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  return (
    <Menu open={open} onOpenChange={change}>
      <Tooltip>
        <TooltipTrigger render={<MenuTrigger render={trigger} />} />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <MenuContent align="start" className={className}>
        {children}
      </MenuContent>
    </Menu>
  );
}

export type IssuePickerSearchProps = {
  label: string;
  query: string;
  onQuery: (query: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  maxLength?: number;
};

/** The filter input at the top of a picker. Keys other than Escape stay in the input. */
export function IssuePickerSearch({
  label,
  query,
  onQuery,
  onKeyDown,
  readOnly,
  maxLength,
}: IssuePickerSearchProps) {
  return (
    <input
      className={searchInputClass}
      placeholder={label}
      aria-label={label}
      value={query}
      readOnly={readOnly}
      maxLength={maxLength}
      onChange={(event) => onQuery(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") return;
        event.stopPropagation();
        onKeyDown?.(event);
      }}
    />
  );
}

/** The digit shown for the first ten rows: 1 to 9, then 0. */
export const pickerDigit = (index: number) =>
  index > 9 ? undefined : String((index + 1) % 10);

export type IssuePickerCheckProps = { checked: boolean; index?: number };

/** A row's trailing check mark and quick-pick digit. */
export function IssuePickerCheck({ checked, index }: IssuePickerCheckProps) {
  const digit = index === undefined ? undefined : pickerDigit(index);
  return (
    <span className={issuePickerTrailingClass}>
      {checked && (
        <CheckmarkGlyph className="size-(--icon-sm) shrink-0 text-foreground" />
      )}
      {digit !== undefined && (
        <span
          data-menu-digit={digit}
          className="w-2 text-center text-xs font-normal text-muted-foreground-2 tabular-nums pointer-coarse:hidden"
        >
          {digit}
        </span>
      )}
    </span>
  );
}

export function IssuePickerEmpty({ children }: { children: ReactNode }) {
  return <div className={issuePickerEmptyClass}>{children}</div>;
}
