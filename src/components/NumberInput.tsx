"use client";

import { useState, useEffect, ChangeEvent } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string | number;
  defaultValue?: number; // Value to use when empty & loses focus
  allowDecimals?: boolean;
  className?: string;
  placeholder?: string;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  defaultValue = 0,
  allowDecimals = true,
  className = "",
  placeholder = "",
  onBlur,
  disabled = false,
  readOnly = false,
}: NumberInputProps) {
  // Use empty string when value is 0 to allow for complete deletion
  const [inputValue, setInputValue] = useState<string>(
    value === 0 ? "" : value.toString()
  );

  // Update internal state when external value changes
  useEffect(() => {
    // Only update if the value is different to avoid cursor jumping
    if (value === 0 && inputValue === "") {
      return; // Don't update if both represent "empty"
    }

    if (value.toString() !== inputValue) {
      setInputValue(value === 0 ? "" : value.toString());
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If empty, set to 0 temporarily in the data model
    if (newValue === "") {
      onChange(0);
      return;
    }

    // Parse the value based on whether decimals are allowed
    const parsedValue = allowDecimals
      ? parseFloat(newValue)
      : parseInt(newValue);

    // Only update if it's a valid number
    if (!isNaN(parsedValue)) {
      // Apply min/max constraints if specified
      let constrainedValue = parsedValue;
      if (max !== undefined) constrainedValue = Math.min(constrainedValue, max);

      // Don't apply min constraint during editing - will be applied on blur
      onChange(constrainedValue);
    }
  };

  const handleBlur = () => {
    // Apply minimum value constraint when field loses focus
    let finalValue = value;

    if (value === 0 && inputValue === "") {
      finalValue = defaultValue;
    }

    if (min !== undefined && finalValue < min) {
      finalValue = min;
      // Update the display value
      setInputValue(finalValue.toString());
    }

    // Update the model with the final value
    onChange(finalValue);

    // Call custom onBlur if provided
    if (onBlur) onBlur();
  };

  return (
    <input
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      step={step}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}
