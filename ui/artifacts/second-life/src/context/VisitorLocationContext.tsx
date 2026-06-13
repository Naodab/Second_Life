import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureVisitorLocationFromIp,
  loadVisitorLocation,
  type VisitorLocationPayload,
} from "@/lib/visitor-location";

type VisitorLocationCtx = {
  location: VisitorLocationPayload | null;
  /** False until the one-time IP resolve attempt finishes (cached hits resolve immediately). */
  locationResolveDone: boolean;
  reload: () => void;
};

const Ctx = createContext<VisitorLocationCtx | undefined>(undefined);

export function VisitorLocationProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [locationResolveDone, setLocationResolveDone] = useState(
    () => loadVisitorLocation() != null,
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (locationResolveDone) return;
    let cancelled = false;
    ensureVisitorLocationFromIp().then((resolved) => {
      if (cancelled) return;
      if (resolved) reload();
      setLocationResolveDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [locationResolveDone, reload]);

  const location = useMemo(() => loadVisitorLocation(), [version]);

  const value = useMemo(
    () => ({ location, locationResolveDone, reload }),
    [location, locationResolveDone, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVisitorLocation(): VisitorLocationCtx {
  const raw = useContext(Ctx);
  if (!raw) {
    throw new Error("useVisitorLocation must be used within VisitorLocationProvider");
  }
  return raw;
}
