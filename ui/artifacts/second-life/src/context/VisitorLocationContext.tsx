import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadVisitorLocation, type VisitorLocationPayload } from "@/lib/visitor-location";

type VisitorLocationCtx = {
  location: VisitorLocationPayload | null;
  reload: () => void;
};

const Ctx = createContext<VisitorLocationCtx | undefined>(undefined);

export function VisitorLocationProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const location = useMemo(() => loadVisitorLocation(), [version]);

  const value = useMemo(() => ({ location, reload }), [location, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVisitorLocation(): VisitorLocationCtx {
  const raw = useContext(Ctx);
  if (!raw) {
    throw new Error("useVisitorLocation must be used within VisitorLocationProvider");
  }
  return raw;
}
