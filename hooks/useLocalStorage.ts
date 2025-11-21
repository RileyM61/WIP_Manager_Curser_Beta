import React, { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const serialized = JSON.stringify(storedValue);
      // Check if data is too large (typical localStorage limit is ~5-10MB)
      const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
      if (sizeInMB > 5) {
        console.warn(`Warning: localStorage data for "${key}" is ${sizeInMB.toFixed(2)}MB, which may exceed browser limits`);
      }
      window.localStorage.setItem(key, serialized);
    } catch (error: any) {
      console.error('Error writing to localStorage', error);
      // If it's a quota error, provide helpful message
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('localStorage quota exceeded. Try reducing image size or clearing other data.');
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
