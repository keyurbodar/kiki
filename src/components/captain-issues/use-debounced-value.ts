import { useEffect, useState } from "react";

/** Follows `value` after `delay`, except that clearing it applies at once. */
export function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return value === "" ? "" : debounced;
}
