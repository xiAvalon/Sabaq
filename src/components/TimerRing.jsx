const R = 34;
const C = 2 * Math.PI * R;

/** The Sabaq countdown dial, used everywhere a timer appears. */
export default function TimerRing({ msLeft, totalMs, paused = false, label = 'الوقت المتبقي', size = 'md' }) {
  const fraction = totalMs ? Math.max(0, Math.min(1, msLeft / totalMs)) : 0;
  const seconds = Math.ceil(msLeft / 1000);
  const urgent = !paused && msLeft > 0 && msLeft <= 5000;
  const warn = !paused && msLeft > 5000 && fraction <= 0.34;
  return (
    <div
      className={`timer timer--${size}${urgent ? ' is-urgent' : ''}${warn ? ' is-warn' : ''}${paused ? ' is-paused' : ''}`}
      role="timer"
      aria-label={`${label}: ${seconds} ثانية`}
    >
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={R} className="timer__track" />
        <circle cx="40" cy="40" r={R} className="timer__bar" strokeDasharray={C} strokeDashoffset={C * (1 - fraction)} transform="rotate(-90 40 40)" />
      </svg>
      <span className="timer__num">{seconds}</span>
    </div>
  );
}
