import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const tableVariants = cva("", {
  variants: {
    density: { directory: "", pick: "", compact: "" },
    flush: { true: "", false: "" },
  },
  defaultVariants: { density: "directory", flush: false },
});

export type TableProps = ComponentProps<"table"> &
  VariantProps<typeof tableVariants>;

export function Table({ className, density, flush, ...props }: TableProps) {
  return (
    <table
      data-slot="table"
      className={tableVariants({ density, flush, className })}
      {...props}
    />
  );
}
