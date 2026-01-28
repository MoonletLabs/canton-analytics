"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { bootstrapAnalytics } from "@/lib/events";
import type { EventProducer } from "@/lib/events/EventProducer";

const AnalyticsContext = createContext<EventProducer | null>(null);

export function useEventProducer(): EventProducer | null {
  return useContext(AnalyticsContext);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [producer, setProducer] = useState<EventProducer | null>(null);

  useEffect(() => {
    const { producer: p, unsubscribe } = bootstrapAnalytics();
    setProducer(p);
    return () => {
      unsubscribe();
      setProducer(null);
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={producer}>
      {children}
    </AnalyticsContext.Provider>
  );
}
