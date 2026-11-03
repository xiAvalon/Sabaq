import { getCategory } from '../data/categories.js';
import { DIFFICULTIES } from '../engine/config.js';
import { Icon } from './icons.jsx';

export default function CategoryBoard({ game, onPick }) {
  const { seg, players } = game;
  const player = players[seg.turnPlayer];
  const left = seg.totalPicks - seg.picksMade;
  return (
    <section className="board-wrap" style={{ '--player': player.color }}>
      <div className="board-caption">
        <h2>
          دور <span className="player-name">{player.name}</span>: اختر سؤالًا
        </h2>
        <p>
          {left === 1 ? 'بقي اختيار واحد في اللوحة' : `بقي ${left} اختيارات في اللوحة`}
        </p>
      </div>
      <div className="board" style={{ '--cols': seg.categories.length }}>
        {seg.categories.map((catId) => {
          const cat = getCategory(catId);
          return (
            <div className="board__col" key={catId} style={{ '--cat': cat.color }}>
              <div className="board__head">
                <Icon name={cat.icon} size={24} />
                <span className="board__name">{cat.name}</span>
              </div>
              {[1, 2, 3].map((d) => {
                const cell = seg.cells.find((c) => c.id === `${catId}-${d}`);
                const winner = cell.wonBy !== null ? players[cell.wonBy] : null;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    className={`cell${cell.used ? ' is-used' : ''}${winner ? ' is-won' : ''}`}
                    style={winner ? { '--won': winner.color } : undefined}
                    disabled={cell.used}
                    onClick={() => onPick(cell.id)}
                    aria-label={`${cat.name}، ${DIFFICULTIES[d].label}، ${cell.value} نقطة${cell.used ? '، مستخدم' : ''}`}
                  >
                    {cell.used ? (winner ? <span className="cell__won">{winner.name}</span> : <span className="cell__miss">✕</span>) : cell.value}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
