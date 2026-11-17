import { useLayoutEffect, useState } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { DitherCover } from "./dither-cover";

export type DitherCoverPageProps = {
  theme: "dark" | "light";
  at?: number;
};

export function DitherCoverPage({ theme, at }: DitherCoverPageProps) {
  const [run, setRun] = useState(1);
  const [covering, setCovering] = useState(true);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="h-dvh overflow-hidden bg-background p-2">
      <Card
        variant="panel"
        className="flex h-full flex-col items-center justify-center gap-4"
      >
        <p className="text-sm font-normal text-muted-foreground-1">
          The app beneath the cover
        </p>
        <Button
          onClick={() => {
            setRun((value) => value + 1);
            setCovering(true);
          }}
        >
          Replay
        </Button>
      </Card>
      {covering ? (
        <DitherCover
          key={run}
          frozenAt={at}
          onDone={() => setCovering(false)}
        />
      ) : null}
    </div>
  );
}
