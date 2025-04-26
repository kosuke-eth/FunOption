import React, { useState, useEffect } from 'react';
import OptionsChart from '../OptionsChart/OptionsChart';
import { OptionData } from '../../mockData/optionsMock';
import { useOptionsData } from '../../providers/OptionsDataProvider';
import './OptionsVisualization.css';
import { ChartStyles } from '../OptionsChart/colorUtils';

// 日付をフォーマットするヘルパー関数
const formatExpiryDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0].substring(2)}`;
    }
    return dateStr;
  } catch (err) {
    console.error('日付のフォーマットエラー:', dateStr);
    return dateStr || 'Invalid Date';
  }
};

const OptionsVisualization: React.FC = () => {
  const {
    callOptions,
    putOptions,
    expirations,
    currentPrice,
    selectedExpiry,
    setSelectedExpiry,
    isLoading,
    error,
    refreshData
  } = useOptionsData();

  const [activeTab, setActiveTab] = useState<'call' | 'put'>('call');
  const [filteredOptions, setFilteredOptions] = useState<OptionData[]>([]);

  // 初期化時に最初の満期日を選択
  useEffect(() => {
    if (expirations.length > 0 && !selectedExpiry) {
      setSelectedExpiry(expirations[0]);
    }
  }, [expirations, selectedExpiry, setSelectedExpiry]);

  // フィルタリングロジック
  useEffect(() => {
    const optionsData = activeTab === 'call' ? callOptions : putOptions;

    // 満期でフィルタリング
    let filtered = selectedExpiry === 'all'
      ? optionsData
      : optionsData.filter(opt => opt.expiry === selectedExpiry);

    setFilteredOptions(filtered);
  }, [activeTab, selectedExpiry, callOptions, putOptions]);

  // オプション選択ハンドラー
  const handleOptionSelect = (option: OptionData) => {
    console.log('Selected option:', option);
    // ここにBeybitのDeep-Linkへの実際のリダイレクトロジックを実装
    // window.open(`https://www.bybit.com/trade/usdc-option/...`, '_blank');
  };

  return (
    <div className="options-visualization-container">

      {/* Tab Switching */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'call' ? 'active' : ''}`}
          onClick={() => setActiveTab('call')}
          style={activeTab === 'call' ? { backgroundColor: ChartStyles.colors.call, color: '#fff' } : {}}
        >
          Call Options
        </button>
        <button
          className={`tab ${activeTab === 'put' ? 'active' : ''}`}
          onClick={() => setActiveTab('put')}
          style={activeTab === 'put' ? { backgroundColor: ChartStyles.colors.put, color: '#fff' } : {}}
        >
          Put Options
        </button>
      </div>

      {/* Date Selection Buttons */}
      <div className="date-selector">
        <button
          className={`date-button ${selectedExpiry === "all" ? "active" : ""}`}
          onClick={() => setSelectedExpiry("all")}
          disabled={isLoading}
        >
          All
        </button>

        {expirations && expirations.length > 0 ? expirations.map((exp, index) => {
          // 満期日データのnullチェック
          if (!exp) return null;

          // 安全に日付をフォーマット
          const formattedDate = formatExpiryDate(exp);

          return (
            <button
              key={index} // expの代わりにindexを使用
              className={`date-button ${selectedExpiry === exp ? "active" : ""}`}
              onClick={() => setSelectedExpiry(exp)}
              disabled={isLoading}
            >
              {formattedDate}
            </button>
          );
        }) : <span className="no-data-message">満期日データ読込中...</span>}
      </div>

      {/* Options Chart */}
      <div className="chart-container">
        {filteredOptions && filteredOptions.length > 0 ? (
          <OptionsChart
            data={filteredOptions}
            currentPrice={currentPrice}
            width={800}
            height={500}
            onOptionSelect={handleOptionSelect}
          />
        ) : (
          <div className="no-data-container">
            <p>表示するデータがありません。別の満期日を選択してください。</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default OptionsVisualization;
