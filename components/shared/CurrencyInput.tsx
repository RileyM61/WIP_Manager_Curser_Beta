import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  id: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  disabled?: boolean;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const parseInput = (input: string): number => {
  const numericString = input.replace(/[^0-9.-]/g, '');
  const number = parseFloat(numericString);
  return isNaN(number) ? 0 : number;
};

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  id, 
  name, 
  value, 
  onChange, 
  disabled = false,
  className = "mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-right dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
}) => {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));

  useEffect(() => {
    // Update display value if the underlying model value changes, but not while typing.
    if (parseInput(displayValue) !== value) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    // Show raw number for easy editing. Show empty string for 0 to speed up new entry.
    setDisplayValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    const numericValue = parseInput(displayValue);
    // Only notify parent if the value has actually changed
    if (numericValue !== value) {
      onChange(name, numericValue);
    }
    // Always format the display on blur
    setDisplayValue(formatCurrency(numericValue));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  return (
    <input
      type="text"
      id={id}
      name={name}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      inputMode="decimal"
      autoComplete="off"
    />
  );
};

export { CurrencyInput, formatCurrency, parseInput };
export default CurrencyInput;

