import { useMemo } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { DIFFICULTY_CHOICES } from '../../engine/config.js';
import { getOnlineMode, ONLINE_MODES } from '../../online/modes.js';
import CategoryPicker from '../CategoryPicker.jsx';
import { Icon } from '../icons.jsx';
import { CategoryTag, Segmented, Stepper } from '../ui.jsx';
import InviteCard from './InviteCard.jsx';
import PlayerList from './PlayerList.jsx';

export default function Lobby({ room, players, me, online, actions }) {
  const { bank } = useGame();
  const s = room.settings;
  const mode = getOnlineMode(s.mode);
  const isHost = me?.is_host;
  const active = players.filter((p) => !p.left_at);
  const waiting = active.filter((p) => !p.is_host && !p.is_ready);
  const canStart = isHost && active.length >= 2 && waiting.length === 0;
  const startHint = active.length < 2 ? 'ادعُ لاعبًا واحدًا على الأقل للبدء.' : waiting.length ? `بانتظار: ${waiting.map((p) => p.display_name).join('، ')}` : 'الجميع جاهز.';
  const change = (patch) => actions.updateSettings({ ...s, ...patch }).catch(() => {});
  const diffLabel = useMemo(() => DIFFICULTY_CHOICES.find((d) => String(d.id) === String(s.difficulty))?.label ?? 'متدرّج', [s.difficulty]);

  return (
    <div className="lobby">
      <div className="lobby__grid">
        <InviteCard code={room.code} />
        <section className="card">
          <div className="card__head">
            <h2>اللاعبون</h2>
            <span className="card__hint">
              {active.length} من {room.max_players}
            </span>
          </div>
          <PlayerList players={players} me={me} online={online} />
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <h2>إعدادات المباراة</h2>
          {!isHost && <span className="card__hint">يختارها المضيف</span>}
        </div>
        {isHost ? (
          <>
            <div className="online-modes">
              {ONLINE_MODES.map((m) => (
                <button key={m.id} type="button" className={`online-mode${m.id === s.mode ? ' is-selected' : ''}`} onClick={() => change({ mode: m.id, rounds: m.id === 'rush' ? 3 : 4 })} aria-pressed={m.id === s.mode}>
                  <Icon name={m.icon} size={24} />
                  <span className="online-mode__name">{m.name}</span>
                  <span className="online-mode__desc">{m.tagline}</span>
                </button>
              ))}
            </div>
            <div className="fields">
              <div className="field">
                <span className="field__label">{s.mode === 'rush' ? 'عدد الجولات' : 'عدد الأدوار لكل لاعب'}</span>
                <Stepper id="online-rounds" label="الجولات" value={s.rounds} min={mode.roundsRange.min} max={mode.roundsRange.max} onChange={(v) => change({ rounds: v })} />
              </div>
              {s.mode === 'rush' ? (
                <div className="field">
                  <span className="field__label">مدة الجولة</span>
                  <Segmented id="online-duration" label="مدة الجولة" value={s.duration} onChange={(v) => change({ duration: v })} options={[30, 45, 60].map((v) => ({ value: v, label: `${v} ث` }))} />
                </div>
              ) : (
                <div className="field">
                  <span className="field__label">وقت كل سؤال</span>
                  <Segmented id="online-qtime" label="وقت كل سؤال" value={s.question_time} onChange={(v) => change({ question_time: v })} options={[10, 15, 20, 30].map((v) => ({ value: v, label: `${v} ث` }))} />
                </div>
              )}
              <div className="field">
                <span className="field__label">الصعوبة</span>
                <Segmented
                  id="online-difficulty"
                  label="الصعوبة"
                  value={String(s.difficulty)}
                  onChange={(v) => change({ difficulty: v })}
                  options={DIFFICULTY_CHOICES.map((d) => ({ value: String(d.id), label: d.label }))}
                />
              </div>
            </div>
            <CategoryPicker value={s.categories} onChange={(categories) => categories.length && change({ categories })} bank={bank} />
          </>
        ) : (
          <div className="settings-summary">
            <p>
              <Icon name={mode.icon} size={18} /> <strong>{mode.name}</strong> · {s.rounds} {s.mode === 'rush' ? 'جولات' : 'أدوار لكل لاعب'} ·{' '}
              {s.mode === 'rush' ? `${s.duration} ثانية للجولة` : `${s.question_time} ثانية للسؤال`} · {diffLabel}
            </p>
            <div className="settings-summary__cats">
              {s.categories.map((c) => (
                <CategoryTag key={c} id={c} size="sm" />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="lobby__footer">
        <button type="button" className="btn btn--ghost" onClick={() => actions.leave().catch(() => {})}>
          <Icon name="leave" size={18} /> مغادرة الغرفة
        </button>
        {isHost ? (
          <div className="lobby__start">
            <span className="card__hint">{startHint}</span>
            <button type="button" className="btn btn--gold btn--lg" disabled={!canStart} onClick={() => actions.start().catch(() => {})}>
              <Icon name="play" size={18} /> ابدأ المباراة
            </button>
          </div>
        ) : (
          <button type="button" className={`btn btn--lg ${me?.is_ready ? 'btn--ghost' : 'btn--primary'}`} onClick={() => actions.setReady(!me?.is_ready).catch(() => {})}>
            {me?.is_ready ? (
              <>
                <Icon name="check" size={18} /> جاهز (اضغط للإلغاء)
              </>
            ) : (
              'أنا جاهز'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
