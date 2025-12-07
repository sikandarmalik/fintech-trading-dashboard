'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RealtimePriceUpdateDTO } from '@trading/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

interface UseRealtimePricesOptions {
  symbols: string[];
  enabled?: boolean;
}

interface PriceData extends RealtimePriceUpdateDTO {
  prevClose?: number;
  priceDirection?: 'up' | 'down' | 'unchanged';
}

export function useRealtimePrices({ symbols, enabled = true }: UseRealtimePricesOptions) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());

  // Memoize symbols string to avoid unnecessary effects
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  // Handle price updates
  const handlePriceUpdate = useCallback((ticker: string, data: RealtimePriceUpdateDTO) => {
    setPrices((prev) => {
      const newMap = new Map(prev);
      const prevData = prev.get(ticker);
      const prevClose = prevData?.close;
      
      let priceDirection: 'up' | 'down' | 'unchanged' = 'unchanged';
      if (prevClose !== undefined) {
        if (data.close > prevClose) priceDirection = 'up';
        else if (data.close < prevClose) priceDirection = 'down';
      }

      newMap.set(ticker, {
        ...data,
        prevClose,
        priceDirection,
      });
      return newMap;
    });
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    const socket = io(`${WS_URL}/realtime`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      
      // Subscribe to symbols
      socket.emit('subscribeToSymbols', { symbols });
      subscribedSymbolsRef.current = new Set(symbols);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socket.on('connectionAck', () => {
      console.log('WebSocket connection acknowledged');
    });

    socket.on('subscriptionAck', (data: { subscribed: string[] }) => {
      console.log('Subscribed to:', data.subscribed);
    });

    // Set up listeners for each symbol
    symbols.forEach((ticker) => {
      socket.on(`priceUpdate:${ticker}`, (data: RealtimePriceUpdateDTO) => {
        handlePriceUpdate(ticker, data);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      subscribedSymbolsRef.current.clear();
    };
    // symbolsKey is derived from symbols, use only symbolsKey for stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, symbolsKey, handlePriceUpdate]);

  // Handle symbol changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const currentSymbols = new Set(symbols);
    const subscribedSymbols = subscribedSymbolsRef.current;

    // Find symbols to subscribe
    const toSubscribe = symbols.filter((s) => !subscribedSymbols.has(s));
    // Find symbols to unsubscribe
    const toUnsubscribe = Array.from(subscribedSymbols).filter((s) => !currentSymbols.has(s));

    if (toSubscribe.length > 0) {
      socket.emit('subscribeToSymbols', { symbols: toSubscribe });
      toSubscribe.forEach((s) => {
        subscribedSymbols.add(s);
        socket.on(`priceUpdate:${s}`, (data: RealtimePriceUpdateDTO) => {
          handlePriceUpdate(s, data);
        });
      });
    }

    if (toUnsubscribe.length > 0) {
      socket.emit('unsubscribeFromSymbols', { symbols: toUnsubscribe });
      toUnsubscribe.forEach((s) => {
        subscribedSymbols.delete(s);
        socket.off(`priceUpdate:${s}`);
      });
    }
    // symbolsKey is derived from symbols, use only symbolsKey for stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, isConnected, handlePriceUpdate]);

  return {
    prices,
    isConnected,
    error,
  };
}
