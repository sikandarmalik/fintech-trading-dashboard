'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { symbolsApi } from '@/lib/api';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { PriceChart } from '@/components/PriceChart';
import { PriceTicker } from '@/components/PriceTicker';
import { WatchlistPanel } from '@/components/WatchlistPanel';
import { SymbolSearch } from '@/components/SymbolSearch';

// Configuration constants
const HISTORY_REFETCH_INTERVAL_MS = 5000;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get selected symbol from URL
  const selectedSymbol = searchParams.get('symbol') || '0005.HK';

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch all symbols for real-time updates
  const { data: symbolsData } = useQuery({
    queryKey: ['symbols', 'all'],
    queryFn: () => symbolsApi.list({ limit: 100 }),
    enabled: !!user,
  });

  // Extract all tickers
  const allTickers = useMemo(
    () => symbolsData?.data.map((s) => s.ticker) || [],
    [symbolsData]
  );

  // Fetch historical data for selected symbol
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history', selectedSymbol],
    queryFn: () => symbolsApi.history(selectedSymbol, 200),
    enabled: !!user && !!selectedSymbol,
    refetchInterval: HISTORY_REFETCH_INTERVAL_MS,
  });

  // Real-time prices
  const { prices, isConnected } = useRealtimePrices({
    symbols: allTickers,
    enabled: !!user && allTickers.length > 0,
  });

  const handleSymbolSelect = (ticker: string) => {
    router.push(`/dashboard?symbol=${ticker}`);
    setSidebarOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#1a1a2e] border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">📈 Trading Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400 hidden sm:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-gray-600 rounded hover:border-gray-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Mobile overlay */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-80 bg-[#0a0a0a] transform transition-transform lg:relative lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:w-80 pt-16 lg:pt-0
          `}
        >
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <SymbolSearch onSymbolSelect={handleSymbolSelect} />
            <WatchlistPanel onSymbolSelect={handleSymbolSelect} selectedSymbol={selectedSymbol} />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 min-h-[calc(100vh-60px)]">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Chart - spans 2 columns on xl */}
            <div className="xl:col-span-2">
              <div className="bg-[#1a1a2e] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedSymbol}</h2>
                    {prices.get(selectedSymbol) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-3xl font-mono font-bold text-white">
                          ${prices.get(selectedSymbol)?.close.toFixed(2)}
                        </span>
                        <span
                          className={`text-lg font-medium ${
                            (prices.get(selectedSymbol)?.change || 0) >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {(prices.get(selectedSymbol)?.change || 0) >= 0 ? '+' : ''}
                          {prices.get(selectedSymbol)?.change.toFixed(2)} (
                          {(prices.get(selectedSymbol)?.changePercent || 0) >= 0 ? '+' : ''}
                          {prices.get(selectedSymbol)?.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="bg-[#1a1a2e] rounded-lg p-4 h-[400px] flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading chart...</div>
                </div>
              ) : historyData && historyData.length > 0 ? (
                <PriceChart data={historyData} ticker={selectedSymbol} />
              ) : (
                <div className="bg-[#1a1a2e] rounded-lg p-4 h-[400px] flex items-center justify-center">
                  <div className="text-gray-400">No historical data available</div>
                </div>
              )}
            </div>

            {/* Right sidebar - Price ticker */}
            <div className="xl:col-span-1">
              <PriceTicker
                prices={prices}
                onSymbolClick={handleSymbolSelect}
                selectedSymbol={selectedSymbol}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse text-xl text-gray-400">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
