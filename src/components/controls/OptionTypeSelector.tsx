import React from 'react';

export type OptionType = 'call' | 'put';

export type OptionTypeVariant = 'default' | 'chart';

interface OptionTypeSelectorProps {
  selectedType: OptionType;
  onChange: (type: OptionType) => void;
  className?: string;
  variant?: OptionTypeVariant;
  customCallStyle?: string;
  customPutStyle?: string;
  containerStyle?: string;
}

const OptionTypeSelector: React.FC<OptionTypeSelectorProps> = ({
  selectedType,
  onChange,
  className = '',
  variant = 'default',
  customCallStyle,
  customPutStyle,
  containerStyle,
}) => {
  // Select button styles based on the style variant
  const getCallButtonStyle = () => {
    if (customCallStyle) return customCallStyle;

    if (variant === 'chart') {
      return selectedType === 'call'
        ? 'bg-funoption-chart-call text-white shadow'
        : 'text-funoption-text-muted hover:text-white';
    }

    return selectedType === 'call'
      ? 'bg-funoption-success text-white shadow-lg shadow-funoption-success/20'
      : 'bg-funoption-card-bg text-gray-300 hover:bg-funoption-card-bg-hover';
  };

  const getPutButtonStyle = () => {
    if (customPutStyle) return customPutStyle;

    if (variant === 'chart') {
      return selectedType === 'put'
        ? 'bg-funoption-chart-put text-white shadow'
        : 'text-funoption-text-muted hover:text-white';
    }

    return selectedType === 'put'
      ? 'bg-funoption-danger text-white shadow-lg shadow-funoption-danger/20'
      : 'bg-funoption-card-bg text-gray-300 hover:bg-funoption-card-bg-hover';
  };

  // Set container style based on the variant
  const getContainerStyle = () => {
    if (containerStyle) return containerStyle;

    if (variant === 'chart') {
      return 'flex p-1 rounded-xl bg-funoption-bg shadow-inner';
    }

    return 'flex flex-wrap gap-3';
  };

  return (
    <div className={`${getContainerStyle()} ${className}`}>
      <button
        onClick={() => onChange('call')}
        className={`px-4 py-2.5 text-sm font-medium ${variant === 'chart' ? 'rounded-lg' : 'rounded-xl'} transition-all duration-200 ${getCallButtonStyle()}`}
      >
        Call Options
      </button>
      <button
        onClick={() => onChange('put')}
        className={`px-4 py-2.5 text-sm font-medium ${variant === 'chart' ? 'rounded-lg' : 'rounded-xl'} transition-all duration-200 ${getPutButtonStyle()}`}
      >
        Put Options
      </button>
    </div>
  );
};

export default OptionTypeSelector;
