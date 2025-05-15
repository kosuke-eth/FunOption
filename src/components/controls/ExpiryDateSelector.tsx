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
    <div className={`flex flex-nowrap gap-2 overflow-x-auto ${className}`}>
      {showAllOption && (
        <button
          onClick={() => onChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
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
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
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
