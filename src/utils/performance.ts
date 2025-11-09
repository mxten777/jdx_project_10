// Image optimization utilities
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  enableLazyLoading?: boolean;
}

// Lazy loading image component with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private imageQueue = new Set<HTMLImageElement>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before image comes into view
          threshold: 0.1
        }
      );
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
      this.imageQueue.add(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.imageQueue.clear();
  }
}

// WebP format detection and fallback
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(false);
      return;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 1, 1);
    
    canvas.toBlob((blob) => {
      resolve(blob !== null);
    }, 'image/webp');
  });
};

// Optimized image URL generator
export const generateOptimizedImageUrl = (
  originalUrl: string, 
  options: ImageOptimizationOptions = {}
): string => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 80,
    format = 'webp'
  } = options;

  // For Firebase Storage URLs, add transform parameters
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    const url = new URL(originalUrl);
    url.searchParams.set('w', maxWidth.toString());
    url.searchParams.set('h', maxHeight.toString());
    url.searchParams.set('q', quality.toString());
    if (format === 'webp') {
      url.searchParams.set('f', 'webp');
    }
    return url.toString();
  }

  return originalUrl;
};

// Image preloader for critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = async (urls: string[]): Promise<PromiseSettledResult<void>[]> => {
  const promises = urls.map(url => preloadImage(url));
  return Promise.allSettled(promises);
};

// Memory-efficient image cache
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private maxSize = 50; // Maximum number of cached images

  set(key: string, image: HTMLImageElement) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, image);
  }

  get(key: string): HTMLImageElement | undefined {
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

// Progressive image loading with blur effect
export const createProgressiveImageLoader = (
  container: HTMLElement,
  lowResSrc: string,
  highResSrc: string
) => {
  const lowResImg = new Image();
  const highResImg = new Image();
  
  // Load low-res image first
  lowResImg.onload = () => {
    container.style.backgroundImage = `url(${lowResSrc})`;
    container.style.filter = 'blur(5px)';
    container.classList.add('loaded');
    
    // Start loading high-res image
    highResImg.src = highResSrc;
  };
  
  // Replace with high-res when ready
  highResImg.onload = () => {
    container.style.backgroundImage = `url(${highResSrc})`;
    container.style.filter = 'none';
    container.classList.add('high-res-loaded');
  };
  
  lowResImg.src = lowResSrc;
};

// Bundle size analysis helper
export const logBundleInfo = () => {
  if (import.meta.env.DEV) {
    console.log('🎯 Performance Optimization Active');
    console.log('📦 Lazy loading enabled');
    console.log('🖼️ Image optimization active');
    console.log('⚡ Code splitting active');
  }
};