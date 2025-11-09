import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { imageUrls } from '../assets/images';
import { useNotifications } from '../hooks/useNotifications';

const images = imageUrls;

// 🎨 Hero Section 애니메이션 variants
const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const imageVariants = {
  enter: {
    opacity: 0,
    scale: 0.9,
    rotateY: 90
  },
  center: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateY: -90,
    transition: {
      duration: 0.4
    }
  }
};

export default function HeroSection() {
  const [idx, setIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🔄 슬라이드 자동 전환 (호버 시 일시정지)
  useEffect(() => {
    if (isHovered) return;
    
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isHovered]);

  // 🎯 이미지 변경 시 로딩 상태 초기화
  useEffect(() => {
    setImageLoaded(false);
  }, [idx]);

  return (
    <motion.section 
      className="relative flex flex-col items-center justify-center py-20 px-6 w-full overflow-hidden"
      variants={heroVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 🌊 Background Gradient & Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
      
      {/* ✨ Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-br from-yellow-200/30 to-green-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        {/* 🎯 Hero Title */}
        <motion.div variants={itemVariants} className="mb-16">
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 0.2 
            }}
          >
            우리의 추억
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 font-medium tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            소중한 순간들을 다시 만나보세요
          </motion.p>
        </motion.div>

        {/* 🖼️ Premium Image Carousel */}
        <motion.div 
          variants={itemVariants}
          className="relative mb-12"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <div className="relative w-full max-w-2xl mx-auto">
            {/* Glass Container */}
            <motion.div 
              className="glass-card p-8 relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Shimmer Effect */}
              {!imageLoaded && (
                <div className="absolute inset-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded-2xl" />
              )}
              
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-full h-full"
                  >
                    <ImageWithFallback
                      src={images[idx]}
                      alt={`추억 사진 ${idx + 1}`}
                      className={cn(
                        "w-full h-full object-cover",
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        console.error(`Hero image failed to load: ${images[idx]}`);
                        setImageLoaded(true); // Still show the fallback
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:scale-110"
                aria-label="이전 사진"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setIdx(i => (i + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:scale-110"
                aria-label="다음 사진"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {idx + 1} / {images.length}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 🎯 Enhanced Pagination Dots */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-center gap-3"
        >
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "relative transition-all duration-300 rounded-full",
                i === idx 
                  ? "w-8 h-3 bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg" 
                  : "w-3 h-3 bg-gray-300 hover:bg-gray-400 hover:scale-125"
              )}
              whileHover={{ scale: i === idx ? 1.1 : 1.25 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`사진 ${i + 1}번 보기`}
            >
              {i === idx && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"
                  layoutId="activeDot"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* 🎨 Call to Action */}
        <motion.div 
          variants={itemVariants}
          className="mt-16 space-y-4"
        >
          <motion.button
            className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">추억 둘러보기</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
          
          {/* 🔔 Notification Test Buttons */}
          <NotificationTestButtons />
        </motion.div>
      </div>
    </motion.section>
  );
}

// 🔔 Notification Test Component
const NotificationTestButtons: React.FC = () => {
  const { addNotification, requestPermission, showBrowserNotification } = useNotifications();

  const handleSuccessNotification = () => {
    addNotification({
      type: 'success',
      title: '성공!',
      message: '새로운 추억이 성공적으로 업로드되었습니다.',
      duration: 4000
    });
  };

  const handleErrorNotification = () => {
    addNotification({
      type: 'error',
      title: '오류 발생',
      message: '파일 업로드 중 문제가 발생했습니다. 다시 시도해주세요.',
      duration: 6000
    });
  };

  const handleWarningNotification = () => {
    addNotification({
      type: 'warning',
      title: '주의',
      message: '파일 크기가 큽니다. 업로드에 시간이 걸릴 수 있습니다.',
      action: {
        label: '계속하기',
        onClick: () => console.log('Continue clicked')
      }
    });
  };

  const handleInfoNotification = () => {
    addNotification({
      type: 'info',
      title: '새로운 기능',
      message: '이제 동영상도 업로드할 수 있습니다!',
      duration: 5000
    });
  };

  const handleBrowserNotification = async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      showBrowserNotification('JDX Alumni', {
        body: '새로운 동창회 소식이 있습니다!',
        tag: 'jdx-notification'
      });
    } else {
      addNotification({
        type: 'error',
        title: '권한 필요',
        message: '브라우저 알림을 위해 권한이 필요합니다.'
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <motion.button
        onClick={handleSuccessNotification}
        className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        성공 알림
      </motion.button>
      <motion.button
        onClick={handleErrorNotification}
        className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        오류 알림
      </motion.button>
      <motion.button
        onClick={handleWarningNotification}
        className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        경고 알림
      </motion.button>
      <motion.button
        onClick={handleInfoNotification}
        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        정보 알림
      </motion.button>
      <motion.button
        onClick={handleBrowserNotification}
        className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        브라우저 알림
      </motion.button>
    </div>
  );
};
