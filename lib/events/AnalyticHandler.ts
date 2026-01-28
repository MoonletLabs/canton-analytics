import { EventProducer } from "./EventProducer";
import { EventConsumer } from "./EventConsumer";
import { Event } from "./types";
import { AnalyticHandlerInterface } from "./AnalyticHandlerInterface";

export class AnalyticHandler implements AnalyticHandlerInterface {
  private handlerMap: Map<string, (event: Event) => void>;
  private readonly eventProducer: EventProducer;
  private readonly eventConsumer: EventConsumer;

  constructor(eventProducer: EventProducer, eventConsumer: EventConsumer) {
    this.eventProducer = eventProducer;
    this.eventConsumer = eventConsumer;
    this.handlerMap = new Map();
    this._registerHandlers();
  }

  private _registerHandlers(): void {
    this.handlerMap.set("UserLoggedIn", this.handleUserLogin.bind(this));
    this.handlerMap.set("ProductViewed", this.handleProductViewed.bind(this));
    this.handlerMap.set("ValidatorLiveness", this.handleValidatorLiveness.bind(this));
    this.handlerMap.set("RoundCompleted", this.handleRoundCompleted.bind(this));
  }

  handleEvent(event: Event): void {
    const handler = this.handlerMap.get(event.type);
    if (handler) {
      handler(event);
    } else {
      console.warn(`No handler registered for event type: ${event.type}`);
    }
  }

  private handleUserLogin(event: Event): void {
    console.log("[AnalyticHandler] Handling user login event:", event.type, event.data);
    this.eventProducer.produceEvent({
      type: "AnalyticUserLoginEvent",
      data: { original: event.data, processedAt: Date.now() },
    });
  }

  private handleProductViewed(event: Event): void {
    console.log("[AnalyticHandler] Handling product viewed event:", event.type, event.data);
    this.eventProducer.produceEvent({
      type: "AnalyticProductViewedEvent",
      data: { original: event.data, processedAt: Date.now() },
    });
  }

  private handleValidatorLiveness(event: Event): void {
    console.log("[AnalyticHandler] Handling validator liveness event:", event.type, event.data);
    this.eventProducer.produceEvent({
      type: "AnalyticValidatorLivenessEvent",
      data: { original: event.data, processedAt: Date.now() },
    });
  }

  private handleRoundCompleted(event: Event): void {
    console.log("[AnalyticHandler] Handling round completed event:", event.type, event.data);
    this.eventProducer.produceEvent({
      type: "AnalyticRoundCompletedEvent",
      data: { original: event.data, processedAt: Date.now() },
    });
  }
}
