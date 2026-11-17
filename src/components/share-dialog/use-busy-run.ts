import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export type BusyRunStep = {
  readonly work: () => Promise<unknown>;
  readonly success: string;
  readonly failure: string;
  readonly undo?: () => Promise<unknown>;
};

export function useBusyRun() {
  const [busy, setBusy] = useState(false);
  const tail = useRef<Promise<boolean>>(Promise.resolve(true));
  const run = useCallback((step: BusyRunStep): Promise<boolean> => {
    setBusy(true);
    const current = tail.current
      .then(step.work)
      .then(
        () => {
          const undo = step.undo;
          toast.success(step.success, {
            action:
              undo === undefined
                ? undefined
                : {
                    label: "Undo",
                    onClick: () =>
                      void run({
                        work: undo,
                        success: "Change undone",
                        failure: "Could not undo change",
                      }),
                  },
          });
          return true;
        },
        () => {
          toast.error(step.failure);
          return false;
        },
      )
      .finally(() => {
        if (tail.current === current) setBusy(false);
      });
    tail.current = current;
    return current;
  }, []);
  return { busy, run };
}
