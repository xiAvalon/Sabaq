// UI registry: how each question type is drawn. Types without an entry use DefaultBody.
import { SCORING } from '../../engine/config.js';

export function Media({ media }) {
  if (!media) return null;
  if (media.kind === 'emoji') {
    return (
      <div className="q-media q-media--emoji" role="img" aria-label={media.alt ?? 'صورة السؤال'}>
        {media.char}
      </div>
    );
  }
  const src = media.kind === 'svg' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(media.svg)}` : media.src;
  return (
    <div className="q-media">
      <img src={src} alt={media.alt ?? 'صورة السؤال'} />
    </div>
  );
}

function DefaultBody({ question }) {
  return (
    <>
      <Media media={question.media} />
      <p className="q-prompt">{question.prompt}</p>
    </>
  );
}

function CompleteBody({ question }) {
  const [before, after] = question.prompt.split('____');
  return (
    <p className="q-prompt">
      {before}
      <span className="q-blank" aria-label="فراغ">
        ؟
      </span>
      {after}
    </p>
  );
}

function SequenceBody({ question }) {
  return (
    <>
      <p className="q-prompt q-prompt--sm">{question.prompt}</p>
      <ol className="q-sequence">
        {question.sequence.map((item, i) => (
          <li key={i} className="q-sequence__item">
            {item}
          </li>
        ))}
        <li className="q-sequence__item q-sequence__item--next" aria-label="العنصر التالي">
          ؟
        </li>
      </ol>
    </>
  );
}

function WhoAmIBody({ question, current, onRevealClue, interactive }) {
  const shown = question.clues.slice(0, current.cluesShown);
  const more = current.cluesShown < question.clues.length;
  return (
    <>
      <p className="q-prompt q-prompt--sm">{question.prompt}</p>
      <ol className="q-clues">
        {shown.map((clue, i) => (
          <li key={i} className="q-clues__item">
            <span className="q-clues__num">دليل {i + 1}</span>
            {clue}
          </li>
        ))}
      </ol>
      {more && interactive && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRevealClue}>
          دليل إضافي (−{Math.round(SCORING.cluePenalty * 100)}٪ من القيمة)
        </button>
      )}
    </>
  );
}

const BODIES = {
  complete: CompleteBody,
  sequence: SequenceBody,
  whoami: WhoAmIBody,
};

export function QuestionBody(props) {
  const Body = BODIES[props.question.type] ?? DefaultBody;
  return <Body {...props} />;
}
