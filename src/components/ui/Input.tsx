import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'glass';
  isLoading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    variant = 'default',
    isLoading = false,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'flex w-full rounded-xl border bg-white px-4 py-3 text-base transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'border-gray-200 focus:border-primary-500 focus:ring-primary-100',
      ghost: 'border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-100',
      glass: 'glass border-white/20 focus:border-white/40 focus:ring-primary-100/50'
    };
    
    const errorClasses = error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
      : '';
    
    const iconPadding = leftIcon ? 'pl-12' : rightIcon || isLoading ? 'pr-12' : '';

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          {/* Input Field */}
          <input
            type={type}
            className={cn(
              baseClasses,
              variantClasses[variant],
              errorClasses,
              iconPadding,
              className
            )}
            ref={ref}
            disabled={disabled || isLoading}
            {...props}
          />
          
          {/* Right Icon or Loading */}
          {(rightIcon || isLoading) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-600 animate-fade-in">
            {error}
          </p>
        )}
        
        {/* Hint Message */}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, type InputProps };
export default Input;