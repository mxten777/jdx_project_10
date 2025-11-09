import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  hover?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

type MotionCardProps = CardProps & HTMLMotionProps<'div'>;

const Card = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ 
    className, 
    variant = 'default',
    hover = false,
    interactive = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-2xl transition-all duration-200';
    
    const variantClasses = {
      default: 'bg-white border border-gray-100 shadow-sm',
      glass: 'glass backdrop-blur-xl',
      elevated: 'bg-white shadow-lg hover:shadow-xl',
      bordered: 'bg-white border-2 border-gray-200 hover:border-primary-300'
    };
    
    const interactiveClasses = interactive 
      ? 'cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary-100' 
      : '';
    
    const hoverClasses = hover 
      ? 'hover:shadow-lg hover:-translate-y-1' 
      : '';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          interactiveClasses,
          hoverClasses,
          className
        )}
        initial={interactive ? { scale: 1 } : false}
        whileHover={interactive ? { scale: 1.02 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

// Card Content Component
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

// Card Footer Component
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-4 border-t border-gray-100', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

// Card Title Component
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900 leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

// Card Description Component
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 mt-2', className)}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardTitle, 
  CardDescription,
  type CardProps 
};

export default Card;