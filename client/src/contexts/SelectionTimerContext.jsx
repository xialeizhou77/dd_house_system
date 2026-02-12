import { createContext, useContext, useEffect, useRef, useState } from 'react';

// 全局选房倒计时：固定 3 分钟
const TOTAL_MS = 3 * 60 * 1000;

const SelectionTimerContext = createContext(null);

export function SelectionTimerProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | running | locked | finished
  const [deadline, setDeadline] = useState(null);
  const [remainingMs, setRemainingMs] = useState(TOTAL_MS);
  const timerRef = useRef(null);

  // 启动 3 分钟倒计时
  function startTimer() {
    const now = Date.now();
    const end = now + TOTAL_MS;
    setDeadline(end);
    setRemainingMs(end - now);
    setStatus('running');
  }

  // 结束倒计时（确认选房后调用）
  function finishTimer() {
    setStatus('finished');
    setDeadline(null);
    setRemainingMs(TOTAL_MS);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // 重置为初始状态（如重新开始一轮前调用）
  function resetTimer() {
    setStatus('idle');
    setDeadline(null);
    setRemainingMs(TOTAL_MS);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    if (status !== 'running' || !deadline) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const left = deadline - now;
      if (left <= 0) {
        setRemainingMs(0);
        setStatus('locked');
        clearInterval(timerRef.current);
        timerRef.current = null;
      } else {
        setRemainingMs(left);
      }
    }, 200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, deadline]);

  const progress = status === 'running' || status === 'locked'
    ? Math.min(100, Math.max(0, ((TOTAL_MS - remainingMs) / TOTAL_MS) * 100))
    : 0;

  const value = {
    status,
    remainingMs,
    progress,
    totalMs: TOTAL_MS,
    isLocked: status === 'locked',
    isRunning: status === 'running',
    startTimer,
    finishTimer,
    resetTimer,
  };

  return (
    <SelectionTimerContext.Provider value={value}>
      {children}
    </SelectionTimerContext.Provider>
  );
}

export function useSelectionTimer() {
  const ctx = useContext(SelectionTimerContext);
  if (!ctx) {
    throw new Error('useSelectionTimer must be used within SelectionTimerProvider');
  }
  return ctx;
}

