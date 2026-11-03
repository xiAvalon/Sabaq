import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CategoryPicker from '../components/CategoryPicker.jsx';
import { Icon } from '../components/icons.jsx';
import { Availability } from '../components/ModeCard.jsx';
import { Avatar, PageHeader, Segmented, Stepper } from '../components/ui.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CATEGORY_IDS } from '../data/categories.js';
import { CLOCK_CHOICES, DIFFICULTY_CHOICES, PLAYER_COLORS, POWERUP_COUNT_CHOICES, QUESTION_TIME_CHOICES } from '../engine/config.js';
import { getMode } from '../engine/modes.js';
import { defaultName, draftErrors, draftToConfig, draftToMemory, fitNames, makeDraft, randomizeDraft, ROUNDS_RANGE } from '../engine/setup.js';
import { loadLastSetup, saveLastSetup } from '../services/storage.js';
import { sound } from '../services/sound.js';

const timeLabel = (t) => (t === 'auto' ? 'تلقائي' : `${t} ث`);
const STEPS = [
  { id: 'players', label: 'اللاعبون' },
  { id: 'categories', label: 'الفئات' },
  { id: 'rules', label: 'القواعد' },
];

function SetupWizard({ modeId }) {
  const mode = getMode(modeId);
  const { bank, startGame } = useGame();
  const { settings, profile } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => {
    const d = makeDraft(modeId, { settings, last: loadLastSetup(), categoryIds: CATEGORY_IDS });
    // Player 1 defaults to the profile name, so stats and achievements follow the owner.
    if (!d.names[0] || d.names[0] === defaultName(d.playerMode, 0)) d.names[0] = profile.name;
    return d;
  });
  const errors = draftErrors(draft);
  const categoryErrors = errors.filter((e) => e.includes('فئ'));
  const nameErrors = errors.filter((e) => !e.includes('فئ'));
  useEffect(() => saveLastSetup(draftToMemory(draft, loadLastSetup())), [draft]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const setCount = (n) => setDraft((d) => ({ ...d, playerCount: n, names: fitNames(d.names, Math.max(n, d.names.length), d.playerMode) }));
  const setPlayerMode = (playerMode) =>
    setDraft((d) => ({
      ...d,
      playerMode,
      names: d.names.map((name, i) => (name === defaultName(d.playerMode, i) ? defaultName(playerMode, i) : name)),
    }));

  const stepBlocked = (i) => (i === 0 ? nameErrors.length > 0 : i === 1 ? categoryErrors.length > 0 : errors.length > 0);
  const start = () => {
    if (errors.length || !bank) return;
    sound.unlock();
    sound.play('click');
    saveLastSetup(draftToMemory(draft, loadLastSetup()));
    if (startGame(modeId, draftToConfig(draft))) navigate('/play');
  };
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : start());
  const has = (opt) => mode.options.includes(opt);
  const rounds = ROUNDS_RANGE[modeId];
  const unit = draft.playerMode === 'teams' ? 'الفرق' : 'اللاعبين';
  const stepErrors = step === 0 ? nameErrors : step === 1 ? categoryErrors : errors;

  return (
    <div className="wizard screen">
      <PageHeader title={mode.name} subtitle={mode.tagline} back="/offline">
        <Availability mode={mode} />
      </PageHeader>

      <ol className="steps" aria-label="خطوات الإعداد">
        {STEPS.map((s, i) => (
          <li key={s.id} className={`steps__item${i === step ? ' is-current' : ''}${i < step ? ' is-done' : ''}`}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
              <span className="steps__num">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="steps__label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="card" aria-labelledby="players-title">
          <div className="card__head">
            <h2 id="players-title">من سيلعب؟</h2>
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
              <span className="field__label">عدد {unit}</span>
              <Stepper id="player-count" value={draft.playerCount} min={mode.players.min} max={mode.players.max} onChange={setCount} label={`عدد ${unit}`} />
            </div>
          )}
          <div className="players">
            {Array.from({ length: draft.playerCount }, (_, i) => (
              <label key={i} className="player-field" htmlFor={`player-${i}`}>
                <Avatar name={draft.names[i] || defaultName(draft.playerMode, i)} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} size={30} />
                <input
                  id={`player-${i}`}
                  type="text"
                  maxLength={18}
                  value={draft.names[i] ?? ''}
                  placeholder={defaultName(draft.playerMode, i)}
                  aria-label={`اسم ${draft.playerMode === 'teams' ? 'الفريق' : 'اللاعب'} ${i + 1}`}
                  onChange={(e) => {
                    const names = [...draft.names];
                    names[i] = e.target.value;
                    patch({ names });
                  }}
                />
              </label>
            ))}
          </div>
          {draft.playerCount > 1 && <p className="card__hint">ستمرّرون الجهاز بينكم، وتظهر شاشة قصيرة تحدد صاحب الدور قبل كل سؤال.</p>}
        </section>
      )}

      {step === 1 && (
        <section className="card" aria-labelledby="cats-title">
          <div className="card__head">
            <h2 id="cats-title">اختر الفئات</h2>
          </div>
          <CategoryPicker value={draft.categories} onChange={(categories) => patch({ categories })} min={mode.categoryRange.min} max={mode.categoryRange.max} bank={bank} />
        </section>
      )}

      {step === 2 && (
        <section className="card" aria-labelledby="rules-title">
          <div className="card__head">
            <h2 id="rules-title">قواعد اللعبة</h2>
            <button type="button" className="chip" onClick={() => setDraft(randomizeDraft(draft, CATEGORY_IDS))}>
              <Icon name="shuffle" size={16} /> إعدادات عشوائية
            </button>
          </div>
          {has('clockSeconds') && (
            <div className="field">
              <span className="field__label">مدة الجولة لكل لاعب</span>
              <Segmented id="clock" label="مدة الجولة" value={draft.clockSeconds} onChange={(v) => patch({ clockSeconds: v })} options={CLOCK_CHOICES.map((s) => ({ value: s, label: `${s} ث` }))} />
            </div>
          )}
          {has('difficulty') && (
            <div className="field">
              <span className="field__label">الصعوبة</span>
              <Segmented id="difficulty" label="الصعوبة" value={draft.difficulty} onChange={(v) => patch({ difficulty: v })} options={DIFFICULTY_CHOICES.map((d) => ({ value: d.id, label: d.label }))} />
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
            <span className="field__label">وسائل المساعدة لكل لاعب</span>
            <Segmented id="powerups" label="وسائل المساعدة" value={draft.powerups} onChange={(v) => patch({ powerups: v })} options={POWERUP_COUNT_CHOICES.map((n) => ({ value: n, label: n === 0 ? 'بدون' : `${n} من كل نوع` }))} />
          </div>
        </section>
      )}

      {stepErrors.length > 0 && (
        <ul className="errors" role="alert">
          {stepErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="wizard__footer">
        <p className="wizard__summary">
          {draft.playerCount} {draft.playerCount === 1 ? 'لاعب' : unit} · {draft.categories.length} فئة
          {has('clockSeconds') ? ` · ${draft.clockSeconds} ثانية` : ''}
        </p>
        <div className="wizard__buttons">
          {step > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => setStep(step - 1)}>
              السابق
            </button>
          )}
          <button type="button" className={`btn ${step === STEPS.length - 1 ? 'btn--gold btn--lg' : 'btn--primary'}`} onClick={next} disabled={stepBlocked(step) || !bank}>
            {step === STEPS.length - 1 ? 'ابدأ اللعب' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetupScreen() {
  const { modeId } = useParams();
  if (!getMode(modeId)) return <Navigate to="/offline" replace />;
  return <SetupWizard key={modeId} modeId={modeId} />;
}
