import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialSeconds = 0, onExpire = null) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref up-to-date without re-triggering effects
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      clearInterval(intervalRef.current);
      // Fire the onExpire callback when timer reaches 0
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, secondsLeft]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback((newTime = initialSeconds) => {
    setIsActive(false);
    setSecondsLeft(newTime);
  }, [initialSeconds]);

  return { secondsLeft, isActive, start, pause, reset };
};
