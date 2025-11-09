import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0
  });

  const measureLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      setMetrics(prev => ({
        ...prev,
        loadTime: Math.round(loadTime)
      }));
    }
  }, []);

  const measureRenderTime = useCallback((componentName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (import.meta.env.DEV) {
          console.log(`🔍 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
        }
        
        setMetrics(prev => ({
          ...prev,
          renderTime: Math.round(renderTime)
        }));
      };
    }
    return () => {};
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in window.performance) {
      const memory = (window.performance as typeof window.performance & { memory: { usedJSHeapSize: number } }).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memoryUsage)
      }));
    }
  }, []);

  useEffect(() => {
    measureLoadTime();
    measureMemoryUsage();
    
    // Measure memory usage periodically
    const interval = setInterval(measureMemoryUsage, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [measureLoadTime, measureMemoryUsage]);

  return {
    metrics,
    measureRenderTime,
    measureMemoryUsage
  };
};

// Bundle analyzer hook
export const useBundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState({
    totalSize: 0,
    chunkSizes: {} as Record<string, number>,
    loadedChunks: new Set<string>()
  });

  const trackChunkLoad = useCallback((chunkName: string, size: number) => {
    setBundleInfo(prev => ({
      ...prev,
      totalSize: prev.totalSize + size,
      chunkSizes: {
        ...prev.chunkSizes,
        [chunkName]: size
      },
      loadedChunks: new Set([...prev.loadedChunks, chunkName])
    }));
  }, []);

  return {
    bundleInfo,
    trackChunkLoad
  };
};

// Image loading performance hook
export const useImagePerformance = () => {
  const [imageMetrics, setImageMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0
  });

  const trackImageLoad = useCallback((loadTime: number, success: boolean) => {
    setImageMetrics(prev => {
      const newTotalImages = prev.totalImages + 1;
      const newLoadedImages = success ? prev.loadedImages + 1 : prev.loadedImages;
      const newFailedImages = success ? prev.failedImages : prev.failedImages + 1;
      const newAverageLoadTime = success 
        ? (prev.averageLoadTime * prev.loadedImages + loadTime) / newLoadedImages
        : prev.averageLoadTime;

      return {
        totalImages: newTotalImages,
        loadedImages: newLoadedImages,
        failedImages: newFailedImages,
        averageLoadTime: Math.round(newAverageLoadTime)
      };
    });
  }, []);

  return {
    imageMetrics,
    trackImageLoad
  };
};

// Memory leak detection
export const useMemoryLeakDetection = () => {
  const [memoryTrend, setMemoryTrend] = useState<number[]>([]);
  const [leakDetected, setLeakDetected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in window.performance)) {
      return;
    }

    const checkMemoryLeak = () => {
      const memory = (window.performance as typeof window.performance & { memory: { usedJSHeapSize: number } }).memory;
      const currentUsage = memory.usedJSHeapSize / 1024 / 1024;
      
      setMemoryTrend(prev => {
        const newTrend = [...prev, currentUsage].slice(-10); // Keep last 10 readings
        
        // Simple leak detection: consistent upward trend
        if (newTrend.length >= 5) {
          const isIncreasing = newTrend.every((value, index) => 
            index === 0 || value >= newTrend[index - 1]
          );
          
          if (isIncreasing && newTrend[newTrend.length - 1] - newTrend[0] > 10) {
            setLeakDetected(true);
            if (import.meta.env.DEV) {
              console.warn('⚠️ Potential memory leak detected!');
            }
          }
        }
        
        return newTrend;
      });
    };

    const interval = setInterval(checkMemoryLeak, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    memoryTrend,
    leakDetected,
    resetLeakDetection: () => setLeakDetected(false)
  };
};