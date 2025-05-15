import React, { useState, useEffect } from 'react';
import { OptionData, useOptions } from 'providers/OptionsDataProvider';
import OptionCard from './OptionCard';
import { ChartStyles } from '../OptionsChart/colorUtils';
import CryptoSelector from '../CryptoSelector/CryptoSelector';
import { bybitClient } from '../../api/bybit';
import OptionTypeSelector, { OptionType } from '../controls/OptionTypeSelector';
import ExpiryDateSelector from '../controls/ExpiryDateSelector';

/**
 * リスク/リワード比が悪いオプションを判定する関数
 * 型安全性と数値変換の安全性を向上
 */
const isPoorRR = (option: OptionData, currentPrice: number): boolean => {
  // デルタが無効な場合はリスク/リワード計算不可
  const delta = typeof option.delta === 'string'
    ? parseFloat(option.delta)
    : typeof option.delta === 'number'
      ? option.delta
      : null;

  if (delta === null) return true;

  // マークプライスの安全な変換
  const markPriceNum = typeof option.markPrice === 'string'
    ? parseFloat(option.markPrice)
    : typeof option.markPrice === 'number'
      ? option.markPrice
      : NaN;

  if (isNaN(markPriceNum) || markPriceNum <= 0) return true;

  // ストライク価格の安全な変換
  const strike = typeof option.strike === 'string'
    ? parseFloat(option.strike)
    : typeof option.strike === 'number'
      ? option.strike
      : NaN;

  if (isNaN(strike)) return true;

  // 本質的価値の計算
  const intrinsic = option.type === 'call'
    ? Math.max(0, currentPrice - strike)
    : Math.max(0, strike - currentPrice);

  // 時間的価値の計算
  const timeValue = Math.max(0, markPriceNum - intrinsic);
  const timeValPct = (timeValue / markPriceNum) * 100;

  // リスク/リワード比の計算
  const rrRaw = (Math.abs(delta * 100) - timeValPct);

  // -10未満はリスク/リワード比が悪いと判断
  return rrRaw < -10;
};

interface AIRecommendedOptionsListProps {
  loadingMessage?: string;
  onPurchaseClick: (option: OptionData) => void;
}

const AIRecommendedOptionsList: React.FC<AIRecommendedOptionsListProps> = ({
  loadingMessage,
  onPurchaseClick,
}) => {
  const {
    callOptions,
    putOptions,
    expirations,
    selectedExpiry,
    setSelectedExpiry,
    currentPrice,
    loading,
    error,
    loadingMessage: loadingMessageFromProvider
  } = useOptions();

  const [selectedOptionType, setSelectedOptionType] = useState<'call' | 'put'>('call');

  // 暗号通貨の選択と価格データ管理
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [cryptoPrices, setCryptoPrices] = useState<{
    BTC: number;
    ETH: number;
    SOL: number;
  }>({
    BTC: 0,
    ETH: 0,
    SOL: 0
  });
  const [cryptoDataLoading, setCryptoDataLoading] = useState<boolean>(false);

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
      } catch (error) {
        console.error('リアルタイム価格データの取得に失敗しました:', error);
      } finally {
        setCryptoDataLoading(false);
      }
    };

    fetchRealtimePrices();

    // 価格データを定期的に更新（30秒ごと）
    const intervalId = setInterval(fetchRealtimePrices, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const baseOptions = selectedOptionType === 'call' ? callOptions : putOptions;

  const filteredByExpiry = selectedExpiry === 'all'
    ? baseOptions
    : baseOptions.filter(option => option.expiry === selectedExpiry);

  let chartConditionOptions: OptionData[] = [];
  if (currentPrice !== null && currentPrice !== undefined) {
    chartConditionOptions = filteredByExpiry
      .filter(option => {
        return Math.abs(option.strike - (currentPrice || 0)) / (currentPrice || 1) < 0.2;
      })
      .filter(option => {
        return !isPoorRR(option, currentPrice || 0);
      })
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 15);
  }

  const recommendedPicks = chartConditionOptions.slice(0, 4);

  if (loading) {
    return <div className="text-center p-10 text-white">{loadingMessage || loadingMessageFromProvider || 'Loading options...'}</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  if (expirations.length === 0 && !loading) {
    return <div className="text-center p-10 text-white">No options data available for the selected criteria.</div>;
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* フィルターと選択コントロール */}
      <div className="mb-8 space-y-5 w-full">
        <div className="flex justify-between items-center w-full">
          {/* Option type (Call/Put) selector */}
          <OptionTypeSelector
            className="w-full"
            selectedType={selectedOptionType}
            onChange={setSelectedOptionType}
          />

          {/* 暗号資産セレクター */}
          <div className="w-full bg-funoption-card-bg rounded-xl p-3 backdrop-blur-sm flex justify-center">
            <CryptoSelector
              selectedCrypto={selectedCrypto}
              cryptoPrices={cryptoPrices}
              onChange={setSelectedCrypto}
              loading={cryptoDataLoading}
            />
          </div>
        </div>
        {/* Expiry date selector */}
        <ExpiryDateSelector
          expirations={expirations}
          selectedExpiry={selectedExpiry}
          onChange={setSelectedExpiry}
          className="border-b border-funoption-border pb-4"
          showAllOption={true}
        />
      </div>

      {recommendedPicks.length === 0 && !loading && (
        <div className="text-center p-8 text-gray-400 bg-funoption-card-bg rounded-xl backdrop-blur-sm">
          No recommended options found for {selectedExpiry === 'all' ? 'any expiry' : selectedExpiry} based on current criteria.
        </div>
      )}

      {/* オプションカードリスト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendedPicks.map(option => (
          <OptionCard
            key={option.symbol}
            option={option}
            underlyingPrice={currentPrice ?? null}
            onPurchaseClick={onPurchaseClick}
          />
        ))}
      </div>
    </div>
  );
};

export default AIRecommendedOptionsList;
