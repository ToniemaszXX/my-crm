import { useRef } from 'react';

export function usePreventDoubleSubmit() {
  const isSubmittingRef = useRef(false);

  function wrap(submitFn) {
    return async (...args) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      try {
        await submitFn(...args);
      } finally {
        isSubmittingRef.current = false;
      }
    };
  }

  return wrap;
}
