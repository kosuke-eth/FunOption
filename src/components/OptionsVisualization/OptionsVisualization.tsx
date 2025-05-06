import React, { useState, useEffect } from 'react';
import OptionsChart from '../OptionsChart/OptionsChart';
import OptionTradePanel from '../OptionTradePanel';
import { OptionData } from '../../mockData/optionsMock';
import { useOptions } from '../../providers/OptionsDataProvider';
import './OptionsVisualization.css';
import { ChartStyles } from '../OptionsChart/colorUtils';

// 日付をフォーマットするヘルパー関数 (YYYY-MM-DD -> DD-MM-YY)
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
    expirations,
    currentPrice,
    selectedExpiry,
    setSelectedExpiry,
    loading,
    error,
    refreshData
  } = useOptions();

  const [activeTab, setActiveTab] = useState<'call' | 'put'>('call');
  const [filteredOptions, setFilteredOptions] = useState<OptionData[]>([]);
  const [tradePanelVisible, setTradePanelVisible] = useState<boolean>(false);
  const [selectedOptionDetail, setSelectedOptionDetail] = useState<OptionData | null>(null);

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
    setSelectedOptionDetail(option);
    setTradePanelVisible(true);
  };

  if (loading) {
    return <div className="loading-indicator">Loading Options Data...</div>;
  }

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
          disabled={loading}
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
              disabled={loading}
            >
              {formattedDate}
            </button>
          );
        }) : <span className="no-data-message">Loading expiration date data...</span>}
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
            <p>No data to display. Please select a different expiration date.</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-indicator">Loading chart...</div>
      ) : error ? (
        <div className="error-message">Error loading chart data: {error}</div>
      ) : (
        <OptionTradePanel
          option={selectedOptionDetail}
          visible={tradePanelVisible}
          onClose={() => setTradePanelVisible(false)}
        />
      )}
    </div>
  );
};

export default OptionsVisualization;
