import React, { type ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { clsx } from 'clsx';

export interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = true,
  className
}) => {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none'
  };

  const paddingClasses = {
    true: 'px-4 sm:px-6 lg:px-8',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-6 sm:px-8',
    xl: 'px-8 sm:px-12'
  };

  return (
    <div
      className={clsx(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        padding && paddingClasses[padding === true ? 'true' : padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className
}) => {
  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const gridColsClasses: string[] = [];
  
  if (cols.xs) gridColsClasses.push(`grid-cols-${cols.xs}`);
  if (cols.sm) gridColsClasses.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) gridColsClasses.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) gridColsClasses.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) gridColsClasses.push(`xl:grid-cols-${cols.xl}`);
  if (cols['2xl']) gridColsClasses.push(`2xl:grid-cols-${cols['2xl']}`);

  return (
    <div
      className={clsx(
        'grid',
        ...gridColsClasses,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ResponsiveStackProps {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal' | {
    xs?: 'vertical' | 'horizontal';
    sm?: 'vertical' | 'horizontal';
    md?: 'vertical' | 'horizontal';
    lg?: 'vertical' | 'horizontal';
    xl?: 'vertical' | 'horizontal';
  };
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className
}) => {
  const spacingClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const directionClasses: string[] = ['flex'];

  if (typeof direction === 'string') {
    directionClasses.push(direction === 'vertical' ? 'flex-col' : 'flex-row');
  } else {
    // Responsive direction
    if (direction.xs) {
      directionClasses.push(direction.xs === 'vertical' ? 'flex-col' : 'flex-row');
    }
    if (direction.sm) {
      directionClasses.push(direction.sm === 'vertical' ? 'sm:flex-col' : 'sm:flex-row');
    }
    if (direction.md) {
      directionClasses.push(direction.md === 'vertical' ? 'md:flex-col' : 'md:flex-row');
    }
    if (direction.lg) {
      directionClasses.push(direction.lg === 'vertical' ? 'lg:flex-col' : 'lg:flex-row');
    }
    if (direction.xl) {
      directionClasses.push(direction.xl === 'vertical' ? 'xl:flex-col' : 'xl:flex-row');
    }
  }

  return (
    <div
      className={clsx(
        ...directionClasses,
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

export interface ShowProps {
  children: ReactNode;
  when: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
}

export const Show: React.FC<ShowProps> = ({ children, when }) => {
  const { breakpoints } = useResponsive();
  
  // Check if any of the conditions match current breakpoint
  const shouldShow = Object.entries(when).some(([breakpoint, show]) => {
    if (!show) return false;
    
    switch (breakpoint) {
      case 'xs':
        return breakpoints.isXs;
      case 'sm':
        return breakpoints.isSm && !breakpoints.isMd;
      case 'md':
        return breakpoints.isMd && !breakpoints.isLg;
      case 'lg':
        return breakpoints.isLg && !breakpoints.isXl;
      case 'xl':
        return breakpoints.isXl && !breakpoints.is2Xl;
      case '2xl':
        return breakpoints.is2Xl;
      default:
        return false;
    }
  });

  return shouldShow ? <>{children}</> : null;
};

export interface HideProps {
  children: ReactNode;
  when: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
}

export const Hide: React.FC<HideProps> = ({ children, when }) => {
  const { breakpoints } = useResponsive();
  
  // Check if any of the hide conditions match current breakpoint
  const shouldHide = Object.entries(when).some(([breakpoint, hide]) => {
    if (!hide) return false;
    
    switch (breakpoint) {
      case 'xs':
        return breakpoints.isXs;
      case 'sm':
        return breakpoints.isSm && !breakpoints.isMd;
      case 'md':
        return breakpoints.isMd && !breakpoints.isLg;
      case 'lg':
        return breakpoints.isLg && !breakpoints.isXl;
      case 'xl':
        return breakpoints.isXl && !breakpoints.is2Xl;
      case '2xl':
        return breakpoints.is2Xl;
      default:
        return false;
    }
  });

  return !shouldHide ? <>{children}</> : null;
};

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes,
  aspectRatio = 'video',
  objectFit = 'cover',
  className,
  loading = 'lazy'
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  };

  // Generate srcSet if sizes are provided
  let srcSet = '';
  if (sizes) {
    const entries = Object.entries(sizes);
    srcSet = entries
      .map(([breakpoint, size]) => `${size} ${getBreakpointWidth(breakpoint)}w`)
      .join(', ');
  }

  return (
    <img
      src={src}
      alt={alt}
      srcSet={srcSet || undefined}
      sizes={srcSet && sizes ? getSizesAttribute(sizes) : undefined}
      loading={loading}
      className={clsx(
        'w-full h-auto',
        typeof aspectRatio === 'string' ? aspectRatioClasses[aspectRatio] : `aspect-[${aspectRatio}]`,
        objectFitClasses[objectFit],
        className
      )}
    />
  );
};

// Helper functions
function getBreakpointWidth(breakpoint: string): number {
  const widths = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  return widths[breakpoint as keyof typeof widths] || 320;
}

function getSizesAttribute(sizes: Record<string, string>): string {
  const entries = Object.entries(sizes);
  return entries
    .map(([breakpoint, size], index) => {
      if (index === entries.length - 1) return size;
      return `(max-width: ${getBreakpointWidth(breakpoint)}px) ${size}`;
    })
    .join(', ');
}