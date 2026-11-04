import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { inviteLink } from '../../online/modes.js';
import { Icon } from '../icons.jsx';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function InviteCard({ code }) {
  const link = inviteLink(code);
  const [copied, setCopied] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (!showQr || qr) return;
    QRCode.toString(link, { type: 'svg', margin: 1, color: { dark: '#11172e', light: '#f5f6fa' } }).then(setQr).catch(() => setQr(''));
  }, [showQr, qr, link]);

  const flash = (what) => {
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1800);
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'سباق العقول', text: `انضم إلى غرفتي في سباق العقول. الرمز: ${code}`, url: link });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    if (await copy(link)) flash('link');
  };

  return (
    <section className="invite card">
      <p className="eyebrow">رمز الدعوة</p>
      <p className="invite__code" dir="ltr" aria-label={`رمز الغرفة ${code.split('').join(' ')}`}>
        {code.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </p>
      <div className="invite__actions">
        <button type="button" className="chip" onClick={async () => (await copy(code)) && flash('code')}>
          <Icon name={copied === 'code' ? 'check' : 'copy'} size={16} /> {copied === 'code' ? 'نُسخ الرمز' : 'نسخ الرمز'}
        </button>
        <button type="button" className="chip" onClick={share}>
          <Icon name={copied === 'link' ? 'check' : 'share'} size={16} /> {copied === 'link' ? 'نُسخ الرابط' : 'مشاركة الرابط'}
        </button>
        <button type="button" className={`chip${showQr ? ' is-active' : ''}`} onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          <Icon name="qr" size={16} /> رمز QR
        </button>
      </div>
      {showQr && (
        <div className="invite__qr" aria-label="رمز QR لرابط الغرفة">
          {qr ? <span dangerouslySetInnerHTML={{ __html: qr }} /> : <span className="muted">جارٍ التجهيز…</span>}
        </div>
      )}
      <p className="invite__link" dir="ltr">
        {link}
      </p>
    </section>
  );
}
