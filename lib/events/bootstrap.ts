import { EventProducer } from "./EventProducer";
import { EventConsumer } from "./EventConsumer";
import { AnalyticHandler } from "./AnalyticHandler";

let unsubscribeProducerToConsumer: (() => void) | null = null;
let unsubscribeConsumerToHandler: (() => void) | null = null;

/**
 * Creates EventProducer, EventConsumer, and AnalyticHandler, wires them:
 * - Events produced by the producer are delivered to the consumer.
 * - The consumer forwards all events to the AnalyticHandler.handleEvent.
 * Returns the producer (for publishing) and an unsubscribe function to tear down.
 */
export function bootstrapAnalytics(): {
  producer: EventProducer;
  consumer: EventConsumer;
  handler: AnalyticHandler;
  unsubscribe: () => void;
} {
  const producer = new EventProducer();
  const consumer = new EventConsumer();
  const handler = new AnalyticHandler(producer, consumer);

  unsubscribeProducerToConsumer = producer.subscribe((event) => consumer.deliver(event));
  unsubscribeConsumerToHandler = consumer.subscribe((event) => handler.handleEvent(event));

  function unsubscribe(): void {
    unsubscribeProducerToConsumer?.();
    unsubscribeConsumerToHandler?.();
    unsubscribeProducerToConsumer = null;
    unsubscribeConsumerToHandler = null;
  }

  return { producer, consumer, handler, unsubscribe };
}
