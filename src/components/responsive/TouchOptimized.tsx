import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useSwipe, useLongPress } from '../../hooks/useGestures';
import { useResponsive } from '../../hooks/useResponsive';
import { clsx } from 'clsx';

// Touch-optimized button
export interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  haptic?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  haptic = true
}) => {
  const { isTouchDevice } = useResponsive();

  const handleClick = () => {
    if (disabled || loading) return;
    
    // Haptic feedback on supported devices
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.();
  };

  const variants = {
    primary: 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 shadow-md hover:bg-gray-300 active:bg-gray-400',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-600 text-white shadow-lg hover:bg-red-700 active:bg-red-800'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
    xl: 'px-10 py-5 text-xl min-h-[64px]'
  };

  return (
    <motion.button
      className={clsx(
        'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Larger touch targets on mobile
        isTouchDevice && 'min-w-[44px]',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={clsx(loading && 'opacity-0')}>
        {children}
      </span>
    </motion.button>
  );
};

// Swipeable card component
export interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  disabled = false,
  className
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_: Event, info: PanInfo) => {
    if (disabled) return;
    setDragX(info.offset.x);
  };

  const handleDragEnd = (_: Event, info: PanInfo) => {
    setIsDragging(false);
    setDragX(0);

    if (disabled) return;

    const threshold = 100;
    const velocity = Math.abs(info.velocity.x);

    if (info.offset.x > threshold || velocity > 500) {
      if (info.offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
  };

  const swipeHandlers = useSwipe({
    onSwipe: (direction) => {
      if (disabled) return;
      
      if (direction.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }
  }, {
    threshold: 50,
    trackTouch: true
  });

  useEffect(() => {
    if (cardRef.current) {
      return swipeHandlers.attachListeners(cardRef.current);
    }
  }, [swipeHandlers]);

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {rightAction && (
            <div className="flex-1 flex items-center justify-start pl-4 bg-green-500">
              {rightAction}
            </div>
          )}
          {leftAction && (
            <div className="flex-1 flex items-center justify-end pr-4 bg-red-500">
              {leftAction}
            </div>
          )}
        </div>
      )}

      {/* Card content */}
      <motion.div
        ref={cardRef}
        className={clsx(
          'relative bg-white transition-shadow duration-200',
          isDragging && 'shadow-lg',
          className
        )}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: dragX }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Pull-to-refresh component
export interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 100,
  className
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    if (disabled || window.scrollY > 0) return;
    setIsPulling(true);
  };

  const handleDrag = (_: Event, info: PanInfo) => {
    if (disabled || !isPulling || window.scrollY > 0) return;
    
    const distance = Math.max(0, info.offset.y);
    setPullDistance(distance);
  };

  const handleDragEnd = async () => {
    if (disabled || !isPulling) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    if (pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  const refreshIndicatorHeight = Math.min(pullDistance, threshold);
  const shouldTrigger = pullDistance > threshold;

  return (
    <div className={clsx('relative', className)} ref={containerRef}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 transition-all duration-200"
        style={{
          height: `${refreshIndicatorHeight}px`,
          transform: `translateY(-${threshold - refreshIndicatorHeight}px)`,
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">새로고침 중...</span>
          </div>
        ) : shouldTrigger ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414L8.586 8l-2.293 2.293a1 1 0 101.414 1.414L9 10.414l.293.293a1 1 0 001.414-1.414L10.414 9l2.293-2.293a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">놓아서 새로고침</span>
          </div>
        ) : isPulling ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">아래로 당기기</span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isPulling ? pullDistance : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Long press menu component
export interface LongPressMenuProps {
  children: ReactNode;
  menuItems: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
  disabled?: boolean;
  className?: string;
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  menuItems,
  disabled = false,
  className
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const longPressHandlers = useLongPress({
    onLongPress: (e) => {
      if (disabled) return;

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }

      setIsMenuOpen(true);
      e.preventDefault();
    }
  }, {
    threshold: 500,
    detect: 'both'
  });

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (triggerRef.current) {
      return longPressHandlers.attachListeners(triggerRef.current);
    }
  }, [longPressHandlers]);

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setIsMenuOpen(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={clsx('relative', className)}
      >
        {children}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/10 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <motion.div
              className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
              style={{
                left: menuPosition.x,
                top: menuPosition.y,
                transform: 'translate(-50%, -100%)',
                marginTop: '-8px'
              }}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={clsx(
                    'w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                    item.destructive ? 'text-red-600' : 'text-gray-900'
                  )}
                  onClick={() => handleMenuItemClick(item.onClick)}
                >
                  {item.icon && (
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};