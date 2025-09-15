"use client";

import { useState, useEffect } from "react";

/**
 * useDebounce hook
 * Delays updating the debounced value until after the delay has passed since the last change
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay is up
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}