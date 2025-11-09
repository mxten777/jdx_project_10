import React, { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import { useSwipe } from '../../hooks/useGestures';
import { clsx } from 'clsx';

export interface MobileNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  position?: 'top' | 'bottom';
  variant?: 'tabs' | 'floating' | 'minimal';
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  items,
  position = 'bottom',
  variant = 'tabs',
  className
}) => {
  const { isMobile, safeAreaInsets } = useResponsive();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-hide navigation on scroll (only for bottom position)
  useEffect(() => {
    if (!isMobile || position !== 'bottom') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile, position]);

  const swipeHandlers = useSwipe({
    onSwipe: (direction) => {
      if (position === 'bottom') {
        if (direction.direction === 'down') {
          setIsVisible(false);
        } else if (direction.direction === 'up') {
          setIsVisible(true);
        }
      }
    }
  }, {
    threshold: 50,
    trackTouch: true
  });

  // SSR 호환성을 위해 마운트 전에는 렌더링하지 않음
  if (!isMounted || !isMobile) return null;

  const baseClasses = {
    tabs: 'bg-white border-t border-gray-200 shadow-lg',
    floating: 'bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-gray-200/50',
    minimal: 'bg-transparent'
  };

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0'
  };

  const containerClasses = clsx(
    'fixed left-0 right-0 z-50 transition-transform duration-300',
    positionClasses[position],
    baseClasses[variant],
    {
      'translate-y-0': isVisible,
      'translate-y-full': !isVisible && position === 'bottom',
      '-translate-y-full': !isVisible && position === 'top',
    },
    className
  );

  const paddingStyle = {
    paddingBottom: position === 'bottom' ? `${safeAreaInsets.bottom}px` : undefined,
    paddingTop: position === 'top' ? `${safeAreaInsets.top}px` : undefined,
  };

  return (
    <motion.nav
      className={clsx(containerClasses, 'mobile-nav-smooth')}
      style={paddingStyle}
      initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : (position === 'bottom' ? 100 : -100),
        opacity: isVisible ? 1 : 0
      }}
      transition={{ 
        type: 'spring', 
        damping: 25, 
        stiffness: 200,
        opacity: { duration: 0.2 }
      }}
      ref={(el) => {
        if (el) {
          const cleanup = swipeHandlers.attachListeners(el);
          return cleanup;
        }
      }}
    >
      <div className={clsx(
        'flex items-center',
        variant === 'floating' ? 'justify-center px-6 py-2' : 'justify-around px-2 py-1'
      )}>
        {items.map((item) => (
          <MobileNavItem
            key={item.id}
            item={item}
            variant={variant}
          />
        ))}
      </div>
    </motion.nav>
  );
};

interface MobileNavItemProps {
  item: MobileNavItem;
  variant: 'tabs' | 'floating' | 'minimal';
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ item, variant }) => {
  const itemClasses = clsx(
    'relative flex flex-col items-center justify-center transition-all duration-200',
    {
      // Tabs variant
      'px-3 py-2 min-w-0': variant === 'tabs',
      // Floating variant
      'px-4 py-2': variant === 'floating',
      // Minimal variant
      'px-2 py-1': variant === 'minimal',
    },
    {
      'text-blue-600': item.active,
      'text-gray-600 hover:text-gray-900': !item.active,
    }
  );

  return (
    <motion.button
      className={itemClasses}
      onClick={item.onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Icon */}
      {item.icon && (
        <div className="relative mb-1">
          <div className={clsx(
            'transition-colors duration-200',
            {
              'text-blue-600': item.active,
              'text-gray-500': !item.active,
            }
          )}>
            {item.icon}
          </div>
          
          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {item.badge > 99 ? '99+' : item.badge}
            </div>
          )}
        </div>
      )}
      
      {/* Label */}
      <span className={clsx(
        'text-xs font-medium transition-colors duration-200',
        variant === 'minimal' && 'sr-only',
        {
          'text-blue-600': item.active,
          'text-gray-600': !item.active,
        }
      )}>
        {item.label}
      </span>
      
      {/* Active indicator */}
      {item.active && variant === 'tabs' && (
        <motion.div
          className="absolute -top-px left-0 right-0 h-0.5 bg-blue-600 rounded-full"
          layoutId="activeTab"
          initial={false}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        />
      )}
    </motion.button>
  );
};

// Mobile drawer/sidebar component
export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  className
}) => {
  const { isMobile, safeAreaInsets } = useResponsive();

  // Handle swipe to close
  const swipeHandlers = useSwipe({
    onSwipe: (direction) => {
      const shouldClose = 
        (position === 'left' && direction.direction === 'left') ||
        (position === 'right' && direction.direction === 'right') ||
        (position === 'top' && direction.direction === 'up') ||
        (position === 'bottom' && direction.direction === 'down');
      
      if (shouldClose) {
        onClose();
      }
    }
  }, {
    threshold: 50,
    trackTouch: true
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // SSR 호환성을 위해 마운트 전에는 렌더링하지 않음
  if (!isMobile) return null;

  const getDrawerAnimation = () => {
    switch (position) {
      case 'left':
        return {
          initial: { x: '-100%' },
          animate: { x: 0 },
          exit: { x: '-100%' }
        };
      case 'right':
        return {
          initial: { x: '100%' },
          animate: { x: 0 },
          exit: { x: '100%' }
        };
      case 'top':
        return {
          initial: { y: '-100%' },
          animate: { y: 0 },
          exit: { y: '-100%' }
        };
      case 'bottom':
        return {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' }
        };
      default:
        return {
          initial: { x: '-100%' },
          animate: { x: 0 },
          exit: { x: '-100%' }
        };
    }
  };

  const getDrawerClasses = () => {
    const baseClasses = 'fixed bg-white shadow-xl z-50';
    
    switch (position) {
      case 'left':
        return `${baseClasses} top-0 left-0 bottom-0 w-80 max-w-[85vw]`;
      case 'right':
        return `${baseClasses} top-0 right-0 bottom-0 w-80 max-w-[85vw]`;
      case 'top':
        return `${baseClasses} top-0 left-0 right-0 h-auto max-h-[85vh]`;
      case 'bottom':
        return `${baseClasses} bottom-0 left-0 right-0 h-auto max-h-[85vh]`;
      default:
        return `${baseClasses} top-0 left-0 bottom-0 w-80 max-w-[85vw]`;
    }
  };

  const paddingStyle = {
    paddingTop: (position === 'top' || position === 'left' || position === 'right') 
      ? `${safeAreaInsets.top}px` : undefined,
    paddingBottom: (position === 'bottom' || position === 'left' || position === 'right') 
      ? `${safeAreaInsets.bottom}px` : undefined,
    paddingLeft: position === 'left' ? `${safeAreaInsets.left}px` : undefined,
    paddingRight: position === 'right' ? `${safeAreaInsets.right}px` : undefined,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className={clsx(getDrawerClasses(), className)}
            style={paddingStyle}
            {...getDrawerAnimation()}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            ref={(el) => {
              if (el) {
                const cleanup = swipeHandlers.attachListeners(el);
                return cleanup;
              }
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};