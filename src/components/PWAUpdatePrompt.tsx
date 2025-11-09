import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAUpdatePromptProps {
  onClose?: () => void;
}

export const PWAUpdatePrompt: React.FC<PWAUpdatePromptProps> = ({ onClose }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  useEffect(() => {
    // Simulate update available for demo
    const timer = setTimeout(() => {
      if (Math.random() > 0.7) { // 30% chance to show update prompt
        setShowUpdatePrompt(true);
      }
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    // In a real app, this would trigger the service worker update
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">새 버전 업데이트</h3>
                  <p className="text-white/80 text-xs">새로운 기능이 추가되었습니다</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                더 나은 경험을 위해 앱을 업데이트해주세요.
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors duration-200"
                >
                  나중에
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-3 py-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  업데이트
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;