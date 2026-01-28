/**
 * Base event shape for the event-driven analytics system.
 * Handlers dispatch by event.type (string).
 */
export interface Event {
  type: string;
  data?: unknown;
  timestamp?: number;
}
