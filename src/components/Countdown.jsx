import { useEffect, useState } from 'react';
import { sound } from '../services/sound.js';

/** 3-2-1 overlay shown before a timed run starts. Calls onDone once. */
export default function Countdown({ onDone }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    sound.play('tick');
    if (n === 0) {
      const id = window.setTimeout(onDone, 450);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setN((v) => v - 1), 700);
    return () => window.clearTimeout(id);
  }, [n, onDone]);
  return (
    <div className="countdown" role="status" aria-live="assertive">
      <span key={n} className="countdown__num">
        {n === 0 ? 'انطلق!' : n}
      </span>
    </div>
  );
}
