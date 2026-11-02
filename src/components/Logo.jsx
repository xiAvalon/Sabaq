export default function Logo({ size = 'lg' }) {
  return (
    <div className={`marquee marquee--${size}`}>
      <span className="marquee__kicker">مسابقة المعرفة والسرعة</span>
      <span className="marquee__title">سباق العقول</span>
    </div>
  );
}
