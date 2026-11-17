import { CopyField } from "@/primitives/copy-field";
import { cx } from "./cx";

/** CopyField pinned to the caller's width; the primitive itself fills its parent. */
export function CopyValue({
  value,
  label,
  size = "base",
  className,
}: {
  value: string;
  label: string;
  size?: "sm" | "base";
  className?: string;
}) {
  return (
    <span className={cx("flex min-w-0", className)}>
      <CopyField label={label} size={size} value={value} />
    </span>
  );
}
