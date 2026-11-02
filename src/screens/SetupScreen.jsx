import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Segmented, Stepper } from '../components/ui.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CATEGORIES, CATEGORY_IDS } from '../data/categories.js';
import { CLOCK_CHOICES, DIFFICULTY_CHOICES, POWERUP_COUNT_CHOICES, QUESTION_TIME_CHOICES } from '../engine/config.js';
import { getMode, MODES } from '../engine/modes.js';
import { defaultName, draftErrors, draftToConfig, draftToMemory, fitNames, makeDraft, randomizeDraft, ROUNDS_RANGE } from '../engine/setup.js';
import { countByCategory } from '../services/questionRepository.js';
import { loadLastSetup, saveLastSetup } from '../services/storage.js';
import { sound } from '../services/sound.js';

const timeLabel = (t) => (t === 'auto' ? 'تلقائي' : `${t} ث`);

function SetupForm({ modeId }) {
  const mode = getMode(modeId);
  const { bank, startGame } = useGame();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => makeDraft(modeId, { settings, last: loadLastSetup(), categoryIds: CATEGORY_IDS }));
  const counts = useMemo(() => (bank ? countByCategory(bank) : {}), [bank]);
  const errors = draftErrors(draft);
  // Remember choices as they change, so switching modes keeps names and categories.
  useEffect(() => saveLastSetup(draftToMemory(draft, loadLastSetup())), [draft]);
  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const { min: catMin, max: catMax } = mode.categoryRange;

  const setCount = (n) =>
    setDraft((d) => ({ ...d, playerCount: n, names: fitNames(d.names, Math.max(n, d.names.length), d.playerMode) }));

  const setPlayerMode = (playerMode) =>
    setDraft((d) => ({
      ...d,
      playerMode,
      names: d.names.map((name, i) => (name === defaultName(d.playerMode, i) ? defaultName(playerMode, i) : name)),
    }));

  const toggleCategory = (id) =>
    setDraft((d) => {
      if (d.categories.includes(id)) return { ...d, categories: d.categories.filter((c) => c !== id) };
      if (catMax && d.categories.length >= catMax) return d;
      return { ...d, categories: [...d.categories, id] };
    });

  const start = () => {
    if (errors.length || !bank) return;
    sound.unlock();
    sound.play('click');
    saveLastSetup(draftToMemory(draft, loadLastSetup()));
    if (startGame(modeId, draftToConfig(draft))) navigate('/play');
  };

  const has = (opt) => mode.options.includes(opt);
  const rounds = ROUNDS_RANGE[modeId];
  const unit = draft.playerMode === 'teams' ? 'فرق' : 'لاعبين';

  return (
    <div className="setup">
      <PageHeader title="إعداد اللعبة">
        <div className="mode-tabs" role="tablist" aria-label="نمط اللعب">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === modeId}
              className={`mode-tab${m.id === modeId ? ' is-active' : ''}`}
              onClick={() => navigate(`/setup/${m.id}`, { replace: true })}
            >
              <span aria-hidden="true">{m.glyph}</span> {m.name}
            </button>
          ))}
        </div>
        <p className="setup__tagline">{mode.tagline}</p>
      </PageHeader>

      <section className="panel">
        <div className="panel__head">
          <h2>المشاركون</h2>
          <Segmented
            id="player-mode"
            label="لاعبون أم فرق"
            value={draft.playerMode}
            onChange={setPlayerMode}
            options={[
              { value: 'players', label: 'لاعبون' },
              { value: 'teams', label: 'فرق' },
            ]}
          />
        </div>
        {mode.players.min !== mode.players.max && (
          <div className="field">
            <span className="field__label">عدد ال{unit}</span>
            <Stepper id="player-count" value={draft.playerCount} min={mode.players.min} max={mode.players.max} onChange={setCount} label={`عدد ال${unit}`} />
          </div>
        )}
        <div className="names">
          {Array.from({ length: draft.playerCount }, (_, i) => (
            <label key={i} className="name-field" htmlFor={`player-${i}`}>
              <span className="name-field__index">{i + 1}</span>
              <input
                id={`player-${i}`}
                type="text"
                maxLength={18}
                value={draft.names[i] ?? ''}
                placeholder={defaultName(draft.playerMode, i)}
                onChange={(e) => {
                  const names = [...draft.names];
                  names[i] = e.target.value;
                  patch({ names });
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>الفئات</h2>
          <span className="panel__hint">
            {catMax ? `اختر من ${catMin} إلى ${catMax}` : 'اختر فئة أو أكثر'} · المختار {draft.categories.length}
          </span>
        </div>
        <div className="cat-actions">
          {!catMax && (
            <button type="button" className="chip" onClick={() => patch({ categories: [...CATEGORY_IDS] })}>
              الكل
            </button>
          )}
          <button type="button" className="chip" onClick={() => patch({ categories: [] })}>
            مسح
          </button>
          <button type="button" className="chip" onClick={() => patch({ categories: randomizeDraft(draft, CATEGORY_IDS).categories })}>
            اختيار عشوائي
          </button>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const on = draft.categories.includes(c.id);
            const blocked = !on && catMax && draft.categories.length >= catMax;
            return (
              <button
                key={c.id}
                type="button"
                className={`cat-option${on ? ' is-on' : ''}`}
                style={{ '--cat': c.color }}
                aria-pressed={on}
                disabled={blocked}
                onClick={() => toggleCategory(c.id)}
              >
                <span className="cat-option__glyph" aria-hidden="true">
                  {c.glyph}
                </span>
                <span className="cat-option__name">{c.name}</span>
                <span className="cat-option__count">{counts[c.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>قواعد الجولة</h2>
        </div>
        <div className="fields">
          {has('difficulty') && (
            <div className="field">
              <span className="field__label">الصعوبة</span>
              <Segmented id="difficulty" label="الصعوبة" value={draft.difficulty} onChange={(v) => patch({ difficulty: v })} options={DIFFICULTY_CHOICES.map((d) => ({ value: d.id, label: d.label }))} />
            </div>
          )}
          {has('clockSeconds') && (
            <div className="field">
              <span className="field__label">مدة العداد لكل لاعب</span>
              <Segmented id="clock" label="مدة العداد" value={draft.clockSeconds} onChange={(v) => patch({ clockSeconds: v })} options={CLOCK_CHOICES.map((s) => ({ value: s, label: `${s} ث` }))} />
            </div>
          )}
          {has('questionTime') && (
            <div className="field">
              <span className="field__label">وقت كل سؤال</span>
              <Segmented id="question-time" label="وقت السؤال" value={draft.questionTime} onChange={(v) => patch({ questionTime: v })} options={QUESTION_TIME_CHOICES.map((t) => ({ value: t, label: timeLabel(t) }))} />
            </div>
          )}
          {has('rounds') && rounds && (
            <div className="field">
              <span className="field__label">{mode.roundsLabel}</span>
              <Stepper id="rounds" label={mode.roundsLabel} value={draft.rounds} min={rounds.min} max={rounds.max} onChange={(v) => patch({ rounds: v })} />
            </div>
          )}
          <div className="field">
            <span className="field__label">وسائل المساعدة (لكل وسيلة)</span>
            <Segmented id="powerups" label="عدد وسائل المساعدة" value={draft.powerups} onChange={(v) => patch({ powerups: v })} options={POWERUP_COUNT_CHOICES.map((n) => ({ value: n, label: n === 0 ? 'بدون' : `${n}` }))} />
          </div>
        </div>
      </section>

      <div className="setup__footer">
        {errors.length > 0 && (
          <ul className="setup__errors" role="alert">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div className="setup__buttons">
          <button type="button" className="btn btn--ghost" onClick={() => setDraft(randomizeDraft(draft, CATEGORY_IDS))}>
            إعدادات عشوائية
          </button>
          <button type="button" className="btn btn--primary btn--lg" onClick={start} disabled={errors.length > 0 || !bank}>
            ابدأ اللعب
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetupScreen() {
  const { modeId } = useParams();
  if (!getMode(modeId)) return <Navigate to="/" replace />;
  return <SetupForm key={modeId} modeId={modeId} />;
}
