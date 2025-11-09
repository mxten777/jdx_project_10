import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

// 🎨 Button Variants
const buttonVariants = {
  // Size variants
  size: {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3.5 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl'
  },
  
  // Style variants
  variant: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md',
    accent: 'bg-gradient-to-r from-accent to-primary-500 hover:from-accent-hover hover:to-primary-600 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    glass: 'glass text-gray-800 dark:text-gray-200 hover:bg-white/30',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
  }
} as const;

type ButtonVariant = keyof typeof buttonVariants.variant;
type ButtonSize = keyof typeof buttonVariants.size;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

type MotionButtonProps = ButtonProps & HTMLMotionProps<'button'>;

const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          buttonVariants.size[size],
          buttonVariants.variant[variant],
          widthClass,
          className
        )}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {/* Left Icon */}
        {leftIcon && !isLoading && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {/* Button Text */}
        <span className={isLoading ? 'opacity-70' : ''}>
          {children}
        </span>
        
        {/* Right Icon */}
        {rightIcon && !isLoading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
export default Button;