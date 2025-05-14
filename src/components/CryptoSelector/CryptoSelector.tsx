import React from 'react';

// 暗号資産選択器のプロパティ定義
export interface CryptoSelectorProps {
  selectedCrypto: 'BTC' | 'ETH' | 'SOL';
  cryptoPrices: {
    BTC: number;
    ETH: number;
    SOL: number;
  };
  onChange: (crypto: 'BTC' | 'ETH' | 'SOL') => void;
  loading?: boolean;
  compact?: boolean; // コンパクト表示モードのオプション
  className?: string; // 追加のCSSクラス
  variant?: 'default' | 'light' | 'dark'; // デザインバリエーション
}

/**
 * 暗号資産選択コンポーネント
 * BTC、ETH、SOL間の切り替えボタンを表示
 */
const CryptoSelector: React.FC<CryptoSelectorProps> = ({ 
  selectedCrypto, 
  cryptoPrices, 
  onChange,
  loading = false,
  compact = false,
  className = '',
  variant = 'default'
}) => {
  // バリエーションに基づくスタイルの設定
  const containerStyle = {
    default: 'flex gap-2 md:gap-3 justify-center items-center',
    light: 'flex gap-2 md:gap-3 justify-center items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-lg',
    dark: 'flex gap-2 md:gap-3 justify-center items-center bg-funoption-card-bg backdrop-blur-sm rounded-lg p-2'
  }[variant];

  // ボタンのベーススタイル
  const baseButtonStyle = {
    default: 'px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed',
    light: 'px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
    dark: 'px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium text-gray-300 hover:bg-funoption-card-bg-hover disabled:opacity-50 disabled:cursor-not-allowed'
  }[variant];

  // アクティブなボタンのスタイル
  const activeButtonStyle = {
    default: 'bg-funoption-gold text-black font-semibold',
    light: 'bg-yellow-500 text-white font-semibold',
    dark: 'bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to text-white font-semibold'
  }[variant];

  return (
    <div className={`${containerStyle} ${className}`}>
      <button
        className={`${baseButtonStyle} ${selectedCrypto === 'BTC' ? activeButtonStyle : ''}`}
        onClick={() => onChange('BTC')}
        disabled={loading}
      >
        {compact ? 'BTC' : `BTC (${formatCryptoPrice(cryptoPrices.BTC)})`}
      </button>
      <button
        className={`${baseButtonStyle} ${selectedCrypto === 'ETH' ? activeButtonStyle : ''}`}
        onClick={() => onChange('ETH')}
        disabled={loading}
      >
        {compact ? 'ETH' : `ETH (${formatCryptoPrice(cryptoPrices.ETH)})`}
      </button>
      <button
        className={`${baseButtonStyle} ${selectedCrypto === 'SOL' ? activeButtonStyle : ''}`}
        onClick={() => onChange('SOL')}
        disabled={loading}
      >
        {compact ? 'SOL' : `SOL (${formatCryptoPrice(cryptoPrices.SOL)})`}
      </button>
    </div>
  );
};

// 暗号資産の価格をフォーマットするヘルパー関数
const formatCryptoPrice = (price: number): string => {
  if (isNaN(price) || price === 0) return '$0';
  
  // 自動的に適切な桁数で表示
  if (price >= 1000) {
    return `$${price.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
  } else if (price >= 100) {
    return `$${price.toLocaleString(undefined, {maximumFractionDigits: 1})}`;
  } else if (price >= 1) {
    return `$${price.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
  } else {
    return `$${price.toLocaleString(undefined, {maximumFractionDigits: 4})}`;
  }
};

export default CryptoSelector;
