import { useState, useCallback } from 'react';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  type UploadTaskSnapshot 
} from 'firebase/storage';
import { app } from '../firebase';
import type { ProcessedImage } from '../utils/imageProcessing';

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName: string;
}

interface UseFirebaseUploadOptions {
  folder?: string;
  generateThumbnails?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
}

export const useFirebaseUpload = (options: UseFirebaseUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const {
    folder = 'memories',
    onProgress,
    onComplete,
    onError
  } = options;

  // 🚀 Upload multiple files
  const uploadFiles = useCallback(async (files: ProcessedImage[]): Promise<UploadResult[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    setUploadProgress([]);
    setUploadResults([]);
    setOverallProgress(0);

    const storage = getStorage(app);
    const results: UploadResult[] = [];
    const progressMap = new Map<number, UploadProgress>();

    // 📊 Calculate overall progress
    const updateOverallProgress = () => {
      const totalProgress = Array.from(progressMap.values())
        .reduce((sum, p) => sum + p.progress, 0);
      const overall = Math.round(totalProgress / files.length);
      setOverallProgress(overall);
    };

    try {
      // 🔄 Upload files concurrently
      const uploadPromises = files.map(async (processedFile, index) => {
        const { file } = processedFile;
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
        const filePath = `${folder}/${fileName}`;
        const storageRef = ref(storage, filePath);

        return new Promise<UploadResult>((resolve) => {
          const uploadTask = uploadBytesResumable(storageRef, file);

          // 📈 Track upload progress
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              
              const progressInfo: UploadProgress = {
                fileIndex: index,
                fileName: file.name,
                progress,
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                state: snapshot.state as 'running' | 'paused' | 'success' | 'error'
              };

              progressMap.set(index, progressInfo);
              setUploadProgress(Array.from(progressMap.values()));
              updateOverallProgress();
              onProgress?.(progressInfo);
            },
            (error) => {
              // ❌ Upload error
              console.error(`Upload failed for ${file.name}:`, error);
              const result: UploadResult = {
                success: false,
                error: error.message,
                fileName: file.name
              };
              results[index] = result;
              resolve(result);
            },
            async () => {
              // ✅ Upload successful
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const result: UploadResult = {
                  success: true,
                  url: downloadURL,
                  fileName: file.name
                };
                results[index] = result;
                resolve(result);
              } catch (error) {
                const result: UploadResult = {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  fileName: file.name
                };
                results[index] = result;
                resolve(result);
              }
            }
          );
        });
      });

      // 🔄 Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // 📊 Final results
      setUploadResults(results);
      setOverallProgress(100);
      
      // ✅ Check for any failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        const errorMessage = `${failures.length}개 파일 업로드 실패: ${failures.map(f => f.fileName).join(', ')}`;
        onError?.(errorMessage);
      }

      onComplete?.(results);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [folder, onProgress, onComplete, onError]);

  // 🛑 Cancel all uploads
  const cancelUploads = useCallback(() => {
    // Implementation for canceling uploads would go here
    // This requires keeping track of upload tasks
    setIsUploading(false);
    setUploadProgress([]);
    setOverallProgress(0);
  }, []);

  // 🔄 Retry failed uploads
  const retryFailedUploads = useCallback(async (originalFiles: ProcessedImage[]) => {
    const failedResults = uploadResults.filter(r => !r.success);
    const failedFiles = originalFiles.filter((_, index) => 
      failedResults.some(r => r.fileName === originalFiles[index].file.name)
    );

    if (failedFiles.length > 0) {
      return await uploadFiles(failedFiles);
    }

    return [];
  }, [uploadResults, uploadFiles]);

  // 📊 Get upload statistics
  const getUploadStats = useCallback(() => {
    const total = uploadResults.length;
    const successful = uploadResults.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    return {
      total,
      successful,
      failed,
      successRate
    };
  }, [uploadResults]);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadResults,
    overallProgress,
    
    // Actions
    uploadFiles,
    cancelUploads,
    retryFailedUploads,
    
    // Utils
    getUploadStats
  };
};

export default useFirebaseUpload;