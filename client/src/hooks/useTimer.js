import { useCallback, useEffect, useRef, useState } from 'react';

// 60-second countdown. Stops at 0. freeze() stops it and keeps the current value.
const START_SECONDS = 60;

export default function useTimer() {
  const [seconds, setSeconds] = useState(START_SECONDS);
  const [frozen, setFrozen] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
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
