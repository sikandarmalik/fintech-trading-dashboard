'use client';

import { useEffect, useState } from 'react';

interface PriceData {
  ticker: string;
  close: number;
  change: number;
  changePercent: number;
  priceDirection?: 'up' | 'down' | 'unchanged';
  timestamp?: Date;
}

interface PriceTickerProps {
  prices: Map<string, PriceData>;
  onSymbolClick?: (ticker: string) => void;
  selectedSymbol?: string;
}

export function PriceTicker({ prices, onSymbolClick, selectedSymbol }: PriceTickerProps) {
  const [flashStates, setFlashStates] = useState<Map<string, 'up' | 'down' | null>>(new Map());

  // Handle price changes with flash effect
  useEffect(() => {
    prices.forEach((price, ticker) => {
      if (price.priceDirection && price.priceDirection !== 'unchanged') {
        setFlashStates((prev) => new Map(prev).set(ticker, price.priceDirection as 'up' | 'down'));
        
        // Clear flash after animation
        setTimeout(() => {
          setFlashStates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(ticker);
            return newMap;
          });
        }, 500);
      }
    });
  }, [prices]);

  const priceList = Array.from(prices.entries());

  if (priceList.length === 0) {
    return (
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Live Prices</h2>
        <p className="text-gray-400 text-sm">Waiting for price data...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e] rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Live Prices</h2>
      <div className="space-y-2">
        {priceList.map(([ticker, data]) => {
          const flashState = flashStates.get(ticker);
          const isUp = data.change >= 0;
          
          return (
            <div
              key={ticker}
              onClick={() => onSymbolClick?.(ticker)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all duration-200
                ${selectedSymbol === ticker ? 'bg-blue-900/50 border border-blue-500' : 'bg-[#252540] hover:bg-[#2d2d50]'}
                ${flashState === 'up' ? 'animate-flash-green' : ''}
                ${flashState === 'down' ? 'animate-flash-red' : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{ticker}</span>
                <span className={`font-mono font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  ${data.close.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-400">
                  {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--'}
                </span>
                <span className={isUp ? 'text-green-400' : 'text-red-400'}>
                  {isUp ? '+' : ''}{data.change.toFixed(2)} ({isUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
