import { toast } from "@/primitives/toaster";

export const copyText = (
  text: string,
  success: string,
  failure: string,
  description?: string,
) => {
  if (navigator.clipboard === undefined) {
    toast.error(failure);
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => toast.success(success, { description }),
    () => toast.error(failure, { description }),
  );
};
