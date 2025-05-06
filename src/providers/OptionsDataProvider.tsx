import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { bybitClient } from '../api/bybit';
import type { OptionTicker, OptionInstrumentInfo } from '../api/bybit';
import type { OptionData } from '../mockData/optionsMock';

interface OptionsContextType {
  callOptions: OptionData[];
  putOptions: OptionData[];
  expirations: string[];
  selectedExpiry: string;
  setSelectedExpiry: (expiry: string) => void;
  currentPrice: number;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

const OptionsContext = createContext<OptionsContextType | undefined>(undefined);

// Helper to safely parse float, returns 0 if invalid
const safeParseFloat = (value: string | number | undefined): number => {
  if (value === undefined || value === null) return 0;
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
};

// 単純な型変換用ヘルパー
const safeParseNumber = (value: string | number | undefined): number => {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ヘルパー: シンボル文字列からストライク価格を抽出
const extractStrikeFromSymbol = (symbol: string): number => {
  const match = symbol.match(/-(\d+(?:\.\d+)?)-/);
  return match ? parseFloat(match[1]) : NaN;
};

// ヘルパー: deliveryTime を YYYY-MM-DD 形式に変換
const getExpiryDate = (deliveryTime: string): string => {
  const ts = Number(deliveryTime);
  const date = isNaN(ts) ? new Date(deliveryTime) : new Date(ts);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 指定されたBybit APIエンドポイントを直接呼び出す
const fetchBtcSpotPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    // console.log('[DataProvider] Direct Bybit API Response:', JSON.stringify(data, null, 2));

    if (data.retCode === 0 && data.result?.list?.[0]?.lastPrice) {
      const price = safeParseFloat(data.result.list[0].lastPrice);
      // console.log(`[DataProvider] Fetched BTC spot price directly: ${price}`);
      return price;
    } else {
      // console.warn('[DataProvider] Could not fetch BTC price from direct API call:', data.retMsg || 'Unknown error');
      return 0;
    }
  } catch (err) {
    console.error('[DataProvider] Error fetching BTC price directly:', err);
    return 0;
  }
};

export const OptionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [callOptions, setCallOptions] = useState<OptionData[]>([]);
  const [putOptions, setPutOptions] = useState<OptionData[]>([]);
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('all');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOptionsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // console.log('[DataProvider] Loading options instruments and tickers...');

    try {
      const [instrumentsResponse, tickersResponse] = await Promise.all([
        bybitClient.getOptionInstruments({ baseCoin: 'BTC' }),
        bybitClient.getOptionTickers({ baseCoin: 'BTC' }),
      ]);

      // インストゥルメント取得エラーチェック
      if (instrumentsResponse.retCode !== 0) {
        throw new Error(`Failed to fetch instruments: ${instrumentsResponse.retMsg}`);
      }
      if (!instrumentsResponse.result?.list || instrumentsResponse.result.list.length === 0) {
        console.warn('[DataProvider] No options instrument data found.');
        setCallOptions([]);
        setPutOptions([]);
        setExpirations([]);
        setLoading(false);
        return;
      }
      // ティッカー情報取得警告
      if (!tickersResponse.result?.list || tickersResponse.result.list.length === 0) {
        console.warn('[DataProvider] No options ticker data found.');
      }

      const instruments = instrumentsResponse.result.list;
      const tickers = tickersResponse.result.list || [];
      // ティッカーをマップ化
      const tickerMap = new Map<string, OptionTicker>();
      tickers.forEach((t: OptionTicker) => tickerMap.set(t.symbol, t));

      // オプションデータ組み立て
      const allOptions: OptionData[] = instruments.map((instrument: OptionInstrumentInfo) => {
        const ticker = tickerMap.get(instrument.symbol);
        // console.log(`[DataProvider Map] Instrument: ${instrument.symbol}, Lookup Key: ${instrument.symbol}, Found Ticker: ${!!ticker}, Raw MarkPrice: ${ticker?.markPrice}`); // Debug log updated
        const strikeNum = extractStrikeFromSymbol(instrument.symbol);
        // console.log(`[DataProvider] Instrument ${instrument.symbol} strikePrice: ${strikeNum}`);
        return {
          symbol: instrument.symbol,
          strike: strikeNum,
          type: instrument.optionsType.toLowerCase() as 'call' | 'put',
          expiry: getExpiryDate(instrument.deliveryTime),
          markPrice: safeParseFloat(ticker?.markPrice),
          iv: safeParseFloat(ticker?.markIv),
          delta: safeParseFloat(ticker?.delta),
          gamma: safeParseFloat(ticker?.gamma),
          theta: safeParseFloat(ticker?.theta),
          bid: safeParseFloat(ticker?.bid1Price),
          ask: safeParseFloat(ticker?.ask1Price),
          volume: safeParseFloat(ticker?.volume24h),
          openInterest: safeParseFloat(ticker?.openInterest),
          premium: safeParseFloat(ticker?.markPrice),
        };
      }).filter(opt => !isNaN(opt.strike) && opt.strike > 0);

      // 満期日抽出・フィルタ
      const calls = allOptions.filter(o => o.type === 'call');
      const puts = allOptions.filter(o => o.type === 'put');
      const rawExp = allOptions.map(o => o.expiry);
      const uniqueExp = Array.from(new Set(rawExp)).filter(e => e !== 'Invalid Date').sort();
      setCallOptions(calls);
      setPutOptions(puts);
      setExpirations(uniqueExp);
      if ((!uniqueExp.includes(selectedExpiry) || selectedExpiry === 'all') && uniqueExp.length) {
        setSelectedExpiry(uniqueExp[0]);
      }
      console.log(`[DataProvider] Loaded ${calls.length} calls, ${puts.length} puts for ${uniqueExp.length} expirations.`);
    } catch (err) {
      console.error('[DataProvider] Error loading options data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setCallOptions([]);
      setPutOptions([]);
      setExpirations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedExpiry]);

  // Initial data load (including initial price fetch)
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        // 直接APIから初期価格を取得
        const price = await fetchBtcSpotPrice();
        if (price > 0) {
          setCurrentPrice(price);
          console.log(`[DataProvider] Fetched initial BTC spot price: ${price}`);
        } else {
          console.warn('[DataProvider] Could not fetch initial BTC spot price (direct API call failed)');
          // Potentially set an error state here if initial price is critical
        }
        // Load options data after getting initial price
        await loadOptionsData();
      } catch (err) {
        console.error('[DataProvider] Error during initial load:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred during initial load');
        setCallOptions([]);
        setPutOptions([]);
        setExpirations([]);
      } finally {
        setLoading(false);
      }
    }
    initialLoad();
  }, [loadOptionsData]); // Depend on loadOptionsData to trigger initial load

  // Fetch BTC price periodically
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        // 直接APIエンドポイントから価格を取得
        const price = await fetchBtcSpotPrice();
        if (price > 0) {
          setCurrentPrice(price);
          console.log(`[DataProvider] Updated BTC spot price STATE to: ${price}`); // Log the spot price being set
        } else {
          console.warn('[DataProvider] Could not update BTC spot price (direct API call failed)');
        }
      } catch (err) {
        console.error('[DataProvider] Error fetching BTC spot price update:', err);
      }
    };

    // Fetch immediately first time
    // fetchBtcPrice(); // Already fetched in initial load effect

    const intervalId = setInterval(fetchBtcPrice, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const refreshData = useCallback(() => {
    console.log('[DataProvider] Refreshing options data...');
    // Consider if you also need to immediately refresh BTC price here
    // or rely on the next interval tick.
    loadOptionsData();
  }, [loadOptionsData]);

  return (
    <OptionsContext.Provider value={{
      callOptions,
      putOptions,
      expirations,
      selectedExpiry,
      setSelectedExpiry,
      currentPrice,
      loading,
      error,
      refreshData
    }}>
      {children}
    </OptionsContext.Provider>
  );
};

export const useOptions = () => {
  const context = useContext(OptionsContext);
  if (context === undefined) {
    throw new Error('useOptions must be used within an OptionsProvider');
  }
  return context;
};
