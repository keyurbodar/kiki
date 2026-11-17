import { useEffect, useState } from "react";

const TICK = 1000;

export function useElapsedMs(startedAt: Date | undefined, live: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), TICK);
    return () => clearInterval(id);
  }, [live]);
  if (startedAt === undefined) return undefined;
  return Math.max(0, now - startedAt.getTime());
}
