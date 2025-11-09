import React, { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { clsx } from 'clsx';

export interface TabletSidebarProps {
  children: ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const TabletSidebar: React.FC<TabletSidebarProps> = ({
  children,
  isCollapsed = false,
  onToggle,
  className
}) => {
  const { isTablet, safeAreaInsets } = useResponsive();

  if (!isTablet) return null;

  return (
    <motion.aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md shadow-xl border-r border-gray-200/50 z-40',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-80',
        className
      )}
      style={{
        paddingTop: `${safeAreaInsets.top}px`,
        paddingBottom: `${safeAreaInsets.bottom}px`,
      }}
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 320,
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={clsx(
          'absolute -right-4 top-1/2 -translate-y-1/2',
          'w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200',
          'flex items-center justify-center text-gray-600 hover:text-gray-900',
          'transition-colors duration-200 z-50'
        )}
        aria-label={isCollapsed ? '사이드바 열기' : '사이드바 닫기'}
      >
        <motion.svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </motion.svg>
      </button>

      {/* Content */}
      <div className="h-full overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </motion.aside>
  );
};

export interface TabletSplitLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

export const TabletSplitLayout: React.FC<TabletSplitLayoutProps> = ({
  sidebar,
  main,
  sidebarCollapsed = false,
  onSidebarToggle,
  className
}) => {
  const { isTablet, safeAreaInsets } = useResponsive();

  if (!isTablet) {
    return <>{main}</>;
  }

  return (
    <div className={clsx('flex h-full', className)}>
      {/* Sidebar */}
      <TabletSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={onSidebarToggle}
      >
        {sidebar}
      </TabletSidebar>

      {/* Main Content */}
      <motion.main
        className="flex-1 min-h-full bg-gray-50/50"
        style={{
          marginLeft: sidebarCollapsed ? 64 : 320,
          paddingTop: `${safeAreaInsets.top}px`,
          paddingBottom: `${safeAreaInsets.bottom}px`,
        }}
        animate={{
          marginLeft: sidebarCollapsed ? 64 : 320,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200,
        }}
      >
        <div className="p-6 md:p-8">
          {main}
        </div>
      </motion.main>
    </div>
  );
};

export interface TabletGridProps {
  children: ReactNode;
  variant?: 'auto' | 'fixed' | 'masonry';
  minItemWidth?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TabletGrid: React.FC<TabletGridProps> = ({
  children,
  variant = 'auto',
  minItemWidth = 300,
  gap = 'md',
  className
}) => {
  const { isTablet, viewport } = useResponsive();

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getGridCols = () => {
    if (!isTablet) return 'grid-cols-1';
    
    const availableWidth = viewport.width - 64; // Account for padding
    const cols = Math.floor(availableWidth / (minItemWidth + 24)); // 24px for gap
    
    return `grid-cols-${Math.max(1, Math.min(4, cols))}`;
  };

  const gridClasses = {
    auto: `grid ${getGridCols()}`,
    fixed: 'grid grid-cols-2 md:grid-cols-3',
    masonry: 'columns-2 md:columns-3'
  };

  return (
    <div
      className={clsx(
        gridClasses[variant],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface TabletCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  hover?: boolean;
  className?: string;
}

export const TabletCard: React.FC<TabletCardProps> = ({
  children,
  title,
  subtitle,
  action,
  hover = true,
  className
}) => {
  return (
    <motion.div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-200/50',
        'overflow-hidden',
        hover && 'hover:shadow-md hover:border-gray-300/50',
        'transition-all duration-200',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};

export interface TabletNavTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export const TabletNavTabs: React.FC<TabletNavTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  className
}) => {
  const variantClasses = {
    default: 'border-b border-gray-200',
    pills: 'bg-gray-100 rounded-lg p-1',
    underline: ''
  };

  const tabClasses = {
    default: (isActive: boolean) => clsx(
      'px-4 py-3 font-medium text-sm border-b-2 transition-colors duration-200',
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    ),
    pills: (isActive: boolean) => clsx(
      'px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200',
      isActive
        ? 'bg-white text-blue-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
    ),
    underline: (isActive: boolean) => clsx(
      'px-4 py-3 font-medium text-sm relative transition-colors duration-200',
      isActive
        ? 'text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    )
  };

  return (
    <div className={clsx(variantClasses[variant], className)}>
      <nav className="flex space-x-0" aria-label="탭 네비게이션">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={tabClasses[variant](isActive)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && (
                  <span className="flex-shrink-0">
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </div>
              
              {/* Underline variant indicator */}
              {variant === 'underline' && isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  layoutId="activeTabIndicator"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export interface TabletModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const TabletModal: React.FC<TabletModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}) => {
  const { isTablet } = useResponsive();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl mx-4'
  };

  if (!isTablet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                className={clsx(
                  'relative bg-white rounded-xl shadow-xl',
                  'w-full',
                  sizeClasses[size],
                  className
                )}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {title && (
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {title}
                      </h2>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};