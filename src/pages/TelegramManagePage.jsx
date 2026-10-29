import { useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import TelegramBroadcastsTab from './admin/telegram/TelegramBroadcastsTab';
import TelegramHubTab from './admin/telegram/TelegramHubTab';
import TelegramStudioTab from './admin/telegram/TelegramStudioTab';
import TelegramComponentsTab from './admin/telegram/TelegramComponentsTab';

const tabSection = (tab) => {
  if (['hub', 'bots', 'stats'].includes(tab)) return 'hub';
  if (['studio', 'entry', 'menu', 'commands', 'copy', 'contents', 'templates'].includes(tab)) return 'studio';
  if (tab === 'components') return 'components';
  if (['broadcasts', 'broadcast-stats'].includes(tab)) return 'broadcasts';
  return 'hub';
};

const TelegramManagePage = () => {
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'hub';
  const section = tabSection(activeTab);

  return (
    <AdminLayout>
      <div className={section === 'studio' ? 'max-w-[1600px] mx-auto' : 'max-w-7xl mx-auto'}>
        {section === 'hub' && <TelegramHubTab />}
        {section === 'studio' && <TelegramStudioTab />}
        {section === 'components' && <TelegramComponentsTab />}
        {section === 'broadcasts' && <TelegramBroadcastsTab />}
      </div>
    </AdminLayout>
  );
};

export default TelegramManagePage;
