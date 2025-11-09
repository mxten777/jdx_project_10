import React, { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { clsx } from 'clsx';

export interface TabletNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  active?: boolean;
  onClick: () => void;
  children?: TabletNavItem[];
}

export interface TabletNavigationProps {
  items: TabletNavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const TabletNavigation: React.FC<TabletNavigationProps> = ({
  items,
  collapsed = false,
  onToggle,
  className
}) => {
  const { isTablet, safeAreaInsets } = useResponsive();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (!isTablet) return null;

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <nav
      className={clsx(
        'flex flex-col h-full',
        className
      )}
      style={{
        paddingTop: `${safeAreaInsets.top + 16}px`,
        paddingBottom: `${safeAreaInsets.bottom + 16}px`,
      }}
    >
      {/* Header */}
      <div className={clsx(
        'px-4 mb-6',
        collapsed && 'px-2'
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold text-gray-900">JDX Alumni</h1>
                <p className="text-xs text-gray-500">Memories</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <TabletNavItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedItems.has(item.id)}
              onToggleExpanded={() => toggleExpanded(item.id)}
            />
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className={clsx(
        'px-4 pt-4 border-t border-gray-200',
        collapsed && 'px-2'
      )}>
        <button
          onClick={onToggle}
          className={clsx(
            'w-full flex items-center justify-center space-x-2',
            'px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100',
            'transition-colors duration-200',
            collapsed && 'px-2'
          )}
          title={collapsed ? '사이드바 확장' : '사이드바 축소'}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
          </motion.svg>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-sm font-medium"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                축소
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </nav>
  );
};

interface TabletNavItemProps {
  item: TabletNavItem;
  collapsed: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  level?: number;
}

const TabletNavItem: React.FC<TabletNavItemProps> = ({
  item,
  collapsed,
  expanded,
  onToggleExpanded,
  level = 0
}) => {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <button
        className={clsx(
          'w-full flex items-center justify-between',
          'px-3 py-2.5 rounded-lg text-left',
          'transition-all duration-200',
          'group relative',
          item.active
            ? 'bg-blue-50 text-blue-700 shadow-sm'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
          collapsed && 'px-2 justify-center',
          level > 0 && 'ml-4'
        )}
        onClick={() => {
          item.onClick();
          if (hasChildren && !collapsed) {
            onToggleExpanded();
          }
        }}
        title={collapsed ? item.label : undefined}
      >
        <div className="flex items-center space-x-3 min-w-0">
          {/* Icon */}
          <div className={clsx(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center',
            item.active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
          )}>
            {item.icon}
          </div>

          {/* Label */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="flex-1 min-w-0 flex items-center justify-between"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="font-medium truncate">
                  {item.label}
                </span>
                
                <div className="flex items-center space-x-2">
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      item.active
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}

                  {/* Expand/Collapse Icon */}
                  {hasChildren && (
                    <motion.svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: expanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Indicator */}
        {item.active && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
            layoutId="activeIndicator"
            initial={false}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && !collapsed && (
          <motion.ul
            className="mt-1 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children!.map((child) => (
              <TabletNavItem
                key={child.id}
                item={child}
                collapsed={collapsed}
                expanded={false}
                onToggleExpanded={() => {}}
                level={level + 1}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};

export interface TabletTopBarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export const TabletTopBar: React.FC<TabletTopBarProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className
}) => {
  const { isTablet, safeAreaInsets } = useResponsive();

  if (!isTablet) return null;

  return (
    <header
      className={clsx(
        'bg-white/95 backdrop-blur-md border-b border-gray-200/50',
        'sticky top-0 z-30',
        className
      )}
      style={{
        paddingTop: `${safeAreaInsets.top + 16}px`,
      }}
    >
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2" aria-label="브레드크럼">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {crumb.href || crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};