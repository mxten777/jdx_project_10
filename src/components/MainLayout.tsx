import { useState } from 'react';
import HeroSection from './HeroSection';
import MemoryUpload from './MemoryUpload';
import MemoryList from './MemoryList';
import MemoryDetail from './MemoryDetail';
import ChatRoom from './ChatRoom';
import Timeline from './Timeline';
import EventPage from './EventPage';

const MENU = [
  { key: 'home', label: '홈' },
  { key: 'upload', label: '추억 업로드' },
  { key: 'list', label: '추억 목록' },
  { key: 'detail', label: '상세보기' },
  { key: 'chat', label: '채팅방' },
  { key: 'timeline', label: '타임라인' },
  { key: 'event', label: '동창회 일정' },
];

export default function MainLayout() {
  const [selected, setSelected] = useState('home');

  return (
    <div className="min-h-screen bg-pastelBlue flex flex-col font-sans">
      <nav className="bg-cream shadow-soft flex flex-wrap justify-center py-2 sticky top-0 z-10">
        {MENU.map(item => (
          <button
            key={item.key}
            className={`mx-1 xs:mx-2 px-2 xs:px-3 py-1 rounded font-semibold transition-colors text-sm xs:text-base ${selected === item.key ? 'bg-accent text-white shadow' : 'text-accent'}`}
            onClick={() => setSelected(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="flex-1 flex flex-col items-center px-2 py-4 w-full max-w-2xl mx-auto">
        {selected === 'home' && <HeroSection />}
        {selected === 'upload' && <MemoryUpload />}
        {selected === 'list' && <MemoryList />}
        {selected === 'detail' && <MemoryDetail />}
        {selected === 'chat' && <ChatRoom />}
        {selected === 'timeline' && <Timeline />}
        {selected === 'event' && <EventPage />}
      </main>
    </div>
  );
}
