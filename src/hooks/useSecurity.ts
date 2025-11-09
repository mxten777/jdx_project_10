import { useState, useCallback } from 'react';
import { SecurityValidator, secureLogger } from '../utils/security';

// Security validation hook
export const useSecurity = () => {
  const [isValidating, setIsValidating] = useState(false);
  
  const validateFile = useCallback(async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    setIsValidating(true);
    
    try {
      const validation = SecurityValidator.validateFileUpload(file);
      
      if (!validation.isValid) {
        secureLogger.warn('File validation failed', { 
          fileName: file.name, 
          fileSize: file.size, 
          fileType: file.type, 
          error: validation.error 
        });
      }
      
      return validation;
    } catch (error) {
      secureLogger.error('File validation error', error as Error);
      return {
        isValid: false,
        error: '파일 검증 중 오류가 발생했습니다.'
      };
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const sanitizeInput = useCallback((input: string): string => {
    return SecurityValidator.sanitizeInput(input);
  }, []);
  
  const validateEmail = useCallback((email: string): boolean => {
    return SecurityValidator.validateEmail(email);
  }, []);
  
  const validatePassword = useCallback((password: string) => {
    return SecurityValidator.validatePassword(password);
  }, []);
  
  return {
    isValidating,
    validateFile,
    sanitizeInput,
    validateEmail,
    validatePassword
  };
};

// Rate limiting hook
export const useRateLimit = (limit: number, windowMs: number = 60000) => {
  const rateLimiter = SecurityValidator.createRateLimiter(limit, windowMs);
  
  const checkRateLimit = useCallback((identifier: string): boolean => {
    const isAllowed = rateLimiter(identifier);
    
    if (!isAllowed) {
      secureLogger.warn('Rate limit exceeded', { identifier, limit, windowMs });
    }
    
    return isAllowed;
  }, [rateLimiter, limit, windowMs]);
  
  return { checkRateLimit };
};

// Secure form validation hook
export const useSecureForm = <T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Record<keyof T, (value: unknown) => { isValid: boolean; message?: string }>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValid, setIsValid] = useState(false);
  
  const { sanitizeInput } = useSecurity();
  
  const validateField = useCallback((field: keyof T, value: unknown) => {
    const rule = validationRules[field];
    if (rule) {
      const result = rule(value);
      setErrors(prev => ({
        ...prev,
        [field]: result.isValid ? undefined : result.message
      }));
      return result.isValid;
    }
    return true;
  }, [validationRules]);
  
  const setValue = useCallback((field: keyof T, value: unknown) => {
    // Sanitize string inputs
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setValues(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    validateField(field, sanitizedValue);
  }, [sanitizeInput, validateField]);
  
  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let allValid = true;
    
    Object.keys(values).forEach(key => {
      const field = key as keyof T;
      const rule = validationRules[field];
      if (rule) {
        const result = rule(values[field]);
        if (!result.isValid) {
          newErrors[field] = result.message;
          allValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    setIsValid(allValid);
    
    return allValid;
  }, [values, validationRules]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValid(false);
  }, [initialValues]);
  
  return {
    values,
    errors,
    isValid,
    setValue,
    validateAll,
    reset
  };
};

// Session security hook
export const useSessionSecurity = () => {
  const [sessionValid, setSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);
  
  const checkSession = useCallback(() => {
    const now = Date.now();
    const isExpired = now - lastActivity > SESSION_TIMEOUT;
    
    if (isExpired && sessionValid) {
      setSessionValid(false);
      secureLogger.warn('Session expired due to inactivity');
    }
    
    return !isExpired;
  }, [lastActivity, sessionValid, SESSION_TIMEOUT]);
  
  const extendSession = useCallback(() => {
    setLastActivity(Date.now());
    setSessionValid(true);
  }, []);
  
  return {
    sessionValid,
    checkSession,
    updateActivity,
    extendSession
  };
};