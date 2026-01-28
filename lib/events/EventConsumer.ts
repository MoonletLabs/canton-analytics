import { Event } from "./types";

export interface EventConsumerInterface {
  subscribe(callback: (event: Event) => void): () => void;
}

/**
 * In-memory consumer that receives events from a producer and forwards to subscribers.
 * In production this might read from a message bus or HTTP stream.
 */
export class EventConsumer implements EventConsumerInterface {
  private subscribers: Set<(event: Event) => void> = new Set();

  subscribe(callback: (event: Event) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /** Internal: deliver an event to all subscribers (e.g. called by producer wiring). */
  deliver(event: Event): void {
    this.subscribers.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error("[EventConsumer] subscriber error:", err);
      }
    });
  }
}
