// Security utilities and validation functions
export class SecurityValidator {
  // File upload validation
  static validateFileUpload(file: File): { isValid: boolean; error?: string } {
    const maxSize = parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE || '10485760'); // 10MB default
    const allowedTypes = (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
    
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 허용됩니다.`
      };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다. JPG, PNG, WebP, GIF만 허용됩니다.'
      };
    }
    
    return { isValid: true };
  }
  
  // Input sanitization for XSS prevention
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
  
  // HTML content sanitization
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  // URL validation
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
  
  // Email validation with enhanced pattern
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  // Password strength validation
  static validatePassword(password: string): { isValid: boolean; strength: number; feedback: string[] } {
    const feedback: string[] = [];
    let strength = 0;
    
    if (password.length < 8) {
      feedback.push('최소 8자 이상이어야 합니다');
    } else {
      strength += 1;
    }
    
    if (!/[a-z]/.test(password)) {
      feedback.push('소문자를 포함해야 합니다');
    } else {
      strength += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      feedback.push('대문자를 포함해야 합니다');
    } else {
      strength += 1;
    }
    
    if (!/\d/.test(password)) {
      feedback.push('숫자를 포함해야 합니다');
    } else {
      strength += 1;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('특수문자를 포함해야 합니다');
    } else {
      strength += 1;
    }
    
    return {
      isValid: strength >= 4,
      strength,
      feedback
    };
  }
  
  // Rate limiting utility
  static createRateLimiter(limit: number, windowMs: number = 60000) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }
      
      const userRequests = requests.get(identifier)!;
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= limit) {
        return false;
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true;
    };
  }
}

// Content Security Policy helper
export class CSPHelper {
  static generateCSPHeader(): string {
    const baseCSP = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://www.gstatic.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://*.firebaseapp.com', 'https://*.googleapis.com'],
      'connect-src': ["'self'", 'https://*.firebaseio.com', 'https://*.googleapis.com', 'wss://*.firebaseio.com'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    };
    
    return Object.entries(baseCSP)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }
  
  static applyCSP(): void {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.generateCSPHeader();
      document.head.appendChild(meta);
    }
  }
}

// Firebase Security Rules generator
export const generateFirebaseSecurityRules = () => {
  return `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Memories collection with enhanced security
    match /memories/{memoryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && validateMemoryData(request.resource.data)
        && request.resource.data.authorId == request.auth.uid;
      allow update: if request.auth != null 
        && (resource.data.authorId == request.auth.uid || isAdmin())
        && validateMemoryData(request.resource.data);
      allow delete: if request.auth != null 
        && (resource.data.authorId == request.auth.uid || isAdmin());
    }
    
    // Chat messages with rate limiting
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && validateChatMessage(request.resource.data)
        && request.resource.data.authorId == request.auth.uid
        && rateLimitCheck(request.auth.uid, 'chat', 10, 60); // 10 messages per minute
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && isAdmin();
    }
    
    // Admin functions
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Memory data validation
    function validateMemoryData(data) {
      return data.keys().hasAll(['title', 'description', 'authorId', 'createdAt']) &&
        data.title is string && data.title.size() <= 100 &&
        data.description is string && data.description.size() <= 1000 &&
        data.authorId is string &&
        data.createdAt is timestamp;
    }
    
    // Chat message validation
    function validateChatMessage(data) {
      return data.keys().hasAll(['content', 'authorId', 'createdAt']) &&
        data.content is string && data.content.size() <= 500 &&
        data.authorId is string &&
        data.createdAt is timestamp;
    }
    
    // Rate limiting function (simplified)
    function rateLimitCheck(userId, action, limit, windowSeconds) {
      return true; // Implement actual rate limiting logic
    }
  }
}

service firebase.storage {
  match /b/{bucket}/o {
    match /memories/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        resource.size < 10 * 1024 * 1024 && // 10MB limit
        resource.contentType.matches('image/.*');
    }
    
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        resource.size < 5 * 1024 * 1024 && // 5MB limit
        resource.contentType.matches('image/.*');
    }
  }
}
`;
};

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET'
  ];
  
  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      errors.push(`필수 환경변수 ${varName}가 설정되지 않았습니다`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Error logging with sanitization
export const secureLogger = {
  log: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[${new Date().toISOString()}] ${SecurityValidator.sanitizeInput(message)}`, data);
    }
  },
  
  error: (message: string, error?: Error) => {
    if (import.meta.env.DEV) {
      console.error(`[${new Date().toISOString()}] ${SecurityValidator.sanitizeInput(message)}`, error);
    }
    
    // In production, send to logging service
    if (import.meta.env.PROD) {
      // Implement secure error reporting
    }
  },
  
  warn: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.warn(`[${new Date().toISOString()}] ${SecurityValidator.sanitizeInput(message)}`, data);
    }
  }
};