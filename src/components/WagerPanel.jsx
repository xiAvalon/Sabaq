import { useState } from 'react';
import { maxWager } from '../engine/gameReducer.js';
import { CategoryTag } from './ui.jsx';

const roundTo = (n, step) => Math.round(n / step) * step;

export default function WagerPanel({ game, onWager }) {
  const { seg, players } = game;
  const player = players[seg.order[seg.pos]];
  const max = maxWager(player);
  const step = max >= 1000 ? 50 : 10;
  const [amount, setAmount] = useState(roundTo(max / 2, step));
  const quick = [
    { label: 'لا شيء', value: 0 },
    { label: 'الربع', value: roundTo(max / 4, step) },
    { label: 'النصف', value: roundTo(max / 2, step) },
    { label: 'الكل', value: max },
  ];
  return (
    <section className="decision" style={{ '--player': player.color }}>
      <p className="decision__eyebrow">
        الرهان الأخير · <CategoryTag id={seg.categoryId} />
      </p>
      <h2 className="decision__title">{player.name}، كم تراهن؟</h2>
      <p className="wager__score">نقاطك: {player.score}</p>
      <output className="wager__amount" htmlFor="wager-range">
        {amount}
      </output>
      <input
        id="wager-range"
        className="wager__range"
        type="range"
        min={0}
        max={max}
        step={step}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        aria-label="قيمة الرهان"
        dir="ltr"
      />
      <div className="wager__quick">
        {quick.map((q) => (
          <button key={q.label} type="button" className={`chip${amount === q.value ? ' is-active' : ''}`} onClick={() => setAmount(q.value)}>
            {q.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn--primary btn--lg" onClick={() => onWager(amount)}>
        ثبّت الرهان واعرض السؤال
      </button>
    </section>
  );
}
