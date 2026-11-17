import { createContext, useContext } from "react";

export const PullOrgContext = createContext<string | undefined>(undefined);

export const usePullOrgId = () => useContext(PullOrgContext) ?? "";
