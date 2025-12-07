'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { symbolsApi } from '@/lib/api';

interface SymbolSearchProps {
  onSymbolSelect?: (ticker: string) => void;
}

export function SymbolSearch({ onSymbolSelect }: SymbolSearchProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['symbols', search],
    queryFn: () => symbolsApi.list({ search: search || undefined, limit: 20 }),
    enabled: true,
  });

  return (
    <div className="bg-[#1a1a2e] rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Search Symbols</h2>
      
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ticker or name..."
        className="w-full px-3 py-2 bg-[#252540] text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
      />

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {data?.data.map((symbol) => (
            <div
              key={symbol.id}
              onClick={() => onSymbolSelect?.(symbol.ticker)}
              className="p-2 hover:bg-[#252540] rounded cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{symbol.ticker}</span>
                <span className="text-xs text-gray-400">{symbol.market}</span>
              </div>
              <p className="text-sm text-gray-400 truncate">{symbol.name}</p>
            </div>
          ))}
          {data?.data.length === 0 && (
            <p className="text-gray-400 text-sm">No symbols found</p>
          )}
        </div>
      )}
    </div>
  );
}
