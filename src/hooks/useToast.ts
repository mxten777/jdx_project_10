import { useContext } from 'react';
import { ToastContext, type Toast } from '../contexts/ToastContext';

// 🎯 Toast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearAllToasts } = context;

  // Convenience methods
  const toast = {
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, type: 'success', message }),
    
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, type: 'error', message }),
    
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, type: 'warning', message }),
    
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
      addToast({ ...options, type: 'info', message }),
    
    custom: (options: Omit<Toast, 'id'>) => addToast(options),
    
    dismiss: removeToast,
    dismissAll: clearAllToasts,
  };

  return toast;
};