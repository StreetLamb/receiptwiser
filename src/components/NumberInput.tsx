"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string | number;
  defaultValue?: number; // Value to use when empty & loses focus
  allowDecimals?: boolean;
  allowFractions?: boolean; // Allow fraction inputs like 1/2, 1/4, etc.
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
  allowFractions = false,
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

    // Check if the input is a simple fraction (contains '/')
    if (allowFractions && newValue.includes("/")) {
      // Just store the raw input value without evaluation
      // Don't call onChange during fraction typing
      return;
    }

    // Parse the value based on whether decimals are allowed
    const parsedValue = allowDecimals
      ? parseFloat(newValue)
      : parseInt(newValue);

    // Only update if it's a valid number
    if (!isNaN(parsedValue)) {
      // Don't apply any constraints during typing
      // All constraints will be applied on blur
      onChange(parsedValue);
    }
  };

  const handleBlur = () => {
    // Apply all constraints when field loses focus
    let finalValue = value;

    if (value === 0 && inputValue === "") {
      finalValue = defaultValue;
    } else if (allowFractions && inputValue.includes("/")) {
      // Evaluate fractions only on blur
      const parts = inputValue.split("/");
      if (parts.length === 2) {
        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          // Calculate the fraction value
          finalValue = Math.round((numerator / denominator) * 10000) / 10000;
        }
      }
    }

    // Apply min/max constraints
    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }

    // Update the display value with the constrained value
    setInputValue(finalValue.toString());

    // Update the model with the final value
    onChange(finalValue);

    // Call custom onBlur if provided
    if (onBlur) onBlur();
  };

  return (
    <input
      type={allowFractions ? "text" : "number"}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      step={step}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}
