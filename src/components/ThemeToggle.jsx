import { useSettings } from '../context/SettingsContext.jsx';
import { Icon } from './icons.jsx';

/** Shows the current mode: moon in dark mode, sun in light mode. Clicking switches. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useSettings();
  const toLight = theme === 'dark';
  const label = toLight ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن';
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggleTheme} aria-label={label} data-tip={label}>
      <Icon name={toLight ? 'moon' : 'sun'} size={20} />
    </button>
  );
}
