import ModeCard from '../components/ModeCard.jsx';
import { PageHeader } from '../components/ui.jsx';
import { MODES } from '../engine/modes.js';

export default function OfflineModesScreen() {
  return (
    <div className="screen">
      <PageHeader title="العب بدون إنترنت" subtitle="اختر نمط اللعب. كل الأنماط تعمل على جهاز واحد بالتناوب، دون اتصال." />
      <div className="modes-grid">
        {MODES.map((m) => (
          <ModeCard key={m.id} mode={m} to={`/offline/${m.id}`} />
        ))}
      </div>
    </div>
  );
}
