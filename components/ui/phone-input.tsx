"use client";

import React, { forwardRef, useState } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, className, ...props }, ref) => {
    const formatPhoneNumber = (input: string) => {
      // Remove all non-digit characters
      const digits = input.replace(/\D/g, '');
      
      // Limit to 8 digits (1 + 7)
      const limitedDigits = digits.slice(0, 8);
      
      if (limitedDigits.length === 0) return '';
      if (limitedDigits.length <= 1) return `(${limitedDigits}`;
      if (limitedDigits.length <= 4) return `(${limitedDigits[0]}) ${limitedDigits.slice(1)}`;
      return `(${limitedDigits[0]}) ${limitedDigits.slice(1, 4)}-${limitedDigits.slice(4)}`;
    };

    // Format the initial value
    const displayValue = formatPhoneNumber(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      
      onChange?.(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true)) {
        return;
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="(7) 123-4567"
        maxLength={13}
        className={className}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput }; 