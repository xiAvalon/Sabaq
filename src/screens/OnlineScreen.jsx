import { PageHeader, EmptyState } from '../components/ui.jsx';

// Replaced by the real room flow in the online phase.
export default function OnlineScreen() {
  return (
    <div className="screen narrow">
      <PageHeader title="العب أونلاين" />
      <EmptyState icon="online" title="الغرف الخاصة قيد الإعداد" />
    </div>
  );
}
