import { useEffect, useRef, useState } from 'react';

export const useThrottle = <T>(value: T, interval: number): T => {
  const [throttled, setThrottled] = useState(value);
  const lastRan = useRef<number>(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const remaining = interval - (now - lastRan.current);

    if (remaining <= 0) {
      lastRan.current = now;
      setThrottled(value);
      return () => undefined;
    }

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      lastRan.current = Date.now();
      setThrottled(value);
    }, remaining);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [interval, value]);

  return throttled;
};
