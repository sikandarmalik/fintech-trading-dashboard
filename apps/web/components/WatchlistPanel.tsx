'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi, symbolsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface WatchlistPanelProps {
  onSymbolSelect?: (ticker: string) => void;
  selectedSymbol?: string;
}

export function WatchlistPanel({ onSymbolSelect, selectedSymbol }: WatchlistPanelProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showNewWatchlistForm, setShowNewWatchlistForm] = useState(false);
  const [symbolToAdd, setSymbolToAdd] = useState('');
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);

  // Fetch watchlists
  const { data: watchlists, isLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => watchlistApi.list(token!),
    enabled: !!token,
  });

  // Fetch symbols for autocomplete
  const { data: symbols } = useQuery({
    queryKey: ['symbols'],
    queryFn: () => symbolsApi.list({ limit: 100 }),
  });

  // Create watchlist mutation
  const createWatchlistMutation = useMutation({
    mutationFn: (name: string) => watchlistApi.create(token!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      setNewWatchlistName('');
      setShowNewWatchlistForm(false);
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      watchlistApi.addItem(token!, watchlistId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      setSymbolToAdd('');
      setActiveWatchlistId(null);
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: ({ watchlistId, itemId }: { watchlistId: string; itemId: string }) =>
      watchlistApi.removeItem(token!, watchlistId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim()) {
      createWatchlistMutation.mutate(newWatchlistName.trim());
    }
  };

  const handleAddSymbol = (watchlistId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (symbolToAdd.trim()) {
      addItemMutation.mutate({ watchlistId, symbol: symbolToAdd.trim().toUpperCase() });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1a2e] rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Watchlists</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e] rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Watchlists</h2>
        <button
          onClick={() => setShowNewWatchlistForm(!showNewWatchlistForm)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          + New
        </button>
      </div>

      {showNewWatchlistForm && (
        <form onSubmit={handleCreateWatchlist} className="mb-4">
          <input
            type="text"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            placeholder="Watchlist name"
            className="w-full px-3 py-2 bg-[#252540] text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewWatchlistForm(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {watchlists?.map((watchlist) => (
          <div key={watchlist.id} className="bg-[#252540] rounded-lg p-3">
            <h3 className="font-medium text-white mb-2">{watchlist.name}</h3>
            
            <div className="space-y-1">
              {watchlist.items.map((item) => (
                <div
                  key={item.id}
                  className={`
                    flex justify-between items-center p-2 rounded cursor-pointer
                    ${selectedSymbol === item.symbol ? 'bg-blue-900/50' : 'hover:bg-[#2d2d50]'}
                  `}
                >
                  <span
                    onClick={() => onSymbolSelect?.(item.symbol)}
                    className="text-gray-300 hover:text-white flex-1"
                  >
                    {item.symbol}
                  </span>
                  <button
                    onClick={() => removeItemMutation.mutate({ watchlistId: watchlist.id, itemId: item.id })}
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {activeWatchlistId === watchlist.id ? (
              <form onSubmit={(e) => handleAddSymbol(watchlist.id, e)} className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symbolToAdd}
                    onChange={(e) => setSymbolToAdd(e.target.value)}
                    placeholder="e.g., 0005.HK"
                    className="flex-1 px-2 py-1 bg-[#1a1a2e] text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                    list="symbols-list"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
                <datalist id="symbols-list">
                  {symbols?.data.map((s) => (
                    <option key={s.id} value={s.ticker}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
              </form>
            ) : (
              <button
                onClick={() => setActiveWatchlistId(watchlist.id)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                + Add symbol
              </button>
            )}
          </div>
        ))}
      </div>

      {(!watchlists || watchlists.length === 0) && (
        <p className="text-gray-400 text-sm">No watchlists yet. Create one to get started!</p>
      )}
    </div>
  );
}
