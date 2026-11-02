import { DIFFICULTIES } from '../engine/config.js';
import { CategoryTag } from './ui.jsx';

export default function RiskPanel({ game, onChoose }) {
  const { seg, players } = game;
  const cell = seg.cells.find((c) => c.id === seg.pendingCell);
  const player = players[seg.turnPlayer];
  const value = cell.value * (cell.golden ? 2 : 1);
  return (
    <section className="decision" style={{ '--player': player.color }}>
      {cell.golden && <div className="golden-burst">سؤال ذهبي! النقاط مضاعفة</div>}
      <p className="decision__eyebrow">
        <CategoryTag id={cell.categoryId} /> · {DIFFICULTIES[cell.difficulty].label}
      </p>
      <h2 className="decision__title">{player.name}، هل تخاطر؟</h2>
      <div className="decision__options">
        <button type="button" className="decision__card" onClick={() => onChoose(false)}>
          <span className="decision__label">العب بأمان</span>
          <span className="decision__value">+{value}</span>
          <span className="decision__hint">الخطأ لا يخصم شيئًا</span>
        </button>
        <button type="button" className="decision__card decision__card--risk" onClick={() => onChoose(true)}>
          <span className="decision__label">خاطر</span>
          <span className="decision__value">+{value * 2}</span>
          <span className="decision__hint">الخطأ يخصم {cell.value} نقطة</span>
        </button>
      </div>
    </section>
  );
}
