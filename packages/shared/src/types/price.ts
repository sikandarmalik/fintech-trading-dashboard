// Price tick types for OHLCV data
export interface PriceTickDTO {
  id: string;
  symbolId: string;
  ticker: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataQueryDTO {
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  limit?: number;
}

export interface HistoricalDataResponseDTO {
  ticker: string;
  data: PriceTickDTO[];
}

// Real-time price update
export interface RealtimePriceUpdateDTO {
  ticker: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}
