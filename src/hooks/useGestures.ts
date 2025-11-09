import { useRef, useCallback } from 'react';

export interface SwipeDirection {
  x: number;
  y: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

export interface SwipeHandlers {
  onSwipeStart?: (e: TouchEvent) => void;
  onSwipeMove?: (e: TouchEvent, direction: SwipeDirection) => void;
  onSwipeEnd?: (e: TouchEvent, direction: SwipeDirection) => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

export interface SwipeOptions {
  threshold?: number; // Minimum distance for a swipe
  velocityThreshold?: number; // Minimum velocity for a swipe
  preventDefaultTouchmoveEvent?: boolean;
  trackTouch?: boolean;
  trackMouse?: boolean;
}

// Swipe gesture hook
export const useSwipe = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchmoveEvent = false,
    trackTouch = true,
    trackMouse = false
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const calculateDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection['direction'] => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const getSwipeDirection = useCallback((start: { x: number; y: number; time: number }, end: { x: number; y: number; time: number }): SwipeDirection => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const timeDelta = end.time - start.time;
    const velocity = distance / timeDelta;

    return {
      x: deltaX,
      y: deltaY,
      direction: distance > threshold ? calculateDirection(deltaX, deltaY) : null,
      distance,
      velocity
    };
  }, [threshold, calculateDirection]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    handlers.onSwipeStart?.(e);
  }, [handlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const direction = getSwipeDirection(touchStartRef.current, touchMoveRef.current);
    handlers.onSwipeMove?.(e, direction);
  }, [handlers, preventDefaultTouchmoveEvent, getSwipeDirection]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || !touchMoveRef.current) return;

    const direction = getSwipeDirection(touchStartRef.current, touchMoveRef.current);
    
    handlers.onSwipeEnd?.(e, direction);

    if (direction.direction && direction.distance > threshold && direction.velocity > velocityThreshold) {
      handlers.onSwipe?.(direction);
    }

    touchStartRef.current = null;
    touchMoveRef.current = null;
  }, [handlers, threshold, velocityThreshold, getSwipeDirection]);

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  }, [trackMouse]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trackMouse || !touchStartRef.current) return;
    
    touchMoveRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  }, [trackMouse]);

  const handleMouseUp = useCallback((_e: MouseEvent) => {
    if (!trackMouse || !touchStartRef.current || !touchMoveRef.current) return;

    const direction = getSwipeDirection(touchStartRef.current, touchMoveRef.current);
    
    if (direction.direction && direction.distance > threshold && direction.velocity > velocityThreshold) {
      handlers.onSwipe?.(direction);
    }

    touchStartRef.current = null;
    touchMoveRef.current = null;
  }, [trackMouse, threshold, velocityThreshold, getSwipeDirection, handlers]);

  const attachListeners = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    if (trackTouch) {
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefaultTouchmoveEvent });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    if (trackMouse) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (trackTouch) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }

      if (trackMouse) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [trackTouch, trackMouse, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, preventDefaultTouchmoveEvent]);

  return { attachListeners };
};

// Pinch/Zoom gesture hook
export interface PinchHandlers {
  onPinchStart?: (e: TouchEvent) => void;
  onPinchMove?: (e: TouchEvent, scale: number, rotation: number) => void;
  onPinchEnd?: (e: TouchEvent, scale: number, rotation: number) => void;
}

export interface PinchOptions {
  threshold?: number;
}

export const usePinch = (
  handlers: PinchHandlers,
  options: PinchOptions = {}
) => {
  const { threshold = 0.1 } = options;
  
  const initialDistanceRef = useRef<number>(0);
  const initialAngleRef = useRef<number>(0);
  const scaleRef = useRef<number>(1);
  const rotationRef = useRef<number>(0);

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const getAngle = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * 180 / Math.PI;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;

    const [touch1, touch2] = e.touches;
    initialDistanceRef.current = getDistance(touch1, touch2);
    initialAngleRef.current = getAngle(touch1, touch2);
    
    handlers.onPinchStart?.(e);
  }, [handlers, getDistance, getAngle]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2 || initialDistanceRef.current === 0) return;

    e.preventDefault();

    const [touch1, touch2] = e.touches;
    const currentDistance = getDistance(touch1, touch2);
    const currentAngle = getAngle(touch1, touch2);

    scaleRef.current = currentDistance / initialDistanceRef.current;
    rotationRef.current = currentAngle - initialAngleRef.current;

    if (Math.abs(scaleRef.current - 1) > threshold) {
      handlers.onPinchMove?.(e, scaleRef.current, rotationRef.current);
    }
  }, [handlers, getDistance, getAngle, threshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (initialDistanceRef.current === 0) return;

    handlers.onPinchEnd?.(e, scaleRef.current, rotationRef.current);

    // Reset
    initialDistanceRef.current = 0;
    initialAngleRef.current = 0;
    scaleRef.current = 1;
    rotationRef.current = 0;
  }, [handlers]);

  const attachListeners = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { attachListeners };
};

// Long press gesture hook
export interface LongPressHandlers {
  onLongPress?: (e: TouchEvent | MouseEvent) => void;
  onLongPressStart?: (e: TouchEvent | MouseEvent) => void;
  onLongPressEnd?: (e: TouchEvent | MouseEvent) => void;
}

export interface LongPressOptions {
  threshold?: number; // Duration in ms
  captureEvent?: boolean;
  detect?: 'touch' | 'mouse' | 'both';
}

export const useLongPress = (
  handlers: LongPressHandlers,
  options: LongPressOptions = {}
) => {
  const {
    threshold = 500,
    captureEvent = true,
    detect = 'both'
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e: TouchEvent | MouseEvent) => {
    if (captureEvent) {
      e.preventDefault();
    }

    isLongPressRef.current = false;
    handlers.onLongPressStart?.(e);

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      handlers.onLongPress?.(e);
    }, threshold);
  }, [handlers, threshold, captureEvent]);

  const clear = useCallback((e: TouchEvent | MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLongPressRef.current) {
      handlers.onLongPressEnd?.(e);
    }

    isLongPressRef.current = false;
  }, [handlers]);

  const attachListeners = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};

    const cleanup: (() => void)[] = [];

    if (detect === 'touch' || detect === 'both') {
      const handleTouchStart = (e: TouchEvent) => start(e);
      const handleTouchEnd = (e: TouchEvent) => clear(e);
      const handleTouchCancel = (e: TouchEvent) => clear(e);

      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);
      element.addEventListener('touchcancel', handleTouchCancel);

      cleanup.push(() => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchCancel);
      });
    }

    if (detect === 'mouse' || detect === 'both') {
      const handleMouseDown = (e: MouseEvent) => start(e);
      const handleMouseUp = (e: MouseEvent) => clear(e);
      const handleMouseLeave = (e: MouseEvent) => clear(e);

      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseLeave);

      cleanup.push(() => {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    }

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [detect, start, clear]);

  return { attachListeners };
};