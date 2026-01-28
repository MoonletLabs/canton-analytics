import { Event } from "./types";

export interface EventProducerInterface {
  produceEvent(event: Event): void;
}

/**
 * In-memory implementation that emits events to registered listeners.
 * Replace with a queue/HTTP implementation in production if needed.
 */
export class EventProducer implements EventProducerInterface {
  private listeners: Set<(event: Event) => void> = new Set();

  produceEvent(event: Event): void {
    const payload: Event = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    };
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error("[EventProducer] listener error:", err);
      }
    });
  }

  /** For wiring: subscribe to events produced by this producer. */
  subscribe(listener: (event: Event) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
