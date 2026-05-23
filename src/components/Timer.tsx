import { useEffect } from 'react';
import { playTimerTick } from '../utils/audio';

interface TimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  isActive: boolean;
}

export const Timer = ({
  secondsRemaining,
  totalSeconds,
  isActive,
}: TimerProps) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.1
  const offset = circumference - (secondsRemaining / totalSeconds) * circumference;
  
  const isWarning = secondsRemaining <= 3 && secondsRemaining > 0;

  // Sound ticking during countdown
  useEffect(() => {
    if (isActive && isWarning) {
      playTimerTick();
    }
  }, [secondsRemaining, isActive, isWarning]);

  return (
    <div className="timer-container" aria-label={`Time remaining: ${secondsRemaining} seconds`}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Background circle */}
        <circle
          className="timer-circle-bg"
          cx="22"
          cy="22"
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className={`timer-circle-progress ${isWarning ? 'timer-warning' : ''}`}
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      {/* Remaining seconds text */}
      <span className="timer-text">{secondsRemaining}</span>
    </div>
  );
};
