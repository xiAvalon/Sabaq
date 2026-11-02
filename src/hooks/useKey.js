import { useEffect, useRef } from 'react';

/** Calls handler(event) for the given keys while `enabled`. Ignores typing in inputs unless allowInputs. */
export function useKey(keys, handler, { enabled = true, allowInputs = false } = {}) {
  const ref = useRef(handler);
  ref.current = handler;
  const signature = Array.isArray(keys) ? keys.join('|') : keys;
  useEffect(() => {
    if (!enabled) return undefined;
    const list = signature.split('|');
    const onKey = (e) => {
      if (!list.includes(e.key) || e.repeat) return;
      const tag = e.target?.tagName;
      if (!allowInputs && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signature, enabled, allowInputs]);
}
