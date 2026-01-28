import { Event } from "./types";

export interface AnalyticHandlerInterface {
  handleEvent(event: Event): void;
}
