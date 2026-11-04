// Sabaq identity: a stopwatch whose cyan arc is five-sixths full (the 30-second dial) with a gold crown.
export function LogoMark({ size = 44, className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#5146D8" />
      <rect x="26.5" y="7" width="11" height="6" rx="2.5" fill="#FFC857" />
      <circle cx="32" cy="36" r="18" fill="none" stroke="rgba(245,246,250,0.22)" strokeWidth="6" />
      <circle
        cx="32"
        cy="36"
        r="18"
        fill="none"
        stroke="#32C5D2"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="94.25 113.1"
        transform="rotate(-90 32 36)"
      />
      <path d="M32 36 40 26" stroke="#F5F6FA" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="36" r="3.6" fill="#FFC857" />
    </svg>
  );
}

export function Wordmark({ size = 'md' }) {
  return (
    <span className={`wordmark wordmark--${size}`}>
      <LogoMark size={size === 'lg' ? 72 : size === 'sm' ? 32 : 40} />
      <span className="wordmark__text">
        <span className="wordmark__ar">سباق</span>
        <span className="wordmark__sub">العقول</span>
      </span>
    </span>
  );
}
