import { useEffect, useState } from 'react';

/** Milliseconds left until `deadline`. Ticks only while `running`; the interval is cleared on change. */
export function useCountdown(deadline, running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running || !deadline) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [deadline, running]);
  return deadline ? Math.max(0, deadline - now) : 0;
}
