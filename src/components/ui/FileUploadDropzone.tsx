import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { compressImages, formatFileSize, generateVideoThumbnail, type ProcessedImage } from '../../utils/imageProcessing';

interface FileUploadDropzoneProps {
  onFilesSelected: (files: ProcessedImage[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  compressionOptions?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  };
  className?: string;
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'video/*'],
  compressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8
  },
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // 🎯 File validation
  const validateFiles = useCallback((files: File[]): File[] => {
    setError(null);
    
    const validFiles = files.filter(file => {
      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        setError(`파일 형식이 지원되지 않습니다: ${file.name}`);
        return false;
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        setError(`파일 크기가 너무 큽니다: ${file.name} (${formatFileSize(file.size)})`);
        return false;
      }
      
      return true;
    });
    
    // Check max files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      setError(`최대 ${maxFiles}개 파일까지 업로드 가능합니다.`);
      return validFiles.slice(0, maxFiles - uploadedFiles.length);
    }
    
    return validFiles;
  }, [acceptedTypes, maxFileSize, maxFiles, uploadedFiles.length]);

  // 🔄 Process files
  const processFiles = useCallback(async (files: File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      const processedImages = await compressImages(
        validFiles,
        compressionOptions,
        (progress) => setProcessingProgress(progress)
      );
      
      // Generate video thumbnails
      for (const processed of processedImages) {
        if (processed.file.type.startsWith('video/')) {
          try {
            const thumbnail = await generateVideoThumbnail(processed.file);
            processed.dataUrl = thumbnail;
          } catch (error) {
            console.warn('Failed to generate video thumbnail:', error);
          }
        }
      }
      
      const newFiles = [...uploadedFiles, ...processedImages];
      setUploadedFiles(newFiles);
      onFilesSelected(newFiles);
      
    } catch (error) {
      console.error('File processing error:', error);
      setError('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [validateFiles, compressionOptions, uploadedFiles, onFilesSelected]);

  // 🎯 Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  // 📁 File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // 🗑️ Remove file
  const removeFile = useCallback((index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  }, [uploadedFiles, onFilesSelected]);

  return (
    <div className={cn('w-full', className)}>
      {/* 📤 Dropzone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300',
          isDragOver
            ? 'border-primary-500 bg-primary-50 scale-105'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          isProcessing && 'pointer-events-none opacity-75'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={{ scale: isDragOver ? 1.05 : 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-24 h-24 mb-4">
                <svg className="w-full h-full animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">파일 처리 중...</p>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{processingProgress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload area content */}
        <div className="space-y-4">
          <motion.div
            className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center"
            animate={{
              scale: isDragOver ? 1.1 : 1,
              rotate: isDragOver ? 5 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? '파일을 놓아주세요' : '파일을 드래그하거나 클릭하여 업로드'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              최대 {maxFiles}개, 파일당 {formatFileSize(maxFileSize)} 이하
            </p>
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              파일 선택
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File preview grid */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {uploadedFiles.map((processedFile, index) => (
              <motion.div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                {/* File preview */}
                <img
                  src={processedFile.dataUrl}
                  alt={processedFile.file.name}
                  className="w-full h-full object-cover"
                />

                {/* File info overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                  <div className="text-white text-xs">
                    <p className="font-medium truncate">{processedFile.file.name}</p>
                    <p className="text-white/70">
                      {formatFileSize(processedFile.compressedSize)}
                      {processedFile.compressionRatio > 0 && (
                        <span className="text-green-300 ml-1">
                          (-{processedFile.compressionRatio}%)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="self-end w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* File type indicator */}
                {processedFile.file.type.startsWith('video/') && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                    <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    VIDEO
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadDropzone;