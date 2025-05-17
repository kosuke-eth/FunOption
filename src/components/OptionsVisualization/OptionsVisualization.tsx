import React, { useState, useEffect, useCallback } from 'react';
import OptionsChart from '../OptionsChart/OptionsChart';
import OptionTradePanel from '../OptionTradePanel';
import { OptionData, useOptions } from '../../providers/OptionsDataProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSnackbar } from '../SnackbarProvider';
import { ChartStyles } from '../OptionsChart/colorUtils';
import { bybitClient } from '../../api/bybit';
import CryptoSelector from '../CryptoSelector/CryptoSelector';
import OptionTypeSelector, { OptionType } from '../controls/OptionTypeSelector';
import ExpiryDateSelector from '../controls/ExpiryDateSelector';

// Helper function to format dates (YYYY-MM-DD -> DD-MM-YY)
const formatExpiryDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr + 'T00:00:00Z'); // Assume UTC date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Get month as number (0-indexed + 1)
    const year = String(date.getUTCFullYear()).substring(2);
    return `${day}-${month}-${year}`;
  } catch (err) {
    console.error('Date formatting error:', dateStr, err);
    return dateStr || 'Invalid Date';
  }
};

const OptionsVisualization: React.FC = () => {
  const {
    callOptions,
    putOptions,
    expirations, // Use this for expiry dates
    currentPrice,
    selectedExpiry,
    setSelectedExpiry,
    loading,
    error,
  } = useOptions();

  // 暗号通貨の選択と価格データ管理のための状態
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [cryptoPrices, setCryptoPrices] = useState<{
    BTC: number;
    ETH: number;
    SOL: number;
  }>({
    BTC: currentPrice || 0,
    ETH: 0,
    SOL: 0
  });
  const [cryptoDataLoading, setCryptoDataLoading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'call' | 'put'>('call');
  const [filteredOptions, setFilteredOptions] = useState<OptionData[]>([]);
  const [tradePanelVisible, setTradePanelVisible] = useState<boolean>(false);
  const [selectedOptionDetail, setSelectedOptionDetail] = useState<OptionData | null>(null);

  // ウィンドウサイズの状態管理
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    { width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight : 600 }
  );

  // Wallet & Snackbar contexts for OptionTradePanel
  const wallet = useWallet();
  const { showSnackbar } = useSnackbar();

  // 簡易 throttle 実装（追加依存なし）
  function throttle<F extends (...args: any[]) => void>(func: F, wait: number): F {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: any[] | null = null;
    return function(this: any, ...args: any[]) {
      lastArgs = args;
      if (!timeout) {
        timeout = setTimeout(() => {
          func.apply(this, lastArgs!);
          timeout = null;
        }, wait);
      }
    } as F;
  }

  // ウィンドウサイズの変更を検知するハンドラー
  const handleResize = useCallback(
    throttle(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 200),
    []
  );

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // 初期サイズを設定
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize]);

  // 初期化時に最初の満期日を選択
  useEffect(() => {
    // Use 'expirations' from the provider
    if (expirations && expirations.length > 0 && !selectedExpiry) {
      // If no expiry is selected yet, and expirations are available, select the first one.
      // The provider already sorts expirations and handles the 'all' case if needed.
      if (expirations[0] !== 'all') { // Ensure 'all' is not auto-selected if it's a placeholder
        setSelectedExpiry(expirations[0]);
      }
    } else if (expirations && expirations.length > 0 && selectedExpiry && !expirations.includes(selectedExpiry)) {
      // If current selectedExpiry is not in the list (e.g., after data refresh), select the first valid one.
      setSelectedExpiry(expirations[0] === 'all' && expirations.length > 1 ? expirations[1] : expirations[0]);
    }
  }, [expirations, selectedExpiry, setSelectedExpiry]);

  // 複数の暗号通貨のリアルタイム価格データを取得
  useEffect(() => {
    const fetchRealtimePrices = async () => {
      setCryptoDataLoading(true);
      try {
        // USDC建ての暗号通貨価格を取得（より正確な市場価格）
        const priceData = await bybitClient.getRealtimePrices(['BTCUSDC', 'ETHUSDC', 'SOLUSDC']);

        // 各暗号通貨の最新価格を設定
        setCryptoPrices({
          BTC: priceData['BTCUSDC'] || 0,
          ETH: priceData['ETHUSDC'] || 0,
          SOL: priceData['SOLUSDC'] || 0
        });

        console.log('リアルタイム価格取得成功:', priceData);
      } catch (error) {
        console.error('リアルタイム価格データの取得に失敗しました:', error);
      } finally {
        setCryptoDataLoading(false);
      }
    };

    fetchRealtimePrices();

    // 価格データを定期的に更新（30秒ごと - より頻繁に更新）
    const intervalId = setInterval(fetchRealtimePrices, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // フィルタリングロジック
  useEffect(() => {
    const sourceOptions = activeTab === 'call' ? callOptions : putOptions;

    // 満期でフィルタリング
    let filtered = selectedExpiry === 'all'
      ? sourceOptions
      : sourceOptions.filter((opt: OptionData) => opt.expiry === selectedExpiry);

    setFilteredOptions(filtered);
  }, [activeTab, selectedExpiry, callOptions, putOptions]);

  // Option selection handler
  const handleOptionSelect = (option: OptionData) => {
    setSelectedOptionDetail(option);
    setTradePanelVisible(true);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] bg-[linear-gradient(135deg,#0D0D0D_0%,#121212_100%)] text-white font-grotesk p-3 sm:p-4 md:p-6">

      {/* Tab Switching */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <OptionTypeSelector
          selectedType={activeTab}
          onChange={setActiveTab}
          variant="chart"
        />

        {/* Cryptocurrency selector component */}
        <CryptoSelector
          selectedCrypto={selectedCrypto}
          cryptoPrices={cryptoPrices}
          onChange={setSelectedCrypto}
          loading={cryptoDataLoading}
        />
      </div>

      {/* Date Selection */}
      <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 bg-funoption-bg rounded-options p-2 sm:p-2.5">
        {expirations && expirations.length > 0 ? (
          <ExpiryDateSelector
            expirations={expirations.filter(exp => exp !== 'all')}
            selectedExpiry={selectedExpiry}
            onChange={setSelectedExpiry}
            showAllOption={true}
          />
        ) : (
          <span className="px-3 py-1.5 rounded-xl text-xs bg-funoption-bg-light text-funoption-text-muted animate-pulse">
            Loading expiration dates...
          </span>
        )}
      </div>

      {/* Options Chart */}
      {(() => {
        const isMobile = windowSize.width < 640;
        // モバイル／デスクトップでのウィンドウ幅に合わせてチャートサイズを調整
        // モバイルでは画面幅 - 32px (padding想定) を基準にし、最小幅を360pxに固定
        const chartWidth = isMobile
          ? Math.max(windowSize.width - 32, 360)
          : (windowSize.width - 64); // Desktop width based on window, no 1200px cap for aspect ratio calculation

        // 高さはアスペクト比を維持しつつ、最大800pxに制限
        const chartHeight = isMobile
          ? Math.round(chartWidth * 0.9)
          : Math.min(Math.round(chartWidth * 0.66), 800);
        return (
          <div className="relative rounded-2xl mb-4 sm:mb-6 animate-fadeIn h-full">
            {filteredOptions && filteredOptions.length > 0 ? (
              <div
                className={isMobile ? "w-full overflow-x-auto" : "w-full overflow-x-auto"}
                style={{ height: `${chartHeight}px` }}
              >
                {/* Inner div now takes full width of its parent */}
                <div
                  className="w-full"
                >
                  <OptionsChart
                    data={filteredOptions}
                    currentPrice={cryptoPrices[selectedCrypto] || 0}
                    cryptoSymbol={selectedCrypto}
                    width={chartWidth}
                    height={chartHeight}
                    onOptionSelect={handleOptionSelect}
                  />
                </div>
              </div>
            ) : (
              <div className="py-8 sm:py-12 px-3 sm:px-4 bg-gradient-to-b from-funoption-bg to-funoption-bg-dark rounded-2xl text-center shadow-xl">
                <p className="text-funoption-text-muted">
                  表示するデータがありません。他の満期日を選択してください。
                </p>
              </div>
            )}
          </div>
        );
      })()}


      {loading ? (
        <div className="flex items-center justify-center py-8 text-funoption-text-muted animate-pulse">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading chart data...
        </div>
      ) : error ? (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          Error loading chart data: {error}
        </div>
      ) : (
        tradePanelVisible && selectedOptionDetail && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) { setTradePanelVisible(false); setSelectedOptionDetail(null); } }}
          >
            <OptionTradePanel
              option={selectedOptionDetail}
              wallet={wallet}
              showSnackbar={showSnackbar}
              onClose={() => setTradePanelVisible(false)}
            />
          </div>
        )
      )}
    </div>
  );
};

export default OptionsVisualization;
