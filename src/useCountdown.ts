import { useEffect, useRef, useState, useCallback } from 'react';

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export function useCountdown(totalSec: number, onDone?: () => void) {
  const [remaining, setRemaining] = useState(totalSec);
  const [state, setState] = useState<TimerState>('idle');
  const intervalRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const setOnDone = useCallback((fn: (() => void) | undefined) => {
    onDoneRef.current = fn;
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setState('done');
        onDoneRef.current?.();
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setState('running');
    intervalRef.current = window.setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState('paused');
  }, []);

  const reset = useCallback(
    (newTotal?: number) => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRemaining(newTotal ?? totalSec);
      setState('idle');
    },
    [totalSec],
  );

  const skip = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState('done');
    onDoneRef.current?.();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  return { remaining, state, start, pause, reset, skip, setOnDone };
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
