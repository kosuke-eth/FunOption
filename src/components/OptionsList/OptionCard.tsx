import React, { useMemo } from 'react';
import { OptionData } from 'providers/OptionsDataProvider';

interface OptionCardProps {
  option: OptionData;
  underlyingPrice: number | null;
  aiDescription?: string;
  onPurchaseClick: (option: OptionData) => void;
}

const OptionCard: React.FC<OptionCardProps> = ({
  option,
  underlyingPrice,
  aiDescription = 'AI analysis suggests this option has potential based on current market conditions and technical indicators.',
  onPurchaseClick,
}) => {
  // メモ化された計算で不要な再計算を防止
  const {
    assetName,
    markPriceNum,
    displayEstReturn,
    displayRiskLevel,
    formattedMarkPrice,
    estReturnColor,
    riskLevelColor
  } = useMemo(() => {
    // 安全なパース処理
    const assetName = option.symbol?.split('-')[0] || 'BTC';
    
    // 型安全性のある数値変換
    const markPriceNum = typeof option.markPrice === 'string' 
      ? parseFloat(option.markPrice) 
      : typeof option.markPrice === 'number'
        ? option.markPrice
        : NaN;
    
    // デルタの安全な取得
    const delta = typeof option.delta === 'string'
      ? parseFloat(option.delta)
      : typeof option.delta === 'number'
        ? option.delta
        : null;

    // 価格フォーマット
    const formattedMarkPrice = !isNaN(markPriceNum) 
      ? markPriceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : 'N/A';

    // 予想リターン計算
    let displayEstReturn: string;
    let estReturnColor: string;
    
    if (underlyingPrice !== null && delta !== null && !isNaN(markPriceNum) && markPriceNum > 0) {
      const hypotheticalPriceChange = underlyingPrice * 0.01; // 1% 仮想価格変動
      const estimatedOptionPriceChange = delta * hypotheticalPriceChange;
      const estimatedReturnPercent = (estimatedOptionPriceChange / markPriceNum) * 100;
      displayEstReturn = `${estimatedReturnPercent >= 0 ? '+' : ''}${estimatedReturnPercent.toFixed(1)}%`;
      estReturnColor = estimatedReturnPercent >= 0 ? 'text-funoption-success' : 'text-funoption-danger';
    } else {
      displayEstReturn = 'N/A';
      estReturnColor = 'text-gray-400';
    }

    // リスクレベル判定
    let displayRiskLevel: 'Low' | 'Medium' | 'High';
    let riskLevelColor: string;
    
    if (delta !== null) {
      const absDelta = Math.abs(delta);
      if (absDelta < 0.3) {
        displayRiskLevel = 'High';
        riskLevelColor = 'text-funoption-danger';
      } else if (absDelta < 0.7) {
        displayRiskLevel = 'Medium';
        riskLevelColor = 'text-yellow-500';
      } else {
        displayRiskLevel = 'Low';
        riskLevelColor = 'text-funoption-success';
      }
    } else {
      displayRiskLevel = 'Medium';
      riskLevelColor = 'text-yellow-500';
    }
    
    return {
      assetName,
      markPriceNum,
      displayEstReturn,
      displayRiskLevel,
      formattedMarkPrice,
      estReturnColor,
      riskLevelColor
    };
  }, [option, underlyingPrice]); // 依存配列を明示的に指定

  return (
    <div className="bg-gradient-to-b from-funoption-bg to-funoption-bg-dark rounded-2xl shadow-xl p-5 border border-white/5 font-grotesk hover:shadow-2xl transition-all duration-300 animate-fadeIn">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-xl shadow-md ${option.type === 'call' ? 'bg-funoption-success text-white' : 'bg-funoption-danger text-white'}`}>
            {option.type.toUpperCase()}
          </span>
          <h2 className="text-xl font-bold mt-2 text-white">
            {assetName} ${typeof option.strike === 'number' ? option.strike.toLocaleString() : option.strike}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Expiry: {option.expiry}</div>
          {underlyingPrice && (
            <div className="text-xs text-gray-400">Current {assetName} Price: ${underlyingPrice.toLocaleString()}</div>
          )}
          <div className="mt-2 px-3 py-1 bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to text-white text-xs font-medium rounded-xl shadow-md">
            AI Recommended
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        {aiDescription}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-funoption-card-bg rounded-xl p-3 backdrop-blur-sm transition-all duration-200 hover:bg-funoption-card-bg-hover">
          <div className="text-xs text-gray-400 mb-1">Premium</div>
          <div className="text-lg font-bold text-white">
            ${formattedMarkPrice}
          </div>
        </div>
        <div className="bg-funoption-card-bg rounded-xl p-3 backdrop-blur-sm transition-all duration-200 hover:bg-funoption-card-bg-hover">
          <div className="text-xs text-gray-400 mb-1">Est. Return</div>
          <div className={`text-lg font-bold ${estReturnColor}`}>
            {displayEstReturn}
          </div>
        </div>
        <div className="bg-funoption-card-bg rounded-xl p-3 backdrop-blur-sm transition-all duration-200 hover:bg-funoption-card-bg-hover">
          <div className="text-xs text-gray-400 mb-1">Risk Level</div>
          <div className={`text-lg font-bold ${riskLevelColor}`}>
            {displayRiskLevel}
          </div>
        </div>
      </div>

      <button
        className="w-full bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to hover:from-funoption-primary-from/90 hover:to-funoption-primary-to/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-funoption-primary-from/50 flex items-center justify-center gap-2"
        onClick={() => onPurchaseClick(option)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        Purchase
      </button>
    </div>
  );
};

export default OptionCard;
