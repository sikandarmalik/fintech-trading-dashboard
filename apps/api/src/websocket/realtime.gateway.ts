import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MarketDataSimulator } from '../market-data/market-data-simulator.service';
import { WS_EVENTS, type SubscribeSymbolsPayload, type RealtimePriceUpdateDTO } from '@trading/shared';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  private unsubscribeFromSimulator: (() => void) | null = null;

  constructor(private readonly marketDataSimulator: MarketDataSimulator) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to price updates from simulator
    this.unsubscribeFromSimulator = this.marketDataSimulator.onPriceUpdate(
      (update: RealtimePriceUpdateDTO) => {
        this.broadcastPriceUpdate(update);
      },
    );
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
    
    // Send connection acknowledgment
    client.emit(WS_EVENTS.CONNECTION_ACK, { connected: true });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage(WS_EVENTS.SUBSCRIBE_SYMBOLS)
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeSymbolsPayload,
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (!subscriptions) return;

    // Add symbols to client's subscription set
    payload.symbols.forEach((symbol) => {
      subscriptions.add(symbol);
      // Join the room for this symbol
      client.join(`symbol:${symbol}`);
    });

    this.logger.debug(
      `Client ${client.id} subscribed to: ${payload.symbols.join(', ')}`,
    );

    // Acknowledge subscription
    client.emit(WS_EVENTS.SUBSCRIPTION_ACK, {
      subscribed: Array.from(subscriptions),
    });
  }

  @SubscribeMessage(WS_EVENTS.UNSUBSCRIBE_SYMBOLS)
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeSymbolsPayload,
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (!subscriptions) return;

    // Remove symbols from client's subscription set
    payload.symbols.forEach((symbol) => {
      subscriptions.delete(symbol);
      // Leave the room for this symbol
      client.leave(`symbol:${symbol}`);
    });

    this.logger.debug(
      `Client ${client.id} unsubscribed from: ${payload.symbols.join(', ')}`,
    );
  }

  private broadcastPriceUpdate(update: RealtimePriceUpdateDTO) {
    // Emit to all clients subscribed to this symbol's room
    this.server
      .to(`symbol:${update.ticker}`)
      .emit(`${WS_EVENTS.PRICE_UPDATE}:${update.ticker}`, update);
  }
}
