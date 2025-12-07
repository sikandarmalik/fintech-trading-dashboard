// WebSocket event types
export const WS_EVENTS = {
  SUBSCRIBE_SYMBOLS: 'subscribeToSymbols',
  UNSUBSCRIBE_SYMBOLS: 'unsubscribeFromSymbols',
  PRICE_UPDATE: 'priceUpdate',
  CONNECTION_ACK: 'connectionAck',
  SUBSCRIPTION_ACK: 'subscriptionAck',
  ERROR: 'error',
} as const;

export interface SubscribeSymbolsPayload {
  symbols: string[];
}

export interface UnsubscribeSymbolsPayload {
  symbols: string[];
}
