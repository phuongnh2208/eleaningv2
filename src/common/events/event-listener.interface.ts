export interface EventListener<TEvent = any> {
  handle(event: TEvent): Promise<void> | void;
}
