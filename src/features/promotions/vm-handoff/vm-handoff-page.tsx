import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { NotFoundPage } from "@/components/not-found-page";
import { previewHandoffAtom } from "@/data/atoms/machines";
import { handoffJamId, servicePreviewPane } from "./handoff-search";

export type VmHandoffPageProps = {
  machineId?: string;
  port?: number;
};

export function VmHandoffPage({ machineId, port }: VmHandoffPageProps) {
  const navigate = useNavigate();
  const handoff = useAtomSet(previewHandoffAtom, { mode: "promiseExit" });
  const [failed, setFailed] = useState(
    machineId === undefined || port === undefined,
  );

  useEffect(() => {
    if (machineId === undefined || port === undefined) return;
    let live = true;
    handoff({ params: { machineId, port: String(port) } }).then((exit) => {
      if (!live) return;
      const jamId = Exit.isSuccess(exit) ? handoffJamId(exit.value) : undefined;
      if (jamId === undefined) {
        setFailed(true);
        return;
      }
      navigate({
        to: "/thread/$threadId",
        params: { threadId: jamId },
        search: { pane: servicePreviewPane(machineId, port) },
        replace: true,
      });
    });
    return () => {
      live = false;
    };
  }, [handoff, machineId, navigate, port]);

  return failed ? <NotFoundPage /> : null;
}
