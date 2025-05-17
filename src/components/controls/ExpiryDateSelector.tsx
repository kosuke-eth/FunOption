import React from 'react';

interface ExpiryDateSelectorProps {
  expirations: string[];
  selectedExpiry: string;
  onChange: (expiry: string) => void;
  className?: string;
  showAllOption?: boolean;
}

const ExpiryDateSelector: React.FC<ExpiryDateSelectorProps> = ({
  expirations,
  selectedExpiry,
  onChange,
  className = '',
  showAllOption = true,
}) => {
  return (
    <div className={`flex flex-nowrap gap-1.5 sm:gap-2 pb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${className}`}>
      {showAllOption && (
        <button
          onClick={() => onChange('all')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap flex-shrink-0 transition-all duration-200
            ${selectedExpiry === 'all'
              ? 'bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to text-white shadow-md'
              : 'bg-funoption-card-bg text-gray-300 hover:bg-funoption-card-bg-hover'}`}
        >
          All
        </button>
      )}
      
      {expirations.map(exp => (
        <button
          key={exp}
          onClick={() => onChange(exp)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap flex-shrink-0 transition-all duration-200
            ${selectedExpiry === exp
              ? 'bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to text-white shadow-md'
              : 'bg-funoption-card-bg text-gray-300 hover:bg-funoption-card-bg-hover'}`}
        >
          {exp.substring(5)} {/* Display only mm-dd format */}
        </button>
      ))}
    </div>
  );
};

export default ExpiryDateSelector;
