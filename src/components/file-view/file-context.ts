import { createContext } from "react";

export type ViewportHandler = (element: HTMLElement | null) => void;

export const FileHeaderLeadContext =
  createContext<import("react").ReactNode>(null);

export const FileSourceModeContext = createContext<(source: boolean) => void>(
  () => {},
);

export const FileCopyTextContext = createContext<
  (text: string | undefined) => void
>(() => {});

export const FileViewportContext = createContext<ViewportHandler>(() => {});

export type DiffWrap = { wrap: boolean; setWrap: (wrap: boolean) => void };

export const DiffWrapContext = createContext<DiffWrap>({
  wrap: false,
  setWrap: () => {},
});
