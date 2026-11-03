import { Icon } from '../icons.jsx';
import { Avatar } from '../ui.jsx';
import { PLAYER_COLORS } from '../../engine/config.js';

export const isConnected = (player, online) =>
  online.has(player.user_id) || Date.now() - new Date(player.last_seen).getTime() < 40000;

export default function PlayerList({ players, me, online, showReady = true, showScore = false }) {
  const active = players.filter((p) => !p.left_at);
  const sorted = showScore ? [...active].sort((a, b) => b.score - a.score) : active;
  return (
    <ul className="roster">
      {sorted.map((p) => {
        const connected = isConnected(p, online);
        return (
          <li key={p.id} className={`roster__item${p.id === me?.id ? ' is-me' : ''}`} style={{ '--player': PLAYER_COLORS[p.color % PLAYER_COLORS.length] }}>
            <span className="roster__avatar">
              <Avatar name={p.display_name} color={p.color} size={38} />
              <span className={`roster__dot${connected ? ' is-on' : ''}`} title={connected ? 'متصل' : 'غير متصل'} />
            </span>
            <span className="roster__name">
              {p.display_name}
              {p.id === me?.id && <span className="roster__me"> (أنت)</span>}
            </span>
            {p.is_host && (
              <span className="tag tag--gold">
                <Icon name="crown" size={12} /> المضيف
              </span>
            )}
            {showReady && !p.is_host && (p.is_ready ? <span className="tag tag--cyan">جاهز</span> : <span className="tag tag--muted">ينتظر</span>)}
            {!connected && <span className="tag tag--bad">انقطع</span>}
            {showScore && <span className="roster__score num-ltr">{p.score}</span>}
          </li>
        );
      })}
    </ul>
  );
}
