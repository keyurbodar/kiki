import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps, ReactNode } from "react";
import { Button, type ButtonProps } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Label } from "@/primitives/label";
import { MenuSearchRow } from "@/primitives/menu";
import {
  MenuComboboxContent,
  type MenuComboboxContentProps,
  MenuComboboxFooter,
  MenuComboboxInput,
  MenuComboboxList,
} from "@/primitives/menu-combobox";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const searchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";

type GlyphProps = Omit<ComponentProps<"svg">, "children">;

function Glyph({
  className,
  paths,
  ...props
}: GlyphProps & { paths: ReadonlyArray<string> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      data-slot="icon"
      className={cx("size-(--icon-base) shrink-0", className)}
      {...props}
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export const TrashGlyph = (props: GlyphProps) => (
  <Glyph
    paths={[
      "M5 6.5L5.80734 18.2064C5.91582 19.7794 7.22348 21 8.80023 21H15.1998C16.7765 21 18.0842 19.7794 18.1927 18.2064L19 6.5",
      "M10 11V16",
      "M14 11V16",
      "M3.5 6H20.5",
      "M8.07092 5.74621C8.42348 3.89745 10.0485 2.5 12 2.5C13.9515 2.5 15.5765 3.89745 15.9291 5.74621",
    ]}
    {...props}
  />
);

export function Spinner({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      data-slot="spinner"
      className={cx("inline-flex animate-spin", className)}
    >
      <Icon name="circle-dotted" className="size-(--icon-xs)" />
    </span>
  );
}

export type LoadingButtonProps = ButtonProps & { loading?: boolean };

export function LoadingButton({
  loading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading ? <Spinner /> : null}
      {children}
    </Button>
  );
}

export function FieldGroup({
  className,
  ...props
}: ComponentProps<typeof BaseField.Root>) {
  return <BaseField.Root className={className} {...props} />;
}

export function Field({
  label,
  problem,
  hint,
  children,
}: {
  label: ReactNode;
  problem?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <BaseField.Root className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {problem === undefined ? (
        hint === undefined ? null : (
          <span className="text-xs font-normal text-muted-foreground-2">
            {hint}
          </span>
        )
      ) : (
        <span className="text-xs font-normal text-destructive">{problem}</span>
      )}
    </BaseField.Root>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

export type ComboboxPopupProps = Omit<MenuComboboxContentProps, "children"> & {
  searchPlaceholder: string;
  emptyText: string;
  empty: boolean;
  footer?: ReactNode;
  children: ComponentProps<typeof MenuComboboxList>["children"];
};

export function ComboboxPopup({
  searchPlaceholder,
  emptyText,
  empty,
  footer,
  children,
  align = "start",
  sideOffset = 4,
  ...props
}: ComboboxPopupProps) {
  return (
    <MenuComboboxContent align={align} sideOffset={sideOffset} {...props}>
      <MenuSearchRow>
        <MenuComboboxInput
          placeholder={searchPlaceholder}
          className={searchInputClass}
        />
      </MenuSearchRow>
      {empty ? (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground-2">
          {emptyText}
        </div>
      ) : null}
      <MenuComboboxList className="min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
        {children}
      </MenuComboboxList>
      {footer === undefined ? null : (
        <MenuComboboxFooter className="shrink-0">{footer}</MenuComboboxFooter>
      )}
    </MenuComboboxContent>
  );
}
