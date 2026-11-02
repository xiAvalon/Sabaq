import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import CategoryBoard from '../components/CategoryBoard.jsx';
import GameHud from '../components/GameHud.jsx';
import IntroCard from '../components/IntroCard.jsx';
import QuestionStage from '../components/QuestionStage.jsx';
import RiskPanel from '../components/RiskPanel.jsx';
import WagerPanel from '../components/WagerPanel.jsx';
import { Dialog } from '../components/ui.jsx';
import { sound } from '../services/sound.js';

export default function GameScreen() {
  const { game, dispatch, endGame } = useGame();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    if (!game) navigate('/', { replace: true });
    else if (game.phase === 'finished') navigate('/results', { replace: true });
  }, [game, navigate]);

  if (!game || game.phase === 'finished') return null;

  const act = (action) => {
    sound.unlock();
    dispatch(action);
  };

  let stage = null;
  if (game.phase === 'intro') stage = <IntroCard key={`${game.segIndex}-${game.token}-${game.intro.kind}-${game.intro.playerIdx}`} game={game} onContinue={() => act({ type: 'CONTINUE' })} />;
  else if (game.phase === 'board') stage = <CategoryBoard game={game} onPick={(cellId) => act({ type: 'PICK_CELL', cellId })} />;
  else if (game.phase === 'risk') stage = <RiskPanel game={game} onChoose={(risk) => act({ type: 'CHOOSE_RISK', risk })} />;
  else if (game.phase === 'wager') stage = <WagerPanel key={game.seg.pos} game={game} onWager={(amount) => act({ type: 'SET_WAGER', amount })} />;
  else stage = <QuestionStage game={game} dispatch={dispatch} showExplanations={settings.showExplanations} />;

  return (
    <div className="game">
      <GameHud game={game} onQuit={() => setConfirmQuit(true)} />
      <main className="game__stage">{stage}</main>
      {confirmQuit && (
        <Dialog
          title="إنهاء اللعبة؟"
          onClose={() => setConfirmQuit(false)}
          actions={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmQuit(false)} autoFocus>
                متابعة اللعب
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  endGame();
                  navigate('/');
                }}
              >
                إنهاء دون حفظ
              </button>
            </>
          }
        >
          <p>ستفقد تقدّم هذه اللعبة ولن تُسجّل نتيجتها.</p>
        </Dialog>
      )}
    </div>
  );
}
