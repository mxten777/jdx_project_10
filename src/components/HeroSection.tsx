import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';

const images = [
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
];

export default function HeroSection() {
  const [idx, setIdx] = useState(0);

  // 슬라이드 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center py-10 xs:py-16 bg-pastelBlue text-gray-900 w-full">
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl xs:text-4xl font-bold mb-4"
      >
        우리의 추억 다시보기
      </motion.h1>
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-lg h-56 xs:h-64 bg-cream rounded-xl shadow-lg flex items-center justify-center overflow-hidden"
      >
        <img
          src={images[idx]}
          alt="추억 사진"
          className="object-cover w-full h-full rounded-xl"
        />
      </motion.div>
      <div className="flex gap-2 mt-3">
        {images.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full ${i === idx ? 'bg-accent' : 'bg-softGray'}`}
            onClick={() => setIdx(i)}
            aria-label={`사진 ${i+1}번 보기`}
          />
        ))}
      </div>
    </section>
  );
}
