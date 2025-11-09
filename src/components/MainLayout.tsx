import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useResponsive } from '../hooks/useResponsive';
import HeroSection from './HeroSection';
import AuthProfile from './AuthProfile';
import { 
  LazyMemoryUpload, 
  LazyMemoryList, 
  LazyMemoryDetail, 
  LazyChatRoom, 
  LazyTimeline, 
  LazyEventPage
} from './LazyComponents';
import AuthModal from './AuthModal';
import { MobileNav, MobileDrawer, type MobileNavItem } from './responsive/MobileNavigation';
import { ResponsiveContainer } from './responsive/ResponsiveLayout';
import { TabletSplitLayout } from './responsive/TabletLayout';
import { TabletNavigation, type TabletNavItem } from './responsive/TabletNavigation';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { images } from '../assets/images';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdatePrompt from './PWAUpdatePrompt';
import AdvancedSearch from './AdvancedSearch';
import QuickSearch from './QuickSearch';

// 🎯 Menu Configuration with Icons
const MENU = [
  { 
    key: 'home', 
    label: '홈',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    key: 'upload', 
    label: '추억 업로드',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
  { 
    key: 'list', 
    label: '추억 목록',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
      </svg>
    )
  },
  { 
    key: 'detail', 
    label: '상세보기',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  { 
    key: 'chat', 
    label: '채팅방',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  { 
    key: 'timeline', 
    label: '타임라인',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    key: 'event', 
    label: '동창회 일정',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
];

export default function MainLayout() {
  const [selected, setSelected] = useState('home');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [tabletSidebarCollapsed, setTabletSidebarCollapsed] = useState(false);
  
  const { isMobile, isTablet, safeAreaInsets } = useResponsive();

  // 하이드레이션 완료 체크
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Convert menu to mobile nav format
  const mobileNavItems: MobileNavItem[] = MENU.map(item => ({
    id: item.key,
    label: item.label,
    icon: item.icon,
    onClick: () => {
      setSelected(item.key);
      if (item.key !== 'detail') setSelectedMemoryId(null);
    },
    active: selected === item.key
  }));

  // Convert menu to tablet nav format
  const tabletNavItems: TabletNavItem[] = MENU.map(item => ({
    id: item.key,
    label: item.label,
    icon: item.icon,
    onClick: () => {
      setSelected(item.key);
      if (item.key !== 'detail') setSelectedMemoryId(null);
    },
    active: selected === item.key,
    badge: item.key === 'chat' ? 3 : undefined // 예시로 채팅에 뱃지 추가
  }));

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col font-display",
      "hydration-safe",
      isHydrated && "hydrated"
    )}>
      {/* 🎨 Premium Glass Header */}
      <motion.header
        className="glass sticky top-0 z-50 border-b border-white/20"
        role="banner"
        aria-label="JDX Alumni Memories 헤더"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16" 
               style={{ 
                 paddingTop: isMobile ? `${Math.max(safeAreaInsets.top - 8, 0)}px` : undefined,
                 minHeight: isMobile ? '56px' : undefined
               }}>
            
            {/* Logo & Brand */}
            <motion.div 
              className="flex items-center gap-3 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <ImageWithFallback
                  src={images.logo} 
                  alt="JDX 로고" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg ring-2 ring-white/50"
                  onError={() => console.error('Header logo failed to load')}
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full opacity-20 blur-sm" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  JDX Alumni
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Memories</p>
              </div>
            </motion.div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/20">
              {MENU.map((item, index) => (
                <motion.button
                  key={item.key}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200",
                    selected === item.key
                      ? "text-primary-700 bg-white shadow-md"
                      : "text-gray-600 hover:text-primary-600 hover:bg-white/50"
                  )}
                  onClick={() => {
                    setSelected(item.key);
                    if (item.key !== 'detail') setSelectedMemoryId(null);
                  }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  aria-current={selected === item.key ? 'page' : undefined}
                  aria-label={item.label}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                  
                  {/* Active indicator */}
                  {selected === item.key && (
                    <motion.div
                      className="absolute -bottom-0.5 left-1/2 w-4 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                      layoutId="activeTab"
                      style={{ x: '-50%' }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search - Desktop */}
              <div className="hidden lg:block">
                <QuickSearch 
                  onSelect={(result) => {
                    if (typeof result === 'string') {
                      console.log('Search query:', result);
                    } else {
                      setSelectedMemoryId(result.id);
                      setSelected('detail');
                    }
                  }}
                  placeholder="추억 검색..."
                  compact
                />
              </div>

              {/* Search Button - Mobile/Tablet */}
              <motion.button
                className="p-2 rounded-lg bg-white/50 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white/70 transition-all duration-200 lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="검색"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                className="p-2 rounded-lg bg-white/50 backdrop-blur-sm text-gray-700 hover:text-gray-900 hover:bg-white/70 transition-all duration-200 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="메뉴"
              >
                <motion.div
                  animate={mobileMenuOpen ? "open" : "closed"}
                  variants={{
                    open: { rotate: 180 },
                    closed: { rotate: 0 }
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </motion.div>
              </motion.button>
              
              {/* Auth Profile */}
              <AuthProfile onLoginClick={() => setAuthModalOpen(true)} />
            </div>
          </div>
        </div>
      </motion.header>
      {/* 📱 Mobile Navigation */}
      {isHydrated && isMobile && (
        <MobileNav 
          items={mobileNavItems}
          position="bottom"
          variant="tabs"
        />
      )}

      {/* 📱 Mobile Drawer Menu */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        position="right"
        className="bg-white/95 backdrop-blur-md"
      >
        <div className="p-6" style={{ paddingTop: `${safeAreaInsets.top + 24}px` }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ImageWithFallback
                src={images.logo} 
                alt="JDX 로고" 
                className="w-8 h-8 rounded-full shadow-lg"
                onError={() => console.error('Mobile drawer logo failed to load')}
              />
              <div>
                <h2 className="font-black text-gray-900">JDX Alumni</h2>
                <p className="text-sm text-gray-500">Memories</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Search */}
          <div className="mb-6">
            <AdvancedSearch 
              onSelect={(result) => {
                if (typeof result === 'string') {
                  console.log('Search query:', result);
                } else {
                  setSelectedMemoryId(result.id);
                  setSelected('detail');
                  setMobileMenuOpen(false);
                }
              }}
              className="w-full"
            />
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {MENU.map((item) => (
              <button
                key={item.key}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl font-semibold text-left transition-all duration-200",
                  selected === item.key
                    ? "text-primary-700 bg-primary-50 shadow-sm"
                    : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                )}
                onClick={() => {
                  setSelected(item.key);
                  setMobileMenuOpen(false);
                  if (item.key !== 'detail') setSelectedMemoryId(null);
                }}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  selected === item.key ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                )}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              © 2025 JDX Alumni. All rights reserved.
            </p>
          </div>
        </div>
      </MobileDrawer>

      {/* 📟 Tablet Navigation */}
      {isHydrated && isTablet && (
        <TabletNavigation 
          items={tabletNavItems}
          collapsed={tabletSidebarCollapsed}
          onToggle={() => setTabletSidebarCollapsed(!tabletSidebarCollapsed)}
        />
      )}


      {/* 🎯 Main Content */}
      <main
        className="flex-1 relative overflow-hidden"
        role="main"
        aria-label="JDX Alumni Memories 메인 콘텐츠"
      >
        <div className="h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="h-full"
              style={{ 
                paddingBottom: isMobile ? `${safeAreaInsets.bottom + 80}px` : undefined,
                paddingTop: isMobile ? `${safeAreaInsets.top + 16}px` : undefined
              }}
            >
              {/* 🖥️ Tablet Layout */}
              {isTablet ? (
                <TabletSplitLayout
                  sidebarCollapsed={tabletSidebarCollapsed}
                  onSidebarToggle={() => setTabletSidebarCollapsed(!tabletSidebarCollapsed)}
                  sidebar={
                    <div className="h-full bg-white/50 backdrop-blur-sm border-r border-white/20">
                      {/* 태블릿 사이드바 콘텐츠 */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          {MENU.find(item => item.key === selected)?.label}
                        </h3>
                        {selected === 'list' && (
                          <div className="text-sm text-gray-600">
                            메모리 목록을 확인하세요
                          </div>
                        )}
                        {selected === 'chat' && (
                          <div className="text-sm text-gray-600">
                            실시간 채팅
                          </div>
                        )}
                      </div>
                    </div>
                  }
                  main={
                    <>
                      {selected === 'home' && <HeroSection />}
                      {selected === 'upload' && (
                        <div className="p-6">
                          <LazyMemoryUpload />
                        </div>
                      )}
                      {selected === 'list' && (
                        <div className="p-6">
                          <LazyMemoryList onSelect={(id: string) => {
                            setSelectedMemoryId(id);
                            setSelected('detail');
                          }} />
                        </div>
                      )}
                      {selected === 'detail' && (
                        <div className="p-6">
                          <LazyMemoryDetail id={selectedMemoryId} />
                        </div>
                      )}
                      {selected === 'chat' && (
                        <div className="p-6">
                          <LazyChatRoom />
                        </div>
                      )}
                      {selected === 'timeline' && (
                        <div className="p-6">
                          <LazyTimeline />
                        </div>
                      )}
                      {selected === 'event' && (
                        <div className="p-6">
                          <LazyEventPage />
                        </div>
                      )}
                    </>
                  }
                />
              ) : (
                /* 📱 Mobile & Desktop Layout */
                <>
                  {selected === 'home' && <HeroSection />}
                  {selected === 'upload' && (
                    <ResponsiveContainer maxWidth="xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyMemoryUpload />
                      </div>
                    </ResponsiveContainer>
                  )}
                  {selected === 'list' && (
                    <ResponsiveContainer maxWidth="2xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyMemoryList onSelect={(id: string) => {
                          setSelectedMemoryId(id);
                          setSelected('detail');
                        }} />
                      </div>
                    </ResponsiveContainer>
                  )}
                  {selected === 'detail' && (
                    <ResponsiveContainer maxWidth="xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyMemoryDetail id={selectedMemoryId} />
                      </div>
                    </ResponsiveContainer>
                  )}
                  {selected === 'chat' && (
                    <ResponsiveContainer maxWidth="xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyChatRoom />
                      </div>
                    </ResponsiveContainer>
                  )}
                  {selected === 'timeline' && (
                    <ResponsiveContainer maxWidth="2xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyTimeline />
                      </div>
                    </ResponsiveContainer>
                  )}
                  {selected === 'event' && (
                    <ResponsiveContainer maxWidth="xl" padding="lg">
                      <div className="py-4 sm:py-8">
                        <LazyEventPage />
                      </div>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 🎨 Premium Glass Footer */}
      <motion.footer
        className="glass border-t border-white/20 mt-16"
        role="contentinfo"
        aria-label="JDX Alumni Memories 푸터"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <img 
                  src="/images/baikal_logo.png" 
                  alt="JDX 로고" 
                  className="w-8 h-8 rounded-full shadow-lg ring-2 ring-white/30" 
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full opacity-10 blur-sm" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">JDX Alumni</h3>
                <p className="text-sm text-gray-500">Memories Platform</p>
              </div>
            </motion.div>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                © 2025 JDX Alumni. All rights reserved.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Made with ❤️ for our precious memories
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <motion.a
                href="https://github.com/mxten777/jdx_project_10"
                target="_blank"
                rel="noopener"
                className="text-gray-500 hover:text-primary-600 transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.a>
              <motion.a
                href="mailto:admin@email.com"
                className="text-gray-500 hover:text-primary-600 transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </div>
  );
}