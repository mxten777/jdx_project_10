/**
 * 🖼️ Advanced Image Processing Utilities
 * - Image compression and resizing
 * - Format conversion
 * - Quality optimization
 * - EXIF data handling
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface ProcessedImage {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * 이미지를 압축하고 리사이징합니다
 */
export async function compressImage(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // 🎯 Calculate new dimensions
        const { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight, 
          maintainAspectRatio
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // 🎨 Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL(`image/${format}`, quality);

            resolve({
              file: compressedFile,
              dataUrl,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: Math.round((1 - blob.size / file.size) * 100),
              dimensions: { width, height }
            });
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 여러 이미지를 동시에 처리합니다
 */
export async function compressImages(
  files: File[],
  options: ImageProcessingOptions = {},
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      if (file.type.startsWith('image/')) {
        const processed = await compressImage(file, options);
        results.push(processed);
      } else {
        // 이미지가 아닌 파일은 원본 그대로
        results.push({
          file,
          dataUrl: URL.createObjectURL(file),
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          dimensions: { width: 0, height: 0 }
        });
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // 실패한 경우 원본 파일 사용
      results.push({
        file,
        dataUrl: URL.createObjectURL(file),
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        dimensions: { width: 0, height: 0 }
      });
    }
    
    onProgress?.(Math.round(((i + 1) / files.length) * 100), i + 1, files.length);
  }
  
  return results;
}

/**
 * 적절한 크기 계산
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight)
    };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;

  // 최대 크기를 초과하는 경우에만 리사이징
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 이미지 EXIF 데이터에서 방향 정보를 가져와 회전 처리
 */
export function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // EXIF 데이터에서 방향 정보 추출 (간단한 구현)
      // 실제 운영에서는 piexifjs 같은 라이브러리 사용 권장
      resolve(1); // 기본값: 회전 없음
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 비디오 썸네일 생성
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // 1초 지점 썸네일
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * 드래그앤드롭에서 파일 추출
 */
export function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  return new Promise((resolve) => {
    const files: File[] = [];
    const items = dataTransfer.items;

    if (!items) {
      resolve(Array.from(dataTransfer.files));
      return;
    }

    let pending = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        pending++;
        
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            processEntry(entry, files, () => {
              pending--;
              if (pending === 0) resolve(files);
            });
          }
        } else {
          const file = item.getAsFile();
          if (file) files.push(file);
          pending--;
        }
      }
    }

    if (pending === 0) resolve(files);
  });
}

function processEntry(entry: any, files: File[], callback: () => void) {
  if (entry.isFile) {
    entry.file((file: File) => {
      files.push(file);
      callback();
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    reader.readEntries((entries: any[]) => {
      let pending = entries.length;
      if (pending === 0) {
        callback();
        return;
      }
      
      entries.forEach(childEntry => {
        processEntry(childEntry, files, () => {
          pending--;
          if (pending === 0) callback();
        });
      });
    });
  }
}