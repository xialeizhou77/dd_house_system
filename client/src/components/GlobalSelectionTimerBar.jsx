import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectionTimer } from '../contexts/SelectionTimerContext';
import './GlobalSelectionTimerBar.css';

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** 轻震动：前2分钟每30秒、最后一分钟每15秒 */
function vibrateLight() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(100);
  }
}

/** 强提醒：最后10秒每2秒 */
function vibrateStrong() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([150, 80, 150, 80, 200]);
  }
}

export default function GlobalSelectionTimerBar() {
  const navigate = useNavigate();
  const { status, remainingMs, progress, isLocked, resetTimer } = useSelectionTimer();
  const prevRemainingRef = useRef(remainingMs);

  useEffect(() => {
    if (status !== 'running') return;
    const prev = prevRemainingRef.current;
    prevRemainingRef.current = remainingMs;

    const crossed = (threshold) => prev > threshold && remainingMs <= threshold;

    // 主页面区域震动（通过 body class 作用于 .home-main）
    const triggerShake = (type) => {
      const cls = type === 'strong' ? 'timer-shake-main-strong' : 'timer-shake-main-light';
      document.body.classList.add(cls);
      setTimeout(() => document.body.classList.remove(cls), type === 'strong' ? 600 : 500);
    };

    // 前2分钟每30秒：150s, 120s, 90s, 60s
    if (crossed(150000) || crossed(120000) || crossed(90000) || crossed(60000)) {
      vibrateLight();
      triggerShake('light');
    }
    // 最后一分钟每15秒：45s, 30s, 15s
    else if (crossed(45000) || crossed(30000) || crossed(15000)) {
      vibrateLight();
      triggerShake('light');
    }
    // 最后10秒每2秒强提醒：10s, 8s, 6s, 4s, 2s
    else if (crossed(10000) || crossed(8000) || crossed(6000) || crossed(4000) || crossed(2000)) {
      vibrateStrong();
      triggerShake('strong');
    }
  }, [status, remainingMs]);

  useEffect(() => () => {
    document.body.classList.remove('timer-shake-main-light', 'timer-shake-main-strong');
  }, []);

  if (status === 'idle' || status === 'finished') {
    return null;
  }

  const timeText = isLocked ? '00:00' : formatTime(remainingMs);
  const isUrgent = !isLocked && remainingMs > 0 && remainingMs <= 30000; /* 最后 30 秒 */

  return (
    <>
      <div className={`global-timer-bar ${isLocked ? 'locked' : ''} ${isUrgent ? 'urgent' : ''}`}>
        <div className="global-timer-label">
          选房倒计时：
          <span className="global-timer-time">{timeText}</span>
        </div>
        <div className="global-timer-progress">
          <div
            className="global-timer-progress-inner"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isLocked && (
          <div className="global-timer-status-text">
            已超时，页面已锁定，请工作人员处理
          </div>
        )}
      </div>

      {isLocked && (
        <div className="global-timer-lock-overlay">
          <div className="global-timer-lock-message">
            <div className="lock-title">选房时间已结束</div>
            <div className="lock-subtitle">本轮选房倒计时已到，请工作人员按流程处理。</div>
            <button
              type="button"
              className="global-timer-lock-btn"
              onClick={() => {
                resetTimer();
                navigate('/house-selection');
              }}
            >
              返回【智能选房】主页
            </button>
          </div>
        </div>
      )}
    </>
  );
}

