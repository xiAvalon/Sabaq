import { Link } from 'react-router-dom';
import { Icon } from './icons.jsx';

export function Availability({ mode }) {
  return (
    <span className="avail">
      <span className="avail__item is-on">
        <Icon name="offline" size={14} /> أوفلاين
      </span>
      <span className={`avail__item${mode.online ? ' is-on' : ''}`}>
        <Icon name="online" size={14} /> {mode.online ? 'أونلاين' : 'أوفلاين فقط'}
      </span>
    </span>
  );
}

export default function ModeCard({ mode, to, onSelect, selected = false }) {
  const body = (
    <>
      <span className="mode-card__top">
        <span className="mode-card__icon">
          <Icon name={mode.icon} size={26} />
        </span>
        {mode.signature && <span className="tag tag--gold">التحدي الأشهر</span>}
      </span>
      <span className="mode-card__name">{mode.name}</span>
      <span className="mode-card__tagline">{mode.tagline}</span>
      <ul className="mode-card__how">
        {mode.howItPlays.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <span className="mode-card__foot">
        <Availability mode={mode} />
        <span className="mode-card__players">
          <Icon name="users" size={14} /> {mode.players.min === mode.players.max ? 'لاعبان أو فريقان' : `${mode.players.min}–${mode.players.max} لاعبين`}
        </span>
      </span>
    </>
  );
  const cls = `mode-card mode-card--${mode.id}${mode.signature ? ' is-signature' : ''}${selected ? ' is-selected' : ''}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onSelect} aria-pressed={selected}>
      {body}
    </button>
  );
}
