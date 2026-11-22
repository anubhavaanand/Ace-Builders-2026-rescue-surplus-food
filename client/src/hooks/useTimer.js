import { useCallback, useEffect, useRef, useState } from 'react';

// Count-up timer from 0. freeze() stops it and keeps the current value.
export default function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, []);

  const freeze = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setFrozen(true);
  }, []);

  const formatted = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, frozen, freeze, formatted };
}
