// Symbol types
export interface SymbolDTO {
  id: string;
  ticker: string;
  name: string;
  market: string;
}

export interface SymbolListResponseDTO {
  data: SymbolDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface SymbolQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
}
