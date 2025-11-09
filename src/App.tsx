
import { useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/MainLayout';
import { LazyWrapper } from './components/LazyComponents';
import { logBundleInfo } from './utils/performance';
import { usePerformanceMonitor } from './hooks/usePerformance';

// Log performance info in development
logBundleInfo();

function App() {
  const { measureRenderTime } = usePerformanceMonitor();

  // Measure app render time
  const endRender = measureRenderTime('App');
  
  // Call endRender when component unmounts or re-renders
  useEffect(() => {
    return endRender;
  }, [endRender]);
  
  return (
    <NotificationProvider>
      <ToastProvider>
        <LazyWrapper>
          <MainLayout />
        </LazyWrapper>
      </ToastProvider>
    </NotificationProvider>
  );
}

export default App;
