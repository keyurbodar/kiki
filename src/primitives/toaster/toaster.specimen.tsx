import { useEffect } from "react";
import { Toaster, toast } from ".";

export function ToasterSpecimen() {
  useEffect(() => {
    toast.success("Pull request opened", {
      duration: Number.POSITIVE_INFINITY,
    });
    toast.error("Push rejected", {
      description: "The remote has commits you don't have yet.",
      duration: Number.POSITIVE_INFINITY,
    });
    toast.warning("Machine is low on memory", {
      duration: Number.POSITIVE_INFINITY,
    });
    toast.info("Setup snapshot is building", {
      description: "New threads boot from it when it finishes.",
      action: { label: "View", onClick: () => {} },
      cancel: { label: "Dismiss" },
      duration: Number.POSITIVE_INFINITY,
    });
    toast("Copied thread link", { duration: Number.POSITIVE_INFINITY });
    return () => {
      toast.dismiss();
    };
  }, []);
  return <Toaster expand visibleToasts={5} />;
}
