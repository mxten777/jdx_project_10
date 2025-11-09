




import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { useToast } from '../hooks/useToast';
import { useFirebaseUpload } from '../hooks/useFirebaseUpload';
import { useSecurity, useRateLimit } from '../hooks/useSecurity';
import { secureLogger } from '../utils/security';
// import { toError, getErrorCode } from '../utils/errorUtils';
import FileUploadDropzone from './ui/FileUploadDropzone';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import type { ProcessedImage } from '../utils/imageProcessing';
import { formatFileSize } from '../utils/imageProcessing';

export default function MemoryUpload() {
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [persons, setPersons] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const { sanitizeInput, validateFile } = useSecurity();
  const { checkRateLimit } = useRateLimit(5, 60000); // 5 uploads per minute
  
  const {
    uploadFiles,
    isUploading,
    uploadProgress,
    overallProgress,
    getUploadStats
  } = useFirebaseUpload({
    folder: 'memories',
    onProgress: (progress) => {
      secureLogger.log(`Uploading ${progress.fileName}: ${progress.progress}%`);
    },
    onError: (error) => {
      toast.error('업로드 실패', { title: '파일 업로드 오류' });
      secureLogger.error('Upload error', new Error(typeof error === 'string' ? error : 'Upload failed'));
    }
  });

  // 🎯 Handle form submission
  const handleSubmit = async () => {
    if (!text.trim() || selectedFiles.length === 0) {
      toast.warning('내용과 파일을 모두 입력해주세요.');
      return;
    }

    if (!auth.currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // 🔒 Security: Check rate limit
    if (!checkRateLimit(auth.currentUser.uid)) {
      toast.error('업로드 횟수 제한에 도달했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 🔒 Security: Validate all files
    for (const file of selectedFiles) {
      const validation = await validateFile(file.file);
      if (!validation.isValid) {
        toast.error(validation.error || '파일 검증에 실패했습니다.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 📤 Upload files to Firebase Storage
      toast.info('파일 업로드 중...', { duration: 0 });
      const uploadResults = await uploadFiles(selectedFiles);
      
      // ✅ Check upload success
      const successfulUploads = uploadResults.filter(r => r.success);
      if (successfulUploads.length === 0) {
        throw new Error('모든 파일 업로드에 실패했습니다.');
      }

      // 📝 Save to Firestore with sanitized inputs
      const urls = successfulUploads.map(r => r.url!);
      await addDoc(collection(firestore, 'memories'), {
        text: sanitizeInput(text.trim()),
        tags: tags.split(',').map(t => sanitizeInput(t.trim())).filter(Boolean),
        location: sanitizeInput(location.trim()),
        persons: persons.split(',').map(p => sanitizeInput(p.trim())).filter(Boolean),
        isPublic,
        urls,
        createdAt: Timestamp.now(),
        userEmail: auth.currentUser.email || '',
        authorId: auth.currentUser.uid, // Add for security rules
      });

      // 🎉 Success
      const stats = getUploadStats();
      toast.success(
        `추억이 성공적으로 업로드되었습니다! (${stats.successful}/${stats.total} 파일)`,
        { title: '업로드 완료' }
      );

      // 🔄 Reset form
      setText('');
      setTags('');
      setLocation('');
      setPersons('');
      setSelectedFiles([]);

    } catch (error) {
      secureLogger.error('Memory upload error', error as Error);
      toast.error(
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        { title: '업로드 실패' }
      );
    } finally {
      setIsSubmitting(false);
      toast.dismissAll(); // Clear upload progress toast
    }
  };

  // 📊 Calculate total file size
  const totalFileSize = selectedFiles.reduce((sum, file) => sum + file.compressedSize, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 🎯 Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          소중한 추억 업로드
        </h1>
        <p className="text-lg text-gray-600">
          친구들과 함께한 특별한 순간들을 공유해보세요
        </p>
      </motion.div>

      {/* 📤 File Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Card variant="glass" className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              파일 업로드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadDropzone
              onFilesSelected={setSelectedFiles}
              maxFiles={10}
              maxFileSize={50 * 1024 * 1024} // 50MB
              compressionOptions={{
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.85
              }}
            />

            {/* 📊 Upload Statistics */}
            {selectedFiles.length > 0 && (
              <motion.div
                className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h4 className="font-semibold text-blue-900 mb-2">업로드 요약</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">파일 수:</span>
                    <span className="ml-2 font-medium">{selectedFiles.length}개</span>
                  </div>
                  <div>
                    <span className="text-blue-600">총 크기:</span>
                    <span className="ml-2 font-medium">{formatFileSize(totalFileSize)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">압축률:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(selectedFiles.reduce((sum, f) => sum + f.compressionRatio, 0) / selectedFiles.length)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">상태:</span>
                    <span className="ml-2 font-medium text-green-600">준비 완료</span>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 📝 Memory Details Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              추억 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Memory Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추억 내용 *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="이 추억에 대해 자세히 설명해주세요..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 resize-none"
              />
            </div>

            {/* Tags */}
            <Input
              label="태그"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="졸업, 여행, 친구 (쉼표로 구분)"
              hint="검색하기 쉽도록 관련 태그를 입력해주세요"
            />

            {/* Location */}
            <Input
              label="장소"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="학교, 카페, 여행지 등"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />

            {/* People */}
            <Input
              label="함께한 사람들"
              value={persons}
              onChange={(e) => setPersons(e.target.value)}
              placeholder="홍길동, 김철수 (쉼표로 구분)"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
            />

            {/* Privacy Setting */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="isPublic" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-900">공개 설정</div>
                <div className="text-sm text-gray-500">
                  {isPublic ? '모든 사용자가 볼 수 있습니다' : '나만 볼 수 있습니다'}
                </div>
              </label>
              <div className="text-2xl">
                {isPublic ? '🌍' : '🔒'}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🚀 Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card variant="glass" className="border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h3 className="font-semibold text-gray-900">업로드 진행 중...</h3>
                    <p className="text-sm text-gray-500">전체 진행률: {overallProgress}%</p>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Individual File Progress */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadProgress.map((progress) => (
                    <div key={progress.fileIndex} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 truncate">{progress.fileName}</div>
                      <div className="text-gray-500">{progress.progress}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎯 Submit Button */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <Button
          size="lg"
          variant="accent"
          onClick={handleSubmit}
          disabled={!text.trim() || selectedFiles.length === 0 || isSubmitting || isUploading}
          isLoading={isSubmitting || isUploading}
          className="px-12 py-4 text-lg"
        >
          {isSubmitting || isUploading ? '업로드 중...' : '추억 공유하기'}
        </Button>
      </motion.div>
    </div>
  );
}
