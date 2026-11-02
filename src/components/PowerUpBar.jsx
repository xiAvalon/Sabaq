import { POWERUPS, POWERUP_IDS } from '../engine/config.js';
import { canUseFiftyFifty } from '../engine/questionTypes.js';

function unavailable(kind, current) {
  if (current.usedPowerups.includes(kind)) return 'استُخدمت في هذا السؤال';
  if (kind === 'fifty' && (!canUseFiftyFifty(current.question) || current.eliminated.length >= 2)) return 'غير متاحة لهذا النوع من الأسئلة';
  if (kind === 'double' && current.doubled) return 'مفعّلة';
  return null;
}

export default function PowerUpBar({ player, current, onUse, disabled }) {
  return (
    <div className="powerups" aria-label="وسائل المساعدة">
      {POWERUP_IDS.map((kind) => {
        const left = player.powerups[kind];
        const reason = unavailable(kind, current);
        const off = disabled || !left || !!reason;
        const active = kind === 'double' && current.doubled;
        return (
          <button
            key={kind}
            type="button"
            className={`powerup${active ? ' is-active' : ''}`}
            disabled={off}
            onClick={() => onUse(kind)}
            title={reason ?? POWERUPS[kind].hint}
            aria-label={`${POWERUPS[kind].hint}، متبقٍ ${left}`}
          >
            <span className="powerup__label">{POWERUPS[kind].label}</span>
            <span className="powerup__count">{left}</span>
          </button>
        );
      })}
    </div>
  );
}
