// Lazy loaded components for performance optimization
import { lazy, Suspense } from 'react';
import { Skeleton } from './ui/Skeleton';

// Lazy load main components
export const LazyMemoryList = lazy(() => import('./MemoryList'));
export const LazyMemoryDetail = lazy(() => import('./MemoryDetail'));
export const LazyMemoryUpload = lazy(() => import('./MemoryUpload'));
export const LazyEventPage = lazy(() => import('./EventPage'));
export const LazyChatRoom = lazy(() => import('./ChatRoom'));
export const LazyAdminDashboard = lazy(() => import('./AdminDashboard'));
export const LazyMyProfile = lazy(() => import('./MyProfile'));
export const LazyTimeline = lazy(() => import('./Timeline'));

// Loading wrapper component
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper = ({ children, fallback }: LazyWrapperProps) => (
  <Suspense 
    fallback={
      fallback || (
        <div className="min-h-screen flex flex-col space-y-4 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )
    }
  >
    {children}
  </Suspense>
);

// Specific loading components for different sections
export const MemoryListLoading = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProfileLoading = () => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  </div>
);

export const ChatLoading = () => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b border-white/10">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className="max-w-xs space-y-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      ))}
    </div>
    <div className="p-4 border-t border-white/10">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);