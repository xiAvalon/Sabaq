import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createGame, gameReducer } from '../engine/gameReducer.js';
import { loadQuestions } from '../services/questionRepository.js';

const GameContext = createContext(null);

function rootReducer(state, action) {
  if (action.type === 'NEW') return action.game;
  if (action.type === 'CLEAR') return null;
  return gameReducer(state, action);
}

export function GameProvider({ children }) {
  const [bank, setBank] = useState(null);
  const [game, rawDispatch] = useReducer(rootReducer, null);

  useEffect(() => {
    let alive = true;
    loadQuestions().then((questions) => alive && setBank(questions));
    return () => {
      alive = false;
    };
  }, []);

  // Time and randomness are captured once here, so the reducer stays pure.
  const dispatch = useCallback((action) => rawDispatch({ now: Date.now(), seed: Math.random(), ...action }), []);

  const startGame = useCallback(
    (modeId, config) => {
      if (!bank) return false;
      rawDispatch({ type: 'NEW', game: createGame({ modeId, config, bank, now: Date.now(), seed: Math.random() }) });
      return true;
    },
    [bank],
  );

  const endGame = useCallback(() => rawDispatch({ type: 'CLEAR' }), []);

  const value = useMemo(() => ({ bank, game, dispatch, startGame, endGame }), [bank, game, dispatch, startGame, endGame]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
