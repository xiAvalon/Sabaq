import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/icons.jsx';
import Lobby from '../components/online/Lobby.jsx';
import OnlineGame from '../components/online/OnlineGame.jsx';
import OnlineResults from '../components/online/OnlineResults.jsx';
import { EmptyState, PageHeader, Spinner } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useOnline } from '../hooks/useOnline.js';
import { isOnlineConfigured } from '../online/client.js';
import { cleanCode } from '../online/modes.js';
import { useRoom } from '../online/useRoom.js';
import { OnlineUnavailable } from './OnlineScreen.jsx';

function Room({ code }) {
  const { profile } = useSettings();
  const identity = useMemo(() => ({ name: profile.name, color: profile.color }), [profile.name, profile.color]);
  const room = useRoom(code, identity);
  const online = useOnline();
  const navigate = useNavigate();
  const left = room.me && room.me.left_at;

  useEffect(() => {
    if (left) navigate('/online', { replace: true });
  }, [left, navigate]);

  if (room.status === 'error') {
    return (
      <div className="screen narrow">
        <PageHeader title={`الغرفة ${code}`} back="/online" />
        <EmptyState icon="close" title={room.error?.message ?? 'تعذّر دخول الغرفة.'}>
          تأكد من الرمز، أو اطلب من صديقك رابط الدعوة من جديد.
        </EmptyState>
        <div className="results__actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            حاول مجددًا
          </button>
          <Link to="/online" className="btn btn--ghost">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  if (room.status !== 'ready' || !room.room) {
    return (
      <div className="screen narrow center-stack">
        <Spinner />
        <p className="muted">جارٍ دخول الغرفة {code}…</p>
      </div>
    );
  }

  const { session } = room;
  const playing = room.room.status === 'playing' && session && session.status === 'running';
  const finished = room.room.status === 'finished';

  return (
    <div className="screen room">
      {!online ? (
        <p className="notice notice--bad" role="status">
          <Icon name="wifi-off" size={16} /> انقطع الاتصال بالإنترنت. ستعود إلى المباراة تلقائيًا عند عودته.
        </p>
      ) : (
        room.degraded && (
          <p className="notice" role="status">
            <Icon name="refresh" size={16} /> الاتصال المباشر غير متاح الآن، لذا نحدّث الغرفة كل ثانيتين.
          </p>
        )
      )}
      {room.error && room.status === 'ready' && (
        <p className="notice notice--bad" role="alert">
          <Icon name="close" size={16} /> {room.error.message}
          <button type="button" className="chip" onClick={room.actions.clearError} style={{ marginInlineStart: 'auto' }}>
            إخفاء
          </button>
        </p>
      )}
      {playing ? (
        <OnlineGame session={session} room={room.room} players={room.players} me={room.me} answers={room.answers} online={room.online} serverNow={room.serverNow} actions={room.actions} />
      ) : finished ? (
        <OnlineResults players={room.players} me={room.me} answers={room.answers} actions={room.actions} />
      ) : (
        <>
          <PageHeader title="غرفة الانتظار" subtitle="شارك الرمز مع أصحابك. يبدأ المضيف عندما يكون الجميع جاهزًا." back="/online" />
          <Lobby room={room.room} players={room.players} me={room.me} online={room.online} actions={room.actions} />
        </>
      )}
    </div>
  );
}

export default function RoomScreen() {
  const params = useParams();
  const code = cleanCode(params.code);
  if (!isOnlineConfigured) {
    return (
      <div className="screen narrow">
        <PageHeader title="العب أونلاين" />
        <OnlineUnavailable />
      </div>
    );
  }
  return <Room key={code} code={code} />;
}
