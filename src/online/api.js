// Thin wrappers around the Supabase RPCs in supabase/migrations. All game rules run on the server.
import { supabase } from './client.js';

const MESSAGES = {
  room_not_found: 'لا توجد غرفة بهذا الرمز. تأكد من الرمز وحاول مجددًا.',
  room_expired: 'انتهت صلاحية هذه الغرفة. اطلب من صديقك إنشاء غرفة جديدة.',
  room_full: 'الغرفة ممتلئة.',
  game_started: 'بدأت المباراة في هذه الغرفة، ولا يمكن الانضمام إليها الآن.',
  not_in_room: 'لم تعد عضوًا في هذه الغرفة.',
  host_only: 'هذا الإجراء لمنشئ الغرفة فقط.',
  need_two_players: 'تحتاج المباراة إلى لاعبَين على الأقل.',
  players_not_ready: 'لم يضغط كل اللاعبين «جاهز» بعد.',
  name_required: 'اكتب اسمك أولًا.',
  not_signed_in: 'تعذّر بدء جلسة الضيف.',
  too_late: 'انتهى الوقت.',
  too_early: 'لم يبدأ السؤال بعد.',
  not_your_turn: 'ليس دورك الآن.',
  already_answered: 'أرسلت إجابتك بالفعل.',
  stale_question: 'تحدّث السؤال، حاول مرة أخرى.',
  session_not_found: 'المباراة غير موجودة.',
  game_over: 'انتهت المباراة.',
};

export class OnlineError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function toError(error) {
  const raw = error?.message ?? String(error);
  const code = Object.keys(MESSAGES).find((k) => raw.includes(k));
  if (code) return new OnlineError(code, MESSAGES[code]);
  if (/anonymous/i.test(raw)) return new OnlineError('anon_disabled', 'الدخول كضيف غير مفعّل في إعدادات Supabase.');
  if (/fetch|network|Failed to/i.test(raw)) return new OnlineError('network', 'تعذّر الاتصال بالخادم. تحقق من الإنترنت.');
  return new OnlineError('unknown', 'حدث خطأ غير متوقع. حاول مرة أخرى.');
}

async function call(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw toError(error);
  return data;
}

export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw toError(error);
  return signed.user.id;
}

export const createRoom = (name, color, settings) => call('create_room', { p_name: name, p_color: color, p_settings: settings });
export const joinRoom = (code, name, color) => call('join_room', { p_code: code, p_name: name, p_color: color });
export const leaveRoom = (roomId) => call('leave_room', { p_room: roomId });
export const setReady = (roomId, ready) => call('set_ready', { p_room: roomId, p_ready: ready });
export const updateSettings = (roomId, settings) => call('update_settings', { p_room: roomId, p_settings: settings });
export const startGame = (roomId) => call('start_game', { p_room: roomId });
export const resetRoom = (roomId) => call('reset_room', { p_room: roomId });
export const heartbeat = (roomId) => call('heartbeat', { p_room: roomId });
export const submitAnswer = (sessionId, qIndex, answer) => call('submit_answer', { p_session: sessionId, p_q_index: qIndex, p_answer: answer });
export const advanceSession = (sessionId) => call('advance_session', { p_session: sessionId });

/** Server clock offset in ms (server − local), measured around one round trip. */
export async function measureOffset() {
  const t0 = Date.now();
  const server = await call('server_time', {});
  const t1 = Date.now();
  return new Date(server).getTime() - (t0 + t1) / 2;
}

export async function fetchRoomState(roomId) {
  const [room, players, session] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).maybeSingle(),
    supabase.from('room_players').select('*').eq('room_id', roomId).order('joined_at'),
    supabase.from('game_sessions').select('*').eq('room_id', roomId).order('started_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  for (const r of [room, players, session]) if (r.error) throw toError(r.error);
  let answers = [];
  if (session.data) {
    const res = await supabase.from('answers').select('*').eq('session_id', session.data.id).order('id');
    if (res.error) throw toError(res.error);
    answers = res.data;
  }
  return { room: room.data, players: players.data, session: session.data, answers };
}

/** Realtime: any change to the room, its players or its session triggers onChange. Presence tracks who is connected. */
export function subscribeRoom(roomId, userId, { onChange, onPresence, onStatus }) {
  const channel = supabase.channel(`room:${roomId}`, { config: { presence: { key: userId } } });
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `room_id=eq.${roomId}` }, onChange)
    .on('presence', { event: 'sync' }, () => onPresence(new Set(Object.keys(channel.presenceState()))))
    .subscribe(async (status) => {
      onStatus?.(status);
      if (status === 'SUBSCRIBED') await channel.track({ at: Date.now() });
    });
  return () => supabase.removeChannel(channel);
}
