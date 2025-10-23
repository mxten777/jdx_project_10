import { useState } from 'react';
import HeroSection from './HeroSection';
import AuthProfile from './AuthProfile';
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
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-pastelBlue flex flex-col font-sans">
      <nav
        className="bg-cream shadow-soft flex flex-wrap items-center justify-between py-3 sticky top-0 z-10 w-full px-2 xs:px-4"
        role="navigation"
        aria-label="메인 메뉴"
      >
        <div className="flex flex-wrap justify-center gap-2 xs:gap-3 max-w-4xl mx-auto">
          {MENU.map(item => (
            <button
              key={item.key}
              className={`px-3 xs:px-4 py-2 rounded-lg font-semibold transition-colors text-xs xs:text-sm md:text-base tracking-tight shadow ${selected === item.key ? 'bg-accent text-white shadow-lg' : 'text-accent bg-softGray hover:bg-accent hover:text-white'}`}
              style={{ minWidth: 72 }}
              onClick={() => {
                setSelected(item.key);
                if (item.key !== 'detail') setSelectedMemoryId(null);
              }}
              aria-current={selected === item.key ? 'page' : undefined}
              aria-label={item.label}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <AuthProfile />
        </div>
      </nav>
      <main
        className="flex-1 flex flex-col items-center px-4 py-6 w-full"
        role="main"
        aria-label="JDX Alumni Memories 메인 콘텐츠"
      >
        <div className="w-full max-w-2xl mx-auto">
          {selected === 'home' && <HeroSection />}
          {selected === 'upload' && <MemoryUpload />}
          {selected === 'list' && (
            <MemoryList onSelect={(id: string) => {
              setSelectedMemoryId(id);
              setSelected('detail');
            }} />
          )}
          {selected === 'detail' && <MemoryDetail id={selectedMemoryId} />}
          {selected === 'chat' && <ChatRoom />}
          {selected === 'timeline' && <Timeline />}
          {selected === 'event' && <EventPage />}
        </div>
      </main>
    </div>
  );
}