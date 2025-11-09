import { useState, useEffect } from 'react';

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query hook with SSR support
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    // Server-side rendering에서는 false 반환
    if (typeof window === 'undefined') return false;
    
    // 클라이언트에서는 즉시 실제 값으로 초기화
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    
    // 마운트 시 한 번 더 확인하여 정확한 값 설정
    if (matches !== mediaQuery.matches) {
      setMatches(mediaQuery.matches);
    }

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query, matches]);

  return matches;
};

// Breakpoint hook
export const useBreakpoint = (breakpoint: Breakpoint) => {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
};

// Multiple breakpoints hook
export const useBreakpoints = () => {
  const isXs = useBreakpoint('xs');
  const isSm = useBreakpoint('sm');
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isXl = useBreakpoint('xl');
  const is2Xl = useBreakpoint('2xl');

  // Current breakpoint
  const currentBreakpoint: Breakpoint = is2Xl ? '2xl' : isXl ? 'xl' : isLg ? 'lg' : isMd ? 'md' : isSm ? 'sm' : 'xs';

  // Screen size categories
  const isMobile = !isSm;
  const isTablet = isSm && !isLg;
  const isDesktop = isLg;

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop
  };
};

// Viewport dimensions hook
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};

// Touch device detection
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - Legacy IE property
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
};

// Device type detection
export const useDeviceType = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const isTouchDevice = useTouchDevice();
  const orientation = useOrientation();

  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    orientation,
    // Combined states
    isMobilePortrait: isMobile && orientation === 'portrait',
    isMobileLandscape: isMobile && orientation === 'landscape',
    isTabletPortrait: isTablet && orientation === 'portrait',
    isTabletLandscape: isTablet && orientation === 'landscape'
  };
};

// Safe area insets (for iOS notch, etc.)
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
      });
    };

    // Set CSS custom properties for safe area insets
    if (CSS.supports('padding: max(0px)')) {
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
      document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
    }

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

// Main responsive hook - combines all responsive utilities
export const useResponsive = () => {
  const breakpoints = useBreakpoints();
  const viewport = useViewport();
  const orientation = useOrientation();
  const deviceType = useDeviceType();
  const isTouchDevice = useTouchDevice();
  const safeAreaInsets = useSafeAreaInsets();

  return {
    breakpoints,
    viewport,
    orientation,
    deviceType,
    isTouchDevice,
    safeAreaInsets,
    // Convenience properties
    isMobile: deviceType.isMobile,
    isTablet: deviceType.isTablet,
    isDesktop: deviceType.isDesktop,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};