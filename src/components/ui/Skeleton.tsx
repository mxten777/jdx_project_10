import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animated = true,
  ...props
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = animated ? 'animate-shimmer' : '';

  // 텍스트 라인 여러개 렌더링
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              animationClasses,
              index === lines - 1 ? 'w-3/4' : 'w-full' // 마지막 라인은 짧게
            )}
            style={{ 
              width: index === lines - 1 ? '75%' : width,
              height: height || '1rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        className
      )}
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      {...props}
    />
  );
};

// 🎯 Pre-built Skeleton Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 bg-white rounded-2xl shadow-sm border border-gray-100', className)}>
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" lines={2} />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonImage: React.FC<{ 
  className?: string; 
  aspectRatio?: string;
}> = ({ className, aspectRatio = '4/3' }) => (
  <div className={cn('relative overflow-hidden rounded-xl bg-gray-100', className)}>
    <div className={`aspect-[${aspectRatio}] w-full`}>
      <Skeleton className="w-full h-full" variant="rectangular" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 13l3 3.72L16 12l3 4H5l4-3z"/>
      </svg>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  className?: string; 
}> = ({ items = 3, className }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonProfile: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-3', className)}>
    <Skeleton variant="circular" width={40} height={40} />
    <div className="space-y-2">
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" width={80} />
    </div>
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton 
    variant="rounded" 
    width={120} 
    height={40} 
    className={cn('', className)} 
  />
);

// 🎨 Skeleton Gallery for Images
export const SkeletonGallery: React.FC<{ 
  items?: number; 
  className?: string;
  columns?: number;
}> = ({ items = 6, className, columns = 3 }) => (
  <div className={cn(
    'grid gap-4',
    columns === 2 && 'grid-cols-2',
    columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    columns === 4 && 'grid-cols-2 lg:grid-cols-4',
    className
  )}>
    {Array.from({ length: items }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
      >
        <SkeletonImage />
      </motion.div>
    ))}
  </div>
);

export default Skeleton;