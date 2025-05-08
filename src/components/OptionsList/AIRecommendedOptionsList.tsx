import React, { useState } from 'react';
import { OptionData, useOptions } from 'providers/OptionsDataProvider';
import OptionCard from './OptionCard';
import { ChartStyles } from '../OptionsChart/colorUtils';

// Helper function to determine if an option has poor Risk/Reward
const isPoorRR = (option: OptionData, currentPrice: number): boolean => {
  if (option.delta === null) return true; // Cannot calculate if delta is missing

  const markPriceNum = option.markPrice !== null ? parseFloat(option.markPrice) : NaN;
  if (isNaN(markPriceNum)) return true; // Cannot calculate if markPrice is not a valid number

  const intrinsic = option.type === 'call'
    ? Math.max(0, currentPrice - option.strike)
    : Math.max(0, option.strike - currentPrice);
  const timeValue = Math.max(0, markPriceNum - intrinsic);
  const timeValPct = (timeValue / (markPriceNum === 0 ? 1 : markPriceNum)) * 100; // Avoid division by zero
  const rrRaw = (Math.abs(option.delta * 100) - timeValPct);
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

  const baseOptions = selectedOptionType === 'call' ? callOptions : putOptions;

  const filteredByExpiry = selectedExpiry === 'all'
    ? baseOptions
    : baseOptions.filter(option => option.expiry === selectedExpiry);

  let chartConditionOptions: OptionData[] = [];
  if (currentPrice !== null) {
    chartConditionOptions = filteredByExpiry
      .filter(option => {
        return Math.abs(option.strike - currentPrice) / currentPrice < 0.2;
      })
      .filter(option => {
        return !isPoorRR(option, currentPrice);
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
    <div className="ai-recommended-options">
      {/* Option Type (Call/Put) Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedOptionType('call')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors text-white ${selectedOptionType !== 'call' ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          style={selectedOptionType === 'call' ? { backgroundColor: ChartStyles.colors.call } : {}}
        >
          Call Options
        </button>
        <button
          onClick={() => setSelectedOptionType('put')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors text-white ${selectedOptionType !== 'put' ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          style={selectedOptionType === 'put' ? { backgroundColor: ChartStyles.colors.put } : {}}
        >
          Put Options
        </button>
      </div>

      {/* Expiry Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-700 pb-3">
        <button
          onClick={() => setSelectedExpiry('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${selectedExpiry === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          All
        </button>
        {expirations.map(exp => (
          <button
            key={exp}
            onClick={() => setSelectedExpiry(exp)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${selectedExpiry === exp ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {exp.substring(5)}
          </button>
        ))}
      </div>

      {recommendedPicks.length === 0 && !loading && (
        <div className="text-center p-10 text-white">No recommended options found for {selectedExpiry === 'all' ? 'any expiry' : selectedExpiry} based on current criteria.</div>
      )}

      {/* Option Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendedPicks.map(option => (
          <OptionCard
            key={option.symbol}
            option={option}
            underlyingPrice={currentPrice}
            onPurchaseClick={onPurchaseClick}
          />
        ))}
      </div>
    </div>
  );
};

export default AIRecommendedOptionsList;
