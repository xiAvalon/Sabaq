import { useEffect, useState } from 'react';

/** Re-renders every `interval` ms and returns now() from the given clock (server-corrected). */
export function useNow(clock = Date.now, interval = 200, active = true) {
  const [now, setNow] = useState(() => clock());
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => setNow(clock()), interval);
    return () => window.clearInterval(id);
  }, [clock, interval, active]);
  return now;
}
