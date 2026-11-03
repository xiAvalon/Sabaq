// Joins a room by code and keeps a live copy of its state. The server owns the game; this hook
// re-reads state on every realtime change, keeps a clock offset, sends heartbeats, and nudges the
// server to advance once a deadline passes (any client may do this; it is idempotent).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './api.js';

const HEARTBEAT_MS = 15000;

export function useRoom(code, identity) {
  const [state, setState] = useState({ status: 'idle', error: null, room: null, players: [], session: null, answers: [], online: new Set(), connected: false, degraded: false });
  const [userId, setUserId] = useState(null);
  const offset = useRef(0);
  const roomIdRef = useRef(null);
  const refreshTimer = useRef(null);

  const refresh = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (!roomId) return;
    try {
      const next = await api.fetchRoomState(roomId);
      setState((s) => ({ ...s, ...next, status: 'ready', error: null }));
    } catch (e) {
      setState((s) => ({ ...s, error: e }));
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(refresh, 80);
  }, [refresh]);

  // Join (or rejoin after refresh) and subscribe.
  useEffect(() => {
    if (!code || !identity?.name) return undefined;
    let unsubscribe = () => {};
    let cancelled = false;
    setState((s) => ({ ...s, status: 'joining', error: null }));
    (async () => {
      try {
        const uid = await api.ensureSession();
        if (cancelled) return;
        setUserId(uid);
        const joined = await api.joinRoom(code, identity.name, identity.color);
        if (cancelled) return;
        roomIdRef.current = joined.room_id;
        offset.current = await api.measureOffset().catch(() => 0);
        await refresh();
        unsubscribe = api.subscribeRoom(joined.room_id, uid, {
          onChange: scheduleRefresh,
          onPresence: (online) => setState((s) => ({ ...s, online })),
          onStatus: (status) => {
            setState((s) => ({ ...s, connected: status === 'SUBSCRIBED', degraded: status === 'SUBSCRIBED' ? false : s.degraded }));
            if (status === 'SUBSCRIBED') scheduleRefresh();
          },
        });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, status: 'error', error: e }));
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [code, identity?.name, identity?.color, refresh, scheduleRefresh]);

  // Heartbeat keeps "connected" accurate and lets the room recover from a vanished host.
  useEffect(() => {
    if (state.status !== 'ready') return undefined;
    const beat = () => roomIdRef.current && api.heartbeat(roomIdRef.current).catch(() => {});
    beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [state.status]);

  // Only report a problem if the live connection has been down for a while.
  useEffect(() => {
    if (state.status !== 'ready' || state.connected) return undefined;
    const id = window.setTimeout(() => setState((s) => ({ ...s, degraded: !s.connected })), 5000);
    return () => window.clearTimeout(id);
  }, [state.status, state.connected]);

  // Safety net: poll quickly if the realtime socket is down, slowly otherwise.
  useEffect(() => {
    if (state.status !== 'ready') return undefined;
    const id = window.setInterval(refresh, state.connected ? 10000 : 2000);
    return () => window.clearInterval(id);
  }, [state.status, state.connected, refresh]);

  // Coming back online or to the tab: re-read state.
  useEffect(() => {
    const wake = () => document.visibilityState === 'visible' && refresh();
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [refresh]);

  // Advance the session when its deadline passes (with a little grace for late answers).
  const session = state.session;
  useEffect(() => {
    if (!session || session.status !== 'running' || !session.deadline) return undefined;
    const grace = session.phase === 'question' || session.phase === 'steal' ? 1700 : 300;
    const jitter = Math.random() * 400;
    const wait = new Date(session.deadline).getTime() - (Date.now() + offset.current) + grace + jitter;
    const id = window.setTimeout(() => {
      api.advanceSession(session.id).then(refresh).catch(() => refresh());
    }, Math.max(0, wait));
    return () => window.clearTimeout(id);
  }, [session?.id, session?.status, session?.phase, session?.deadline, session?.turn, session?.round, refresh, session]);

  const me = useMemo(() => state.players.find((p) => p.user_id === userId) ?? null, [state.players, userId]);
  const serverNow = useCallback(() => Date.now() + offset.current, []);

  const run = useCallback(
    (fn) =>
      async (...args) => {
        try {
          const out = await fn(roomIdRef.current, ...args);
          scheduleRefresh();
          return out;
        } catch (e) {
          setState((s) => ({ ...s, error: e }));
          scheduleRefresh();
          throw e;
        }
      },
    [scheduleRefresh],
  );

  const actions = useMemo(
    () => ({
      setReady: run(api.setReady),
      updateSettings: run(api.updateSettings),
      start: run(api.startGame),
      reset: run(api.resetRoom),
      leave: run(api.leaveRoom),
      submit: async (qIndex, answer) => {
        const out = await api.submitAnswer(state.session.id, qIndex, answer);
        scheduleRefresh();
        return out;
      },
      clearError: () => setState((s) => ({ ...s, error: null })),
      refresh,
    }),
    [run, refresh, scheduleRefresh, state.session?.id],
  );

  return { ...state, me, userId, serverNow, actions };
}
