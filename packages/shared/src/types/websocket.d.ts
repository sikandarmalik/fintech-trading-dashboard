export declare const WS_EVENTS: {
    readonly SUBSCRIBE_SYMBOLS: "subscribeToSymbols";
    readonly UNSUBSCRIBE_SYMBOLS: "unsubscribeFromSymbols";
    readonly PRICE_UPDATE: "priceUpdate";
    readonly CONNECTION_ACK: "connectionAck";
    readonly SUBSCRIPTION_ACK: "subscriptionAck";
    readonly ERROR: "error";
};
export interface SubscribeSymbolsPayload {
    symbols: string[];
}
export interface UnsubscribeSymbolsPayload {
    symbols: string[];
}
